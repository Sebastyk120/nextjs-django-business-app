"""
Vista de cotización conjunta para usuario final.
Replica la funcionalidad de CotizacionConjuntaView del admin pero con template de usuario.
"""
import json
import math
from decimal import Decimal

from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import reverse_lazy
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView

from .forms import ClientePresentacionEditorForm, CostoPresentacionClienteEditorForm, PresentacionInsumoClienteFormSet
from .models import (
    Cliente, Aerolinea, Iata, ClientePresentacion,
    CostoPresentacionCliente, CostosEstibado, TarifaAerea,
    CostosUnicosEmbarque, ListaPreciosFrutaExportador, Contenedor,
    CotizacionConjuntaHistorico, Referencias, Insumo
)

def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro

@method_decorator(login_required, name='dispatch')
@method_decorator(user_passes_test(es_miembro_del_grupo('Heavens'), login_url=reverse_lazy('home')), name='dispatch')
class CotizacionConjuntaUsuarioView(TemplateView):
    """Vista de cotización conjunta para usuario final."""
    template_name = 'cotizacion_conjunta_usuario.html'
    http_method_names = ['get', 'post']

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        request = self.request
        
        clientes = Cliente.objects.all().order_by('nombre')
        aerolineas = Aerolinea.objects.all().order_by('nombre')
        destinos = Iata.objects.all().order_by('codigo')

        cliente_id = request.GET.get('cliente') or request.POST.get('cliente')
        aerolinea_id = request.GET.get('aerolinea') or request.POST.get('aerolinea')
        destino_id = request.GET.get('destino') or request.POST.get('destino')
        tipo_negociacion = request.GET.get('tipo_negociacion') or request.POST.get('tipo_negociacion') or 'CIF'
        trm_str = request.GET.get('trm') or request.POST.get('trm') or '4000'
        utilidad_general_str = request.GET.get('utilidad_general_pct') or request.POST.get('utilidad_general_pct') or '15'
        heavens_pct_str = request.GET.get('heavens_pct') or request.POST.get('heavens_pct') or '35'
        exportador_pct_str = request.GET.get('exportador_pct') or request.POST.get('exportador_pct') or '65'

        cps = ClientePresentacion.objects.none()
        if cliente_id:
            cps = ClientePresentacion.objects.filter(cliente_id=cliente_id).select_related('fruta', 'presentacion', 'referencia')

        distribucion = {}
        cont_map = {}
        total_cajas = 0
        
        # Procesar actualización de costos si es solicitada
        if request.method == 'POST' and 'update_costo' in request.POST:
            try:
                cp_id_update = request.POST.get('cp_id')
                cp_obj = ClientePresentacion.objects.get(id=cp_id_update)
                
                # 1. Update CostoPresentacionCliente (Local)
                cpc_obj = CostoPresentacionCliente.objects.filter(cliente_presentacion=cp_obj).first()
                if cpc_obj:
                    cpc_obj.mano_obra_cop = Decimal(request.POST.get('mano_obra_cop', '0'))
                    cpc_obj.deshidratacion_fruta = Decimal(request.POST.get('deshidratacion_pct', '0'))
                    cpc_obj.margen_adicional_usd = Decimal(request.POST.get('margen_adicional_usd', '0'))
                    cpc_obj.save()
                
                # 2. Update Referencia (Global Cost)
                ref_obj = cp_obj.referencia
                if ref_obj:
                    ref_obj.precio = Decimal(request.POST.get('referencia_precio', '0'))
                    ref_obj.cantidad_pallet_con_contenedor = int(request.POST.get('referencia_pallet_con', '0') or '0')
                    ref_obj.cantidad_pallet_sin_contenedor = int(request.POST.get('referencia_pallet_sin', '0'))
                    ref_obj.cant_contenedor = int(request.POST.get('referencia_cant_contenedor', '0') or '0')
                    ref_obj.porcentaje_peso_bruto = Decimal(request.POST.get('referencia_peso_bruto', '0'))
                    
                    # 3. Update Contenedor selection (can be changed or cleared)
                    contenedor_id = request.POST.get('referencia_contenedor', '')
                    if contenedor_id and contenedor_id != '':
                        try:
                            ref_obj.contenedor = Contenedor.objects.get(id=int(contenedor_id))
                            # Also update contenedor price if provided
                            if 'contenedor_precio' in request.POST:
                                ref_obj.contenedor.precio = Decimal(request.POST.get('contenedor_precio', '0') or '0')
                                ref_obj.contenedor.save()
                        except (Contenedor.DoesNotExist, ValueError):
                            pass
                    else:
                        # Clear contenedor if none selected
                        ref_obj.contenedor = None
                    
                    ref_obj.save()

                    messages.success(request, f"Costos y Referencia actualizados para {cp_obj.fruta} - {cp_obj.presentacion}")
            except Exception as e:
                messages.error(request, f"Error actualizando costos: {str(e)}")

        if request.method == 'POST':
            for cp in cps:
                val = request.POST.get(f'cajas_{cp.id}', '')
                try:
                    n = int(val) if val else 0
                except Exception:
                    n = 0
                # Store the value as-is for form repopulation
                cp.entered_boxes = val if val and val != '0' else ''
                is_checked = bool(request.POST.get(f'cont_{cp.id}', ''))
                cont_map[cp.id] = is_checked
                cp.checked_state = is_checked
                if n > 0:
                    distribucion[cp.id] = n
                    total_cajas += n
        else:
            for cp in cps:
                cp.checked_state = cp.referencia.contenedor if cp.referencia else False

        trm = Decimal(trm_str or '4000')
        utilidad_general_pct = Decimal(utilidad_general_str or '15')
        heavens_pct = Decimal(heavens_pct_str or '35')
        exportador_pct = Decimal(exportador_pct_str or '65')

        rows = []
        total_pallets = 0
        errores_map = {}
        cp_map = {cp.id: cp for cp in cps}
        tarifa_activa = False
        global_errors = []
        estibado_por_caja_usd_global = Decimal('0')
        
        if aerolinea_id and destino_id:
            tarifa_activa = TarifaAerea.objects.filter(aerolinea_id=aerolinea_id, destino_id=destino_id, es_activa=True).first()
            if tipo_negociacion == 'CIF' and not tarifa_activa:
                a = Aerolinea.objects.filter(id=aerolinea_id).first()
                d = Iata.objects.filter(id=destino_id).first()
                global_errors.append(f'No se calculará CIF: tarifa aérea no disponible o inactiva para Aerolínea "{a.nombre if a else aerolinea_id}" y Destino "{d.codigo if d else destino_id}"')
        
        if total_cajas > 0:
            suma_frac_pallets = Decimal('0')
            suma_costos_pallet_ponderado = Decimal('0')
            for cp in cps:
                cajas_item = distribucion.get(cp.id, 0)
                if cajas_item <= 0:
                    continue
                ref = cp.referencia
                use_cont = cont_map.get(cp.id, bool(ref.contenedor) if ref else False)
                cpc = CostoPresentacionCliente.objects.filter(cliente_presentacion=cp).first()
                if not cpc:
                    errores_map[cp.id] = [f'No existe configuración de costos (CostoPresentacionCliente) para esta presentación']
                    continue
                v = cpc.validar_campos_para_calculo(use_cont)
                if not v['ok']:
                    errores_map[cp.id] = v['errores']
                    continue
                cap = (ref.cantidad_pallet_con_contenedor if use_cont else ref.cantidad_pallet_sin_contenedor)
                frac = Decimal(cajas_item) / Decimal(cap)
                suma_frac_pallets += frac
                # Obtener costos de estibado generales
                ce = CostosEstibado.objects.filter(es_activo=True).first()
                costo_pallet_cop = ce.costo_total if ce else Decimal('0')
                costo_pallet_usd = (costo_pallet_cop / (trm or Decimal('1')))
                suma_costos_pallet_ponderado += (costo_pallet_usd * frac)

            total_pallets = int(math.ceil(float(suma_frac_pallets)))
            costo_prom_pallet_usd_global = (suma_costos_pallet_ponderado / suma_frac_pallets) if suma_frac_pallets else Decimal('0')
            estibado_por_caja_usd_global = (Decimal(total_pallets) * costo_prom_pallet_usd_global / Decimal(total_cajas)) if total_cajas else Decimal('0')

            for cp in cps:
                cajas_item = distribucion.get(cp.id, 0)
                if cajas_item <= 0:
                    continue
                ref = cp.referencia
                use_cont = cont_map.get(cp.id, bool(ref.contenedor) if ref else False)
                cpc = CostoPresentacionCliente.objects.filter(cliente_presentacion=cp).first()
                if not cpc:
                    # Only add error if not already tracked in first loop
                    if cp.id not in errores_map:
                        errores_map[cp.id] = [f'No existe configuración de costos (CostoPresentacionCliente) para esta presentación']
                    continue
                v = cpc.validar_campos_para_calculo(use_cont)
                if not v['ok']:
                    errores_map[cp.id] = v['errores']
                    continue
                cap = (ref.cantidad_pallet_con_contenedor if use_cont else ref.cantidad_pallet_sin_contenedor)
                d = cpc.get_desglose_costos(total_cajas_pedido=total_cajas, trm=trm, cajas_item=cajas_item, use_contenedor=use_cont, aerolinea_id=aerolinea_id, destino_id=destino_id)
                
                # Use original calculation for base_otros (this determines FOB BOX in results table)
                base_otros = d['insumos_usd'] + d['fruta_usd'] + d['referencia_usd'] + d['contenedor_usd'] + d['mano_obra_usd'] + d['costos_embarque_base_usd']
                base_usd_caja = base_otros + estibado_por_caja_usd_global
                include_cif = (tipo_negociacion == 'CIF' and tarifa_activa)
                cif_usd_caja = (base_usd_caja + d['costos_cif_usd'] + d['tarifa_aerea_usd']) if include_cif else None
                kilos_base = cp.presentacion.kilos or Decimal('1')
                pct_deshidratacion = cpc.deshidratacion_fruta or Decimal('0')
                pct_peso_bruto = ref.porcentaje_peso_bruto or Decimal('0')
                # Kilos CIF = kilos netos × (1 + deshidratación%) × (1 + peso_bruto%)
                factor_deshidratacion = (Decimal('1') + (pct_deshidratacion / Decimal('100')))
                factor_peso_bruto = (Decimal('1') + (pct_peso_bruto / Decimal('100')))
                kilos_cif = kilos_base * factor_deshidratacion * factor_peso_bruto
                fob_kg = base_usd_caja / kilos_base
                cif_kg = (cif_usd_caja / kilos_cif) if include_cif else None
                fob_box = base_usd_caja
                margen_adicional = cpc.margen_adicional_usd or Decimal('0')
                
                # Cálculo de precio FOB con utilidad general
                denom_utilidad = (Decimal('1') - (utilidad_general_pct / Decimal('100')))
                denom_utilidad = denom_utilidad if denom_utilidad > 0 else Decimal('1')
                precio_final_fob = (fob_box / denom_utilidad) + margen_adicional
                
                # La utilidad total es sobre FOB
                utilidad_total = precio_final_fob - fob_box - margen_adicional
                util_heavens = utilidad_total * (heavens_pct / Decimal('100'))
                util_exportador = utilidad_total * (exportador_pct / Decimal('100'))
                
                # Para CIF: agregar costos CIF al precio FOB
                costos_adicionales_cif = (d['costos_cif_usd'] + d['tarifa_aerea_usd']) if include_cif else Decimal('0')
                precio_final_cif = (precio_final_fob + costos_adicionales_cif) if include_cif else None

                # Prepara datos para el modal (asegurando tipos JSON serializables)
                # Add calculated values to breakdown
                d['precio_final_fob_usd'] = float(precio_final_fob)
                d['utilidad_total_usd'] = float(utilidad_total)
                d['fob_box_usd'] = float(fob_box)  # The exact FOB BOX value shown in results table
                
                
                
                # --- NEW: Detailed Data Fetching for Modal ---
                # A. CIF & Airline Details
                cif_details = {}
                airline_info = {}
                shipment_costs_base = {}
                
                # Buscar primero registro específico para la combinación aerolinea-destino
                costos_especificos = None
                if aerolinea_id and destino_id:
                    costos_especificos = CostosUnicosEmbarque.objects.filter(
                        aerolinea_id=aerolinea_id,
                        destino_id=destino_id,
                        es_activo=True
                    ).first()
                
                # Si no hay registro específico, usar el registro por defecto
                costos_default = CostosUnicosEmbarque.objects.filter(
                    aerolinea__isnull=True,
                    destino__isnull=True,
                    es_activo=True
                ).first()
                
                # Usar específico si existe, sino default
                costos_a_usar = costos_especificos if costos_especificos else costos_default
                
                if costos_a_usar:
                    # Base FOB shipment costs (in COP)
                    shipment_costs_base = {
                        'transporte_aeropuerto': float(costos_a_usar.transporte_aeropuerto or 0),
                        'termo': float(costos_a_usar.termo or 0),
                        'precinto': float(costos_a_usar.precinto or 0),
                        'aduana': float(costos_a_usar.aduana or 0),
                        'comision_bancaria': float(costos_a_usar.comision_bancaria or 0),
                    }
                    # CIF costs (in USD)
                    cif_details = {
                        'due_agent': float(costos_a_usar.due_agent_usd or 0),
                        'due_carrier': float(costos_a_usar.due_carrier_usd or 0),
                        'fito': float(costos_a_usar.fito_usd or 0),
                        'certificado_origen': float(costos_a_usar.certificado_origen_usd or 0),
                    }
                
                if include_cif and tarifa_activa:
                    airline_info = {
                        'nombre': tarifa_activa.aerolinea.nombre if tarifa_activa.aerolinea else 'N/A',
                        'destino': f"{tarifa_activa.destino.codigo} - {tarifa_activa.destino.ciudad} - {tarifa_activa.destino.pais}" if tarifa_activa.destino else 'N/A',
                        'tarifa_kilo': float(tarifa_activa.tarifa_por_kilo or 0)
                    }
                
                # B. Fruit Details - Calculate for modal display
                try:
                    precio_fruta_obj = ListaPreciosFrutaExportador.objects.get(fruta=cp.fruta, exportadora=cp.exportador)
                    precio_kilo_arranca = float(precio_fruta_obj.precio_kilo or 0)
                except:
                    precio_kilo_arranca = 0
                
                kilos_ajustados_val = float(cpc.kilos_ajustados() or 0)
                costo_fruta_neto = float(cpc.costo_fruta_por_caja or 0)
                costo_fruta_ajustado = precio_kilo_arranca * kilos_ajustados_val  # In COP
                
                # Add adjusted fruit cost to breakdown for modal display
                d['fruta_ajustada_usd'] = costo_fruta_ajustado / float(trm)
                
                # C. Reference & Container
                ref_data = {}
                if cp.referencia:
                    ref_data = {
                        'nombre': cp.referencia.nombre or 'N/A',
                        'referencia_nueva': cp.referencia.referencia_nueva or 'N/A',
                        'precio': float(cp.referencia.precio or 0),
                        'pallet_con': int(cp.referencia.cantidad_pallet_con_contenedor or 0),
                        'pallet_sin': int(cp.referencia.cantidad_pallet_sin_contenedor or 0),
                        'cant_contenedor': int(cp.referencia.cant_contenedor or 0),
                        'peso_bruto_pct': float(cp.referencia.porcentaje_peso_bruto or 0),
                        'contenedor_id': cp.referencia.contenedor.id if cp.referencia.contenedor else None,
                        'contenedor_precio': float(cp.referencia.contenedor.precio or 0) if cp.referencia.contenedor else 0,
                        'has_contenedor': bool(cp.referencia.contenedor)
                    }
                
                
                # D. Stowing Costs Detail
                stowing_data = {}
                costo_est_obj = CostosEstibado.objects.filter(es_activo=True).first()
                if costo_est_obj:
                    stowing_data = {
                        'nombre': costo_est_obj.nombre or 'N/A',
                        'estiba': float(costo_est_obj.estiba or 0),
                        'malla_tela': float(costo_est_obj.malla_tela or 0),
                        'malla_termica': float(costo_est_obj.malla_termica or 0),
                        'esquineros_zuncho': float(costo_est_obj.esquineros_zuncho or 0),
                        'entrega': float(costo_est_obj.entrega or 0),
                    }
                    stowing_data['total_cop'] = sum([stowing_data['estiba'], stowing_data['malla_tela'], 
                                                      stowing_data['malla_termica'], stowing_data['esquineros_zuncho'], 
                                                      stowing_data['entrega']])
                    stowing_data['total_usd'] = stowing_data['total_cop'] / float(trm)
                
                # E. Pallet Calculations
                pallet_calcs = {
                    'total_boxes': int(total_cajas),
                    'boxes_per_pallet': int(cap),
                    'total_pallets': total_pallets,
                    'stowing_per_box_usd': float(estibado_por_caja_usd_global)
                }
                
                # F. Weight Calculations
                weight_calcs = {
                    'kilos_base': float(kilos_base),
                    'pct_deshidratacion': float(pct_deshidratacion),
                    'factor_deshidratacion': float(factor_deshidratacion),
                    'kilos_fob': float(kilos_base * factor_deshidratacion),
                    'pct_peso_bruto': float(pct_peso_bruto),
                    'factor_peso_bruto': float(factor_peso_bruto),
                    'kilos_cif_unit': float(kilos_cif) if include_cif else 0,
                    'peso_fob_total': float(kilos_base * factor_deshidratacion * total_cajas),
                    'peso_cif_total': float(kilos_cif * total_cajas) if include_cif else 0,
                }
                
                # G. Sale Price & Profit Details
                sale_details = {
                    'utilidad_pct': float(utilidad_general_pct),
                    'precio_fob': float(precio_final_fob),
                    'precio_cif': float(precio_final_cif) if include_cif else 0,
                    'utilidad_total': float(utilidad_total),
                    'utilidad_heavens': float(util_heavens),
                    'utilidad_heavens_pct': float(heavens_pct),
                    'utilidad_exportador': float(util_exportador),
                    'utilidad_exportador_pct': float(exportador_pct),
                    'fob_per_kg': float(fob_kg),
                    'cif_per_kg': float(cif_kg) if include_cif else 0,
                }

                # Helper function to ensure JSON serializability
                def to_serializable(obj):
                    if isinstance(obj, Decimal):
                        return float(obj)
                    elif isinstance(obj, (bool, int, float, str, type(None))):
                        return obj
                    elif isinstance(obj, dict):
                        return {k: to_serializable(v) for k, v in obj.items()}
                    elif isinstance(obj, (list, tuple)):
                        return [to_serializable(item) for item in obj]
                    else:
                        return str(obj)  # Convert any other type to string
                
                modal_data = {
                    'breakdown': to_serializable(d),
                    'cif_breakdown': cif_details,
                    'airline_info': airline_info,
                    'shipment_costs_base': shipment_costs_base,
                    'stowing_data': stowing_data,
                    'pallet_calcs': pallet_calcs,
                    'weight_calcs': weight_calcs,
                    'sale_details': sale_details,
                    'fruit_analysis': {
                        'precio_kilo': precio_kilo_arranca,
                        'kilos_neto': float(cp.presentacion.kilos or 0),
                        'kilos_ajustados': kilos_ajustados_val,
                        'costo_caja_neto': costo_fruta_neto,
                        'costo_caja_ajustado': costo_fruta_ajustado,
                        'delta_deshidratacion': costo_fruta_ajustado - costo_fruta_neto
                    },
                    'ref_data': ref_data,
                    'config': {
                        'cp_id': cp.id,
                        'cliente': cp.cliente.nombre if cp.cliente else 'N/A',
                        'exportador': cp.exportador.nombre if cp.exportador else 'N/A',
                        'mano_obra_cop': float(cpc.mano_obra_cop or 0),
                        'deshidratacion_pct': float(cpc.deshidratacion_fruta or 0),
                        'margen_adicional_usd': float(cpc.margen_adicional_usd or 0),
                        'costo_insumos_cop': float(cpc.costo_insumos or 0),
                        'trm': float(trm),
                        'is_cif': include_cif,
                    },
                    'meta': {
                        'fruta': cp.fruta.nombre,
                        'presentacion': cp.presentacion.nombre,
                        'kilos_neto': float(kilos_base),
                        'kilos_cif': float(kilos_cif) if include_cif else 0,
                    }
                }

                rows.append({
                    'cp': cp,
                    'kilos': kilos_base,
                    'kilos_cif': float(kilos_cif) if include_cif else None,
                    'pct_peso_bruto': float(pct_peso_bruto),
                    'boxes': cajas_item,
                    'pallets_item': math.ceil(cajas_item / cap),
                    'fob_kg': float(fob_kg),
                    'cif_kg': float(cif_kg) if include_cif else None,
                    'fob_box': float(fob_box),
                    'cif_box': float(cif_usd_caja) if include_cif else None,
                    'use_cont': use_cont,
                    'precio_final_fob': float(precio_final_fob),
                    'precio_final_cif': float(precio_final_cif) if include_cif else None,
                    'util_heavens': float(util_heavens),
                    'util_exportador': float(util_exportador),
                    'util_heavens': float(util_heavens),
                    'util_exportador': float(util_exportador),
                    'utilidad_total': float(utilidad_total),
                    'modal_data_json': json.dumps(to_serializable(modal_data)),
                })

            # Aprobación en lote
            if self.request.POST.get('aprobar') == '1':
                def to_jsonable(value):
                    if isinstance(value, Decimal):
                        return float(value)
                    if isinstance(value, dict):
                        return {k: to_jsonable(v) for k, v in value.items()}
                    if isinstance(value, (list, tuple)):
                        return [to_jsonable(v) for v in value]
                    return value

                aprobadas = 0
                items_para_historico = []  # Lista para guardar items del snapshot
                
                # Capturar costos globales usados en este momento
                costos_globales = {}
                
                # Costos de embarque
                costos_embarque_obj = None
                if aerolinea_id and destino_id:
                    costos_embarque_obj = CostosUnicosEmbarque.objects.filter(
                        aerolinea_id=aerolinea_id,
                        destino_id=destino_id,
                        es_activo=True
                    ).first()
                if not costos_embarque_obj:
                    costos_embarque_obj = CostosUnicosEmbarque.objects.filter(
                        aerolinea__isnull=True,
                        destino__isnull=True,
                        es_activo=True
                    ).first()
                
                if costos_embarque_obj:
                    costos_globales['costos_embarque'] = {
                        'id': costos_embarque_obj.id,
                        'aerolinea': costos_embarque_obj.aerolinea.nombre if costos_embarque_obj.aerolinea else None,
                        'destino': costos_embarque_obj.destino.codigo if costos_embarque_obj.destino else None,
                        'transporte_aeropuerto': float(costos_embarque_obj.transporte_aeropuerto or 0),
                        'termo': float(costos_embarque_obj.termo or 0),
                        'precinto': float(costos_embarque_obj.precinto or 0),
                        'aduana': float(costos_embarque_obj.aduana or 0),
                        'comision_bancaria': float(costos_embarque_obj.comision_bancaria or 0),
                        'due_agent_usd': float(costos_embarque_obj.due_agent_usd or 0),
                        'due_carrier_usd': float(costos_embarque_obj.due_carrier_usd or 0),
                        'fito_usd': float(costos_embarque_obj.fito_usd or 0),
                        'certificado_origen_usd': float(costos_embarque_obj.certificado_origen_usd or 0),
                    }
                
                # Costos de estibado
                costos_estibado_obj = CostosEstibado.objects.filter(es_activo=True).first()
                if costos_estibado_obj:
                    costos_globales['costos_estibado'] = {
                        'id': costos_estibado_obj.id,
                        'nombre': costos_estibado_obj.nombre,
                        'estiba': float(costos_estibado_obj.estiba or 0),
                        'malla_tela': float(costos_estibado_obj.malla_tela or 0),
                        'malla_termica': float(costos_estibado_obj.malla_termica or 0),
                        'esquineros_zuncho': float(costos_estibado_obj.esquineros_zuncho or 0),
                        'entrega': float(costos_estibado_obj.entrega or 0),
                        'costo_total': float(costos_estibado_obj.costo_total),
                    }
                
                # Tarifa aérea activa
                if tarifa_activa:
                    costos_globales['tarifa_aerea'] = {
                        'id': tarifa_activa.id,
                        'aerolinea': tarifa_activa.aerolinea.nombre if tarifa_activa.aerolinea else None,
                        'destino_codigo': tarifa_activa.destino.codigo if tarifa_activa.destino else None,
                        'destino_ciudad': tarifa_activa.destino.ciudad if tarifa_activa.destino else None,
                        'destino_pais': tarifa_activa.destino.pais if tarifa_activa.destino else None,
                        'tarifa_por_kilo': float(tarifa_activa.tarifa_por_kilo or 0),
                    }
                
                costos_globales['estibado_por_caja_usd_global'] = float(estibado_por_caja_usd_global)
                
                for cp in cps:
                    cajas_item = distribucion.get(cp.id, 0)
                    if cajas_item <= 0:
                        continue
                    cpc = CostoPresentacionCliente.objects.filter(cliente_presentacion=cp).first()
                    if not cpc:
                        continue
                    use_cont = cont_map.get(cp.id, bool(cp.referencia.contenedor) if cp.referencia else False)
                    v = cpc.validar_campos_para_calculo(use_cont)
                    if not v['ok']:
                        errores_map[cp.id] = v['errores']
                        continue
                    d = cpc.get_desglose_costos(total_cajas_pedido=total_cajas, trm=trm, cajas_item=cajas_item, use_contenedor=use_cont, aerolinea_id=aerolinea_id, destino_id=destino_id)
                    # Usar estibado global
                    d['estibado_usd'] = estibado_por_caja_usd_global
                    base_otros = d['insumos_usd'] + d['fruta_usd'] + d['referencia_usd'] + d['contenedor_usd'] + d['mano_obra_usd'] + d['costos_embarque_base_usd']
                    base_usd_caja = base_otros + d['estibado_usd']
                    include_cif = (tipo_negociacion == 'CIF' and tarifa_activa)
                    
                    # Lógica de utilidad
                    margen_adicional = cpc.margen_adicional_usd or Decimal('0')
                    denom_utilidad = (Decimal('1') - (utilidad_general_pct / Decimal('100')))
                    denom_utilidad = denom_utilidad if denom_utilidad > 0 else Decimal('1')
                    precio_final_fob = (base_usd_caja / denom_utilidad) + margen_adicional
                    
                    utilidad_total = precio_final_fob - base_usd_caja - margen_adicional
                    util_heavens = utilidad_total * (heavens_pct / Decimal('100'))
                    util_exportador = utilidad_total * (exportador_pct / Decimal('100'))
                    
                    costos_adicionales_cif = (d['costos_cif_usd'] + d['tarifa_aerea_usd']) if include_cif else Decimal('0')
                    precio_final = precio_final_fob + costos_adicionales_cif

                    d['precio_final_usd'] = precio_final
                    d['precio_final_fob_usd'] = precio_final_fob
                    d['utilidad_total_usd'] = utilidad_total
                    d['total_cajas'] = total_cajas
                    d['cajas_item'] = cajas_item
                    d['pallets_total'] = total_pallets
                    d['utilidad_general_pct'] = float(utilidad_general_pct)
                    d['porcentaje_heavens'] = float(heavens_pct)
                    d['porcentaje_exportador'] = float(exportador_pct)
                    d['use_contenedor'] = bool(use_cont)

                    cpc.trm_aprobacion = trm
                    cpc.fecha_aprobacion = timezone.now()
                    cpc.desglose_aprobado = to_jsonable(d)
                    cpc.aprobada = True
                    cpc.save()
                    aprobadas += 1
                    
                    # === Construir item para el snapshot histórico ===
                    # Capturar precio de fruta usado
                    try:
                        precio_fruta_obj = ListaPreciosFrutaExportador.objects.get(
                            fruta=cp.fruta, exportadora=cp.exportador
                        )
                        precio_kilo_usado = float(precio_fruta_obj.precio_kilo or 0)
                    except ListaPreciosFrutaExportador.DoesNotExist:
                        precio_kilo_usado = 0
                    
                    # Capturar datos de referencia y contenedor
                    ref = cp.referencia
                    ref_snapshot = {}
                    if ref:
                        ref_snapshot = {
                            'id': ref.id,
                            'nombre': ref.nombre,
                            'referencia_nueva': ref.referencia_nueva,
                            'precio': float(ref.precio or 0),
                            'cantidad_pallet_con_contenedor': ref.cantidad_pallet_con_contenedor,
                            'cantidad_pallet_sin_contenedor': ref.cantidad_pallet_sin_contenedor,
                            'cant_contenedor': ref.cant_contenedor,
                            'porcentaje_peso_bruto': float(ref.porcentaje_peso_bruto or 0),
                        }
                        if ref.contenedor:
                            ref_snapshot['contenedor'] = {
                                'id': ref.contenedor.id,
                                'nombre': ref.contenedor.nombre,
                                'precio': float(ref.contenedor.precio or 0),
                            }
                    
                    # Capturar insumos usados
                    insumos_snapshot = []
                    for pic in cp.insumos_personalizados.select_related('insumo').all():
                        insumos_snapshot.append({
                            'insumo_nombre': pic.insumo.nombre,
                            'insumo_precio': float(pic.insumo.precio or 0),
                            'cantidad': float(pic.cantidad_efectiva),
                            'costo_total': float(pic.costo_total),
                        })
                    
                    # Calcular kilos
                    kilos_base = float(cp.presentacion.kilos or 0)
                    pct_deshidratacion = float(cpc.deshidratacion_fruta or 0)
                    pct_peso_bruto = float(ref.porcentaje_peso_bruto or 0) if ref else 0
                    factor_deshidratacion = 1 + (pct_deshidratacion / 100)
                    factor_peso_bruto = 1 + (pct_peso_bruto / 100)
                    kilos_fob = kilos_base * factor_deshidratacion
                    kilos_cif = kilos_fob * factor_peso_bruto if include_cif else 0
                    
                    item_snapshot = {
                        'cliente_presentacion_id': cp.id,
                        'meta': {
                            'fruta': cp.fruta.nombre,
                            'presentacion': cp.presentacion.nombre,
                            'kilos_neto': kilos_base,
                            'exportador': cp.exportador.nombre if cp.exportador else None,
                        },
                        'cajas': cajas_item,
                        'use_contenedor': bool(use_cont),
                        'pallets_item': int(math.ceil(cajas_item / (ref.cantidad_pallet_con_contenedor if use_cont else ref.cantidad_pallet_sin_contenedor) if ref else 1)),
                        
                        # Costos breakdown
                        'breakdown': to_jsonable(d),
                        
                        # Precios calculados
                        'fob_box': float(base_usd_caja),
                        'cif_box': float(base_usd_caja + costos_adicionales_cif) if include_cif else None,
                        'precio_final_fob': float(precio_final_fob),
                        'precio_final_cif': float(precio_final) if include_cif else None,
                        
                        # Utilidades
                        'utilidad_total': float(utilidad_total),
                        'util_heavens': float(util_heavens),
                        'util_exportador': float(util_exportador),
                        
                        # Kilos
                        'kilos_fob': kilos_fob,
                        'kilos_cif': kilos_cif,
                        
                        # Snapshots de datos usados
                        'fruta_snapshot': {
                            'nombre': cp.fruta.nombre,
                            'precio_kilo': precio_kilo_usado,
                        },
                        'referencia_snapshot': ref_snapshot,
                        'insumos_snapshot': insumos_snapshot,
                        'config_snapshot': {
                            'mano_obra_cop': float(cpc.mano_obra_cop or 0),
                            'deshidratacion_pct': pct_deshidratacion,
                            'margen_adicional_usd': float(margen_adicional),
                        },
                    }
                    items_para_historico.append(item_snapshot)
                
                # === Crear el registro histórico si hay items aprobados ===
                if aprobadas > 0:
                    # Cabecera snapshot
                    cliente_obj = Cliente.objects.filter(id=cliente_id).first() if cliente_id else None
                    aerolinea_obj = Aerolinea.objects.filter(id=aerolinea_id).first() if aerolinea_id else None
                    destino_obj = Iata.objects.filter(id=destino_id).first() if destino_id else None
                    
                    cabecera_snapshot = {
                        'cliente': cliente_obj.nombre if cliente_obj else None,
                        'cliente_direccion': cliente_obj.direccion if cliente_obj else None,
                        'cliente_ciudad': cliente_obj.ciudad if cliente_obj else None,
                        'aerolinea': aerolinea_obj.nombre if aerolinea_obj else None,
                        'aerolinea_codigo': aerolinea_obj.codigo if aerolinea_obj else None,
                        'destino_codigo': destino_obj.codigo if destino_obj else None,
                        'destino_ciudad': destino_obj.ciudad if destino_obj else None,
                        'destino_pais': destino_obj.pais if destino_obj else None,
                    }
                    
                    # Calcular totales
                    total_utilidad = sum(item.get('utilidad_total', 0) for item in items_para_historico)
                    total_util_heavens = sum(item.get('util_heavens', 0) for item in items_para_historico)
                    total_util_exportador = sum(item.get('util_exportador', 0) for item in items_para_historico)
                    
                    totales_snapshot = {
                        'total_cajas': total_cajas,
                        'total_pallets': total_pallets,
                        'total_items': len(items_para_historico),
                        'total_utilidad_usd': total_utilidad,
                        'total_util_heavens_usd': total_util_heavens,
                        'total_util_exportador_usd': total_util_exportador,
                    }
                    
                    # Crear el registro histórico
                    historico = CotizacionConjuntaHistorico(
                        numero_cotizacion=CotizacionConjuntaHistorico.generar_numero_cotizacion(),
                        cliente=cliente_obj,
                        aerolinea=aerolinea_obj,
                        destino=destino_obj,
                        tipo_negociacion=tipo_negociacion,
                        trm=trm,
                        utilidad_general_pct=utilidad_general_pct,
                        heavens_pct=heavens_pct,
                        exportador_pct=exportador_pct,
                        total_cajas=total_cajas,
                        total_pallets=total_pallets,
                        estibado_por_caja_usd=estibado_por_caja_usd_global,
                        cabecera_snapshot=cabecera_snapshot,
                        costos_globales_snapshot=costos_globales,
                        items_snapshot=items_para_historico,
                        totales_snapshot=totales_snapshot,
                        usuario=self.request.user if self.request.user.is_authenticated else None,
                    )
                    historico.save()
                    
                    messages.success(self.request, f"Se aprobaron {aprobadas} cotizaciones con TRM {trm}. Cotización guardada: {historico.numero_cotizacion}")
                else:
                    messages.success(self.request, f"Se aprobaron {aprobadas} cotizaciones con TRM {trm}.")
                
                if errores_map:
                    messages.warning(self.request, f"{len(errores_map)} presentaciones no se aprobaron por datos faltantes.")

        errores_detalle = []
        if errores_map:
            for cid, errs in errores_map.items():
                cp = cp_map.get(cid)
                errores_detalle.append({
                    'id': cid,
                    'nombre': f"{cp.fruta} / {cp.presentacion}" if cp else str(cid),
                    'errores': errs,
                })
            messages.warning(self.request, f"{len(errores_detalle)} presentaciones no se calcularon por datos faltantes.")

        context.update({
            'clientes': clientes,
            'aerolineas': aerolineas,
            'destinos': destinos,
            'contenedores': Contenedor.objects.all().order_by('nombre'),
            'cliente_id': cliente_id,
            'aerolinea_id': aerolinea_id,
            'destino_id': destino_id,
            'tipo_negociacion': tipo_negociacion,
            'trm': trm,
            'utilidad_general_pct': utilidad_general_pct,
            'heavens_pct': heavens_pct,
            'exportador_pct': exportador_pct,
            'cps': cps,
            'rows': rows,
            'total_cajas': total_cajas,
            'total_pallets': total_pallets,
            'estibado_por_caja_usd_global': estibado_por_caja_usd_global,
            'errores_map': errores_map,
            'errores_detalle': errores_detalle,
            'errores_count': len(errores_detalle),
            'global_errors': global_errors,
            'tarifa_activa': bool(tarifa_activa),  # Convert to boolean for JSON serialization
            'cif_enabled': (tipo_negociacion == 'CIF' and tarifa_activa),
        })
        return context

    def post(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        return self.render_to_response(context)

# VISTAS AJAX PARA EDITOR DE PRODUCTO
# -------------------------------------------------------------------------

def load_referencias_json(request):
    exportador_id = request.GET.get('exportador_id')
    referencias = Referencias.objects.none()
    if exportador_id:
        referencias = Referencias.objects.filter(exportador_id=exportador_id).order_by('nombre')
    
    data = [{'id': r.id, 'nombre': r.nombre} for r in referencias]
    return JsonResponse(data, safe=False)


def cotizacion_editor_producto(request, cp_id):
    cp = get_object_or_404(ClientePresentacion, id=cp_id)
    costo_obj, created = CostoPresentacionCliente.objects.get_or_create(cliente_presentacion=cp)
    
    if request.method == 'POST':
        form_cp = ClientePresentacionEditorForm(request.POST, instance=cp)
        form_costo = CostoPresentacionClienteEditorForm(request.POST, instance=costo_obj)
        formset_insumos = PresentacionInsumoClienteFormSet(request.POST, instance=cp, prefix='insumos')
        
        if form_cp.is_valid() and form_costo.is_valid() and formset_insumos.is_valid():
            form_cp.save()
            form_costo.save()
            formset_insumos.save()
            return JsonResponse({'success': True})
        else:
            # If invalid, re-render the modal content with errors
            return render(request, 'comercial/partials/modal_editor_producto.html', {
                'cp': cp,
                'form_cp': form_cp,
                'form_costo': form_costo,
                'formset_insumos': formset_insumos,
                'error': 'Por favor corrija los errores del formulario.'
            })
            
    else:
        form_cp = ClientePresentacionEditorForm(instance=cp)
        form_costo = CostoPresentacionClienteEditorForm(instance=costo_obj)
        formset_insumos = PresentacionInsumoClienteFormSet(instance=cp, prefix='insumos')
    
    return render(request, 'comercial/partials/modal_editor_producto.html', {
        'cp': cp,
        'form_cp': form_cp,
        'form_costo': form_costo,
        'formset_insumos': formset_insumos
    })


@login_required 
def manage_insumos(request):
    """
    Vista AJAX para gestionar (listar, crear, editar) Insumos.
    Recibe JSON en POST.
    """
    if request.method == 'GET':
        insumos = Insumo.objects.all().order_by('nombre').values('id', 'nombre', 'precio', 'unidad_medida')
        return JsonResponse({'insumos': list(insumos)})
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            
            if action == 'create':
                insumo = Insumo.objects.create(
                    nombre=data.get('nombre'),
                    precio=data.get('precio', 0),
                    unidad_medida=data.get('unidad_medida', '')
                )
                return JsonResponse({
                    'success': True, 
                    'insumo': {
                        'id': insumo.id, 
                        'nombre': insumo.nombre, 
                        'precio': float(insumo.precio or 0), 
                        'unidad_medida': insumo.unidad_medida
                    }
                })
                
            elif action == 'update':
                insumo_id = data.get('id')
                insumo = get_object_or_404(Insumo, id=insumo_id)
                insumo.nombre = data.get('nombre')
                insumo.precio = data.get('precio', 0)
                insumo.unidad_medida = data.get('unidad_medida', '')
                insumo.save()
                return JsonResponse({
                    'success': True, 
                    'insumo': {
                        'id': insumo.id, 
                        'nombre': insumo.nombre, 
                        'precio': float(insumo.precio or 0), 
                        'unidad_medida': insumo.unidad_medida
                    }
                })
                
            return JsonResponse({'success': False, 'error': 'Acción inválida'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
            
    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)





