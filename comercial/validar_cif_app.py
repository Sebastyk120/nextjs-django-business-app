# ============================================================================
# INFORME DETALLADO DE COSTOS CIF - SISTEMA DE COTIZACIÓN
# ============================================================================
# Este script simula EXACTAMENTE los cálculos de CotizacionConjuntaView
# para validar y auditar cada componente del costo.
#
# Ejecutar con: exec(open('validar_cif_app.py').read())
# ============================================================================

from decimal import Decimal, ROUND_HALF_UP
import math
from comercial.models import (
    CostoPresentacionCliente, CostosUnicosEmbarque, TarifaAerea, 
    CostosEstibado, ClientePresentacion, ListaPreciosFrutaExportador
)

# ============================================================================
# PARÁMETROS DE LA COTIZACIÓN (modificar según la prueba)
# ============================================================================
TRM = Decimal('3750')
TOTAL_CAJAS = 340
UTILIDAD_GENERAL_PCT = Decimal('10')
HEAVENS_PCT = Decimal('35')
EXPORTADOR_PCT = Decimal('65')

def separador(titulo=""):
    print("\n" + "=" * 80)
    if titulo:
        print(f"  {titulo}")
        print("=" * 80)

def subseparador(titulo=""):
    print(f"\n{'─' * 40}")
    if titulo:
        print(f"  {titulo}")
        print("─" * 40)

def valor(nombre, val, unidad="", formula=""):
    if formula:
        print(f"  {nombre}: {val} {unidad}  ← {formula}")
    else:
        print(f"  {nombre}: {val} {unidad}")

def calculo(descripcion, resultado, formula):
    print(f"  → {descripcion}")
    print(f"    Fórmula: {formula}")
    print(f"    Resultado: {resultado}")

# ============================================================================
# INICIO DEL INFORME
# ============================================================================
separador("INFORME DETALLADO DE COSTOS CIF")
print(f"  Fecha de generación: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"  TRM: ${TRM:,.2f} COP/USD")
print(f"  Total cajas cotizadas: {TOTAL_CAJAS}")
print(f"  Utilidad general: {UTILIDAD_GENERAL_PCT}%")
print(f"  Distribución Heavens/Exportador: {HEAVENS_PCT}%/{EXPORTADOR_PCT}%")

# ============================================================================
# 1. OBTENCIÓN DE DATOS BASE
# ============================================================================
separador("1. DATOS BASE DEL REGISTRO")

cpc = CostoPresentacionCliente.objects.first()
if not cpc:
    print("  ❌ ERROR: No hay registros en CostoPresentacionCliente")
    exit()

cp = cpc.cliente_presentacion
ref = cp.referencia
presentacion = cp.presentacion

subseparador("1.1 Cliente y Presentación")
valor("ID CostoPresentacionCliente", cpc.id)
valor("Cliente", cp.cliente)
valor("Fruta", cp.fruta)
valor("Presentación", presentacion)
valor("Exportador", cp.exportador)

subseparador("1.2 Referencia (Caja)")
valor("Nombre referencia", ref.nombre)
valor("Referencia nueva", ref.referencia_nueva or "N/A")
valor("Precio caja (COP)", f"${ref.precio:,.2f}" if ref.precio else "N/A")
valor("Cajas por pallet (sin contenedor)", ref.cantidad_pallet_sin_contenedor)
valor("Cajas por pallet (con contenedor)", ref.cantidad_pallet_con_contenedor)
valor("Porcentaje peso bruto", f"{ref.porcentaje_peso_bruto}%")

subseparador("1.3 Datos de la Presentación")
kilos_base = presentacion.kilos or Decimal('1')
valor("Kilos netos por caja", f"{kilos_base} kg")

subseparador("1.4 Parámetros del CostoPresentacionCliente")
valor("Costo insumos (COP)", f"${cpc.costo_insumos:,.2f}" if cpc.costo_insumos else "$0")
valor("Mano de obra (COP/kg)", f"${cpc.mano_obra_cop:,.2f}" if cpc.mano_obra_cop else "$0")
valor("Deshidratación fruta", f"{cpc.deshidratacion_fruta}%" if cpc.deshidratacion_fruta else "0%")
valor("Margen adicional (USD)", f"${cpc.margen_adicional_usd:,.2f}" if cpc.margen_adicional_usd else "$0")

# ============================================================================
# 2. TARIFA AÉREA
# ============================================================================
separador("2. TARIFA AÉREA")

tarifa = TarifaAerea.objects.filter(es_activa=True).first()
if tarifa:
    aerolinea_id = tarifa.aerolinea_id
    destino_id = tarifa.destino_id
    valor("Aerolínea", tarifa.aerolinea)
    valor("Destino", tarifa.destino)
    valor("Tarifa por kilo", f"${tarifa.tarifa_por_kilo} USD/kg")
    valor("Estado", "✅ Activa")
    tarifa_activa = True
else:
    print("  ⚠️ No hay tarifa aérea activa configurada")
    aerolinea_id = None
    destino_id = None
    tarifa_activa = False

# ============================================================================
# 3. COSTOS ÚNICOS DE EMBARQUE
# ============================================================================
separador("3. COSTOS ÚNICOS DE EMBARQUE")

ce_embarque = CostosUnicosEmbarque.objects.filter(
    aerolinea_id=aerolinea_id, 
    destino_id=destino_id
).first()

if ce_embarque:
    subseparador("3.1 Costos Base FOB (en COP)")
    valor("Transporte aeropuerto", f"${ce_embarque.transporte_aeropuerto:,.2f}" if ce_embarque.transporte_aeropuerto else "$0")
    valor("Termo (termoregistro)", f"${ce_embarque.termo:,.2f}" if ce_embarque.termo else "$0")
    valor("Precinto", f"${ce_embarque.precinto:,.2f}" if ce_embarque.precinto else "$0")
    valor("Aduana", f"${ce_embarque.aduana:,.2f}" if ce_embarque.aduana else "$0")
    valor("Comisión bancaria", f"${ce_embarque.comision_bancaria:,.2f}" if ce_embarque.comision_bancaria else "$0")
    
    costos_base_cop = (
        (ce_embarque.transporte_aeropuerto or Decimal('0')) +
        (ce_embarque.termo or Decimal('0')) +
        (ce_embarque.precinto or Decimal('0')) +
        (ce_embarque.aduana or Decimal('0')) +
        (ce_embarque.comision_bancaria or Decimal('0'))
    )
    print(f"\n  TOTAL COSTOS BASE FOB (COP): ${costos_base_cop:,.2f}")
    print(f"  → Por caja ({TOTAL_CAJAS} cajas): ${costos_base_cop / TOTAL_CAJAS:,.2f} COP")
    print(f"  → En USD (TRM {TRM}): ${(costos_base_cop / TOTAL_CAJAS / TRM):.4f}")
    
    subseparador("3.2 Costos CIF Adicionales (en USD)")
    valor("Due Agent", f"${ce_embarque.due_agent_usd:,.2f}" if ce_embarque.due_agent_usd else "$0")
    valor("Due Carrier", f"${ce_embarque.due_carrier_usd:,.2f}" if ce_embarque.due_carrier_usd else "$0")
    valor("Fito", f"${ce_embarque.fito_usd:,.2f}" if ce_embarque.fito_usd else "$0")
    valor("Certificado de Origen", f"${ce_embarque.certificado_origen_usd:,.2f}" if ce_embarque.certificado_origen_usd else "$0")
    
    costos_cif_total_usd = (
        (ce_embarque.due_agent_usd or Decimal('0')) +
        (ce_embarque.due_carrier_usd or Decimal('0')) +
        (ce_embarque.fito_usd or Decimal('0')) +
        (ce_embarque.certificado_origen_usd or Decimal('0'))
    )
    print(f"\n  TOTAL COSTOS CIF (USD): ${costos_cif_total_usd:,.2f}")
    print(f"  → Por caja ({TOTAL_CAJAS} cajas): ${costos_cif_total_usd / TOTAL_CAJAS:.4f}")
else:
    print("  ⚠️ No hay costos de embarque configurados para esta ruta")
    costos_cif_total_usd = Decimal('0')

# ============================================================================
# 4. COSTOS DE ESTIBADO
# ============================================================================
separador("4. COSTOS DE ESTIBADO")

ce_estibado = CostosEstibado.objects.filter(es_activo=True).first()
if ce_estibado:
    valor("Nombre", ce_estibado.nombre)
    valor("Estiba", f"${ce_estibado.estiba:,.2f}" if ce_estibado.estiba else "$0")
    valor("Malla tela", f"${ce_estibado.malla_tela:,.2f}" if ce_estibado.malla_tela else "$0")
    valor("Malla térmica", f"${ce_estibado.malla_termica:,.2f}" if ce_estibado.malla_termica else "$0")
    valor("Esquineros y zuncho", f"${ce_estibado.esquineros_zuncho:,.2f}" if ce_estibado.esquineros_zuncho else "$0")
    valor("Entrega", f"${ce_estibado.entrega:,.2f}" if ce_estibado.entrega else "$0")
    costo_pallet_cop = ce_estibado.costo_total
    print(f"\n  TOTAL POR PALLET (COP): ${costo_pallet_cop:,.2f}")
else:
    print("  ⚠️ No hay costos de estibado configurados")
    costo_pallet_cop = Decimal('0')

# ============================================================================
# 5. PRECIO DE LA FRUTA
# ============================================================================
separador("5. PRECIO DE LA FRUTA")

try:
    precio_fruta = ListaPreciosFrutaExportador.objects.get(
        fruta=cp.fruta,
        exportadora=cp.exportador
    )
    valor("Fruta", cp.fruta)
    valor("Exportador", cp.exportador)
    valor("Precio por kilo", f"${precio_fruta.precio_kilo:,.2f} COP")
    costo_fruta_caja = kilos_base * precio_fruta.precio_kilo
    print(f"\n  Cálculo costo fruta por caja:")
    print(f"  → {kilos_base} kg × ${precio_fruta.precio_kilo:,.2f}/kg = ${costo_fruta_caja:,.2f} COP")
except ListaPreciosFrutaExportador.DoesNotExist:
    print("  ⚠️ No hay precio de fruta configurado")
    costo_fruta_caja = Decimal('0')

# ============================================================================
# 6. CÁLCULO DE PALLETS Y ESTIBADO GLOBAL
# ============================================================================
separador("6. CÁLCULO DE PALLETS Y ESTIBADO GLOBAL")

use_cont = False
cajas_por_pallet = ref.cantidad_pallet_sin_contenedor if not use_cont else ref.cantidad_pallet_con_contenedor

subseparador("6.1 Distribución de Pallets")
valor("Cajas totales", TOTAL_CAJAS)
valor("Cajas por pallet", cajas_por_pallet)
fraccion_pallets = Decimal(TOTAL_CAJAS) / Decimal(cajas_por_pallet)
total_pallets = int(math.ceil(float(fraccion_pallets)))
print(f"\n  Cálculo de pallets:")
print(f"  → Fracción: {TOTAL_CAJAS} / {cajas_por_pallet} = {fraccion_pallets:.4f}")
print(f"  → Total pallets (redondeado arriba): {total_pallets}")

subseparador("6.2 Costo Estibado por Caja (Prorrateado)")
costo_pallet_usd = costo_pallet_cop / TRM
print(f"  Costo por pallet: ${costo_pallet_cop:,.2f} COP = ${costo_pallet_usd:.4f} USD")
estibado_por_caja_usd = (Decimal(total_pallets) * costo_pallet_usd) / Decimal(TOTAL_CAJAS)
print(f"\n  Cálculo estibado por caja:")
print(f"  → ({total_pallets} pallets × ${costo_pallet_usd:.4f}) / {TOTAL_CAJAS} cajas")
print(f"  → ESTIBADO POR CAJA: ${estibado_por_caja_usd:.4f} USD")

# ============================================================================
# 7. CÁLCULO DE KILOS (FOB vs CIF)
# ============================================================================
separador("7. CÁLCULO DE KILOS")

pct_deshidratacion = cpc.deshidratacion_fruta or Decimal('0')
pct_peso_bruto = ref.porcentaje_peso_bruto or Decimal('0')

factor_deshidratacion = Decimal('1') + (pct_deshidratacion / Decimal('100'))
factor_peso_bruto = Decimal('1') + (pct_peso_bruto / Decimal('100'))

kilos_con_deshidratacion = kilos_base * factor_deshidratacion
kilos_cif = kilos_base * factor_deshidratacion * factor_peso_bruto

subseparador("7.1 Kilos para FOB (solo deshidratación)")
print(f"  Kilos base: {kilos_base} kg")
print(f"  Factor deshidratación: 1 + ({pct_deshidratacion}% / 100) = {factor_deshidratacion}")
print(f"  → Kilos FOB: {kilos_base} × {factor_deshidratacion} = {kilos_con_deshidratacion:.4f} kg")

subseparador("7.2 Kilos para CIF (deshidratación + peso bruto caja)")
print(f"  Factor peso bruto: 1 + ({pct_peso_bruto}% / 100) = {factor_peso_bruto}")
print(f"  → Kilos CIF: {kilos_base} × {factor_deshidratacion} × {factor_peso_bruto}")
print(f"            = {kilos_base} × {factor_deshidratacion * factor_peso_bruto:.6f}")
print(f"            = {kilos_cif:.4f} kg")

subseparador("7.3 Peso Total del Embarque")
peso_total_fob = kilos_con_deshidratacion * TOTAL_CAJAS
peso_total_cif = kilos_cif * TOTAL_CAJAS
print(f"  Peso FOB total: {kilos_con_deshidratacion:.4f} kg × {TOTAL_CAJAS} cajas = {peso_total_fob:.2f} kg")
print(f"  Peso CIF total: {kilos_cif:.4f} kg × {TOTAL_CAJAS} cajas = {peso_total_cif:.2f} kg")

# ============================================================================
# 8. DESGLOSE DE COSTOS POR CAJA
# ============================================================================
separador("8. DESGLOSE DE COSTOS POR CAJA")

d = cpc.get_desglose_costos(
    total_cajas_pedido=TOTAL_CAJAS,
    trm=TRM,
    cajas_item=TOTAL_CAJAS,
    use_contenedor=use_cont,
    aerolinea_id=aerolinea_id,
    destino_id=destino_id
)

subseparador("8.1 Costos Internos (COP → USD)")
print(f"  {'Concepto':<30} {'COP':<15} {'USD':<15} {'Fórmula'}")
print(f"  {'-'*80}")

insumos_cop = cpc.costo_insumos or Decimal('0')
print(f"  {'Insumos':<30} ${insumos_cop:>12,.2f} ${d['insumos_usd']:>12.4f}   COP / TRM")

fruta_cop = costo_fruta_caja
print(f"  {'Fruta (kilos × precio)':<30} ${fruta_cop:>12,.2f} ${d['fruta_usd']:>12.4f}   {kilos_base}kg × ${precio_fruta.precio_kilo:.0f}")

ref_cop = ref.precio or Decimal('0')
print(f"  {'Referencia (caja)':<30} ${ref_cop:>12,.2f} ${d['referencia_usd']:>12.4f}   Precio caja")

cont_cop = Decimal('0')  # Sin contenedor
print(f"  {'Contenedor':<30} ${cont_cop:>12,.2f} ${d['contenedor_usd']:>12.4f}   Sin contenedor")

mano_obra_cop = (cpc.mano_obra_cop or Decimal('0')) * kilos_base
print(f"  {'Mano de obra':<30} ${mano_obra_cop:>12,.2f} ${d['mano_obra_usd']:>12.4f}   ${cpc.mano_obra_cop:.0f}/kg × {kilos_base}kg")

embarque_cop = costos_base_cop / TOTAL_CAJAS if ce_embarque else Decimal('0')
print(f"  {'Costos embarque base':<30} ${embarque_cop:>12,.2f} ${d['costos_embarque_base_usd']:>12.4f}   Total / cajas")

print(f"\n  → Nota: El estibado se calcula de forma global (ver sección 6.2)")
print(f"    Estibado global por caja: ${estibado_por_caja_usd:.4f} USD")

subseparador("8.2 Costos CIF (ya en USD)")
print(f"  {'Concepto':<30} {'USD por embarque':<20} {'USD por caja'}")
print(f"  {'-'*70}")
print(f"  {'Costos CIF (Due, Fito, CO)':<30} ${costos_cif_total_usd:>15,.2f}   ${d['costos_cif_usd']:.4f}")

tarifa_por_caja = d['tarifa_aerea_usd']
tarifa_total = tarifa_por_caja * TOTAL_CAJAS
print(f"  {'Tarifa aérea':<30} ${tarifa_total:>15,.2f}   ${tarifa_por_caja:.4f}")
print(f"    → Cálculo: {kilos_cif:.4f} kg × ${tarifa.tarifa_por_kilo}/kg = ${tarifa_por_caja:.4f}/caja")

# ============================================================================
# 9. TOTALES FOB Y CIF
# ============================================================================
separador("9. CÁLCULO DE TOTALES POR CAJA")

base_fob = (
    d['insumos_usd'] + d['fruta_usd'] + d['referencia_usd'] + 
    d['contenedor_usd'] + d['mano_obra_usd'] + d['costos_embarque_base_usd'] +
    estibado_por_caja_usd
)

costo_cif = base_fob + d['costos_cif_usd'] + d['tarifa_aerea_usd']

subseparador("9.1 Costo FOB por Caja")
print(f"  Insumos:                    ${d['insumos_usd']:.4f}")
print(f"  + Fruta:                    ${d['fruta_usd']:.4f}")
print(f"  + Referencia (caja):        ${d['referencia_usd']:.4f}")
print(f"  + Contenedor:               ${d['contenedor_usd']:.4f}")
print(f"  + Mano de obra:             ${d['mano_obra_usd']:.4f}")
print(f"  + Costos embarque base:     ${d['costos_embarque_base_usd']:.4f}")
print(f"  + Estibado (global):        ${estibado_por_caja_usd:.4f}")
print(f"  {'─'*40}")
print(f"  = COSTO FOB POR CAJA:       ${base_fob:.4f} USD")

subseparador("9.2 Costo CIF por Caja")
print(f"  Costo FOB:                  ${base_fob:.4f}")
print(f"  + Costos CIF adicionales:   ${d['costos_cif_usd']:.4f}")
print(f"  + Tarifa aérea:             ${d['tarifa_aerea_usd']:.4f}")
print(f"  {'─'*40}")
print(f"  = COSTO CIF POR CAJA:       ${costo_cif:.4f} USD")

subseparador("9.3 Precio por Kilogramo")
fob_kg = base_fob / kilos_base
cif_kg = costo_cif / kilos_cif
print(f"  FOB $/Kg: ${base_fob:.4f} / {kilos_base} kg = ${fob_kg:.4f}")
print(f"  CIF $/Kg: ${costo_cif:.4f} / {kilos_cif:.4f} kg = ${cif_kg:.4f}")

# ============================================================================
# 10. CÁLCULO DE PRECIO DE VENTA CON UTILIDAD
# ============================================================================
separador("10. PRECIO DE VENTA CON UTILIDAD")

margen_adicional = cpc.margen_adicional_usd or Decimal('0')
denom_utilidad = Decimal('1') - (UTILIDAD_GENERAL_PCT / Decimal('100'))

subseparador("10.1 Fórmula de Utilidad")
print(f"  Utilidad general: {UTILIDAD_GENERAL_PCT}%")
print(f"  Denominador: 1 - ({UTILIDAD_GENERAL_PCT}% / 100) = {denom_utilidad}")
print(f"  Margen adicional: ${margen_adicional}")
print(f"\n  Fórmula precio venta: (Costo / Denominador) + Margen adicional")

subseparador("10.2 Precio Venta FOB")
precio_venta_fob = (base_fob / denom_utilidad) + margen_adicional
print(f"  Precio = (${base_fob:.4f} / {denom_utilidad}) + ${margen_adicional}")
print(f"         = ${base_fob / denom_utilidad:.4f} + ${margen_adicional}")
print(f"         = ${precio_venta_fob:.4f} USD")

subseparador("10.3 Utilidad Total (sobre FOB)")
utilidad_total = precio_venta_fob - base_fob - margen_adicional
print(f"  Utilidad = Precio venta - Costo FOB - Margen adicional")
print(f"           = ${precio_venta_fob:.4f} - ${base_fob:.4f} - ${margen_adicional}")
print(f"           = ${utilidad_total:.4f} USD por caja")

subseparador("10.4 Distribución de la Utilidad")
util_heavens = utilidad_total * (HEAVENS_PCT / Decimal('100'))
util_exportador = utilidad_total * (EXPORTADOR_PCT / Decimal('100'))
print(f"  Utilidad Heavens ({HEAVENS_PCT}%):     ${utilidad_total:.4f} × {HEAVENS_PCT}% = ${util_heavens:.4f}")
print(f"  Utilidad Exportador ({EXPORTADOR_PCT}%): ${utilidad_total:.4f} × {EXPORTADOR_PCT}% = ${util_exportador:.4f}")

subseparador("10.5 Precio Venta CIF")
costos_adicionales_cif = d['costos_cif_usd'] + d['tarifa_aerea_usd']
precio_venta_cif = precio_venta_fob + costos_adicionales_cif
print(f"  Precio CIF = Precio FOB + Costos CIF adicionales")
print(f"             = ${precio_venta_fob:.4f} + (${d['costos_cif_usd']:.4f} + ${d['tarifa_aerea_usd']:.4f})")
print(f"             = ${precio_venta_fob:.4f} + ${costos_adicionales_cif:.4f}")
print(f"             = ${precio_venta_cif:.4f} USD")
print(f"\n  ⚠️ IMPORTANTE: La utilidad NO cambia con CIF, solo se suman los costos adicionales")

# ============================================================================
# 11. RESUMEN EJECUTIVO
# ============================================================================
separador("11. RESUMEN EJECUTIVO")

print(f"""
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                        COTIZACIÓN CIF - RESUMEN                         │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  Cliente:            {str(cp.cliente):<50}                              │
  │  Fruta:              {str(cp.fruta):<50}                                │
  │  Presentación:       {str(presentacion):<50}                            │
  │  TRM:                ${TRM:>10,.2f} COP/USD                             │
  │  Cajas:              {TOTAL_CAJAS:>10}                                  │
  │  Pallets:            {total_pallets:>10}                                │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  KILOS                                                                  │
  │    Kg Neto/caja:     {kilos_base:>10} kg                                │
  │    Kg CIF/caja:      {kilos_cif:>10.2f} kg                              │
  │    Peso total CIF:   {peso_total_cif:>10.2f} kg                         │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  COSTOS POR CAJA                                                        │
  │    FOB $/Caja:       ${base_fob:>10.2f} USD                             │
  │    CIF $/Caja:       ${costo_cif:>10.2f} USD                            │
  │    FOB $/Kg:         ${fob_kg:>10.2f} USD                               │
  │    CIF $/Kg:         ${cif_kg:>10.2f} USD                               │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  PRECIOS DE VENTA (con {UTILIDAD_GENERAL_PCT}% utilidad)                │
  │    Precio FOB:       ${precio_venta_fob:>10.2f} USD/caja                │
  │    Precio CIF:       ${precio_venta_cif:>10.2f} USD/caja                │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  UTILIDAD POR CAJA                                                      │
  │    Utilidad Total:   ${utilidad_total:>10.2f} USD                       │
  │    → Heavens ({HEAVENS_PCT}%):  ${util_heavens:>10.2f} USD              │
  │    → Exportador ({EXPORTADOR_PCT}%): ${util_exportador:>10.2f} USD      │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  TOTALES DEL EMBARQUE                                                   │
  │    Valor FOB:        ${base_fob * TOTAL_CAJAS:>12,.2f} USD              │
  │    Valor CIF:        ${costo_cif * TOTAL_CAJAS:>12,.2f} USD             │
  │    Precio venta FOB: ${precio_venta_fob * TOTAL_CAJAS:>12,.2f} USD      │
  │    Precio venta CIF: ${precio_venta_cif * TOTAL_CAJAS:>12,.2f} USD      │
  │    Utilidad total:   ${utilidad_total * TOTAL_CAJAS:>12,.2f} USD        │
  └─────────────────────────────────────────────────────────────────────────┘
""")

separador("FIN DEL INFORME")
