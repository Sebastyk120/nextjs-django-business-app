import math
from datetime import datetime, timedelta, date
from decimal import Decimal
from importlib import import_module
import pandas as pd
import requests
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.validators import MinValueValidator, MaxLengthValidator, MaxValueValidator
from django.db import models
from django.db.models import Sum, UniqueConstraint
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from simple_history.models import HistoricalRecords
from .choices import motivo_nota, estatus_reserva_list, estado_documentos_list

class Iata(models.Model):
    codigo = models.CharField(max_length=3, unique=True)
    ciudad = models.CharField(max_length=25)
    pais = models.CharField(max_length=25)

    class Meta:
        ordering = ['codigo']

    def __str__(self):
        return f'{self.codigo} - {self.ciudad} - {self.pais}'


class Exportador(models.Model):
    nombre = models.CharField(max_length=30, unique=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class TipoCaja(models.Model):
    nombre = models.CharField(max_length=50, verbose_name="Tipo De Caja", unique=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Contenedor(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Nombre del Contenedor", unique=True)
    precio = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2, verbose_name="Precio COP", null=True, blank=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Referencias(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Referencia")
    referencia_nueva = models.CharField(max_length=255, verbose_name="Referencia Nueva", blank=True, null=True)
    contenedor = models.ForeignKey(Contenedor, on_delete=models.CASCADE, verbose_name="Contenedor", null=True, blank=True)
    cant_contenedor = models.IntegerField(validators=[MinValueValidator(0)], verbose_name="Cantidad Cajas En Contenedor", null=True, blank=True)
    precio = models.DecimalField( validators=[MinValueValidator(0)], max_digits=10, decimal_places=2, verbose_name="Precio", null=True, blank=True )
    exportador = models.ForeignKey(Exportador, on_delete=models.CASCADE, verbose_name="Exportador")
    cantidad_pallet_con_contenedor = models.IntegerField( validators=[MinValueValidator(0)], verbose_name="Cajas Pallet Contenedor", null=True, blank=True)
    cantidad_pallet_sin_contenedor = models.IntegerField(validators=[MinValueValidator(0)], verbose_name="Cajas Pallet Sin Contenedor", null=True, blank=True)
    porcentaje_peso_bruto = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name="Porcentaje de Peso Bruto")

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        # Verificamos que exista `exportador` (FK)
        exportador_str = self.exportador.nombre if self.exportador_id else "SIN EXPORTADOR"
        ref_nueva_str = self.referencia_nueva if self.referencia_nueva else "N/A"
        return f"{self.nombre} -N {ref_nueva_str} - {exportador_str}"


class Cliente(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Nombre Cliente", unique=True)
    direccion = models.CharField(max_length=255, verbose_name="Dirección")
    ciudad = models.CharField(max_length=100, verbose_name="Ciudad", null=True, blank=True)
    destino_iata = models.ForeignKey(Iata, on_delete=models.CASCADE, verbose_name="Iata", null=True, blank=True)
    tax_id = models.CharField(max_length=50, verbose_name="Tax ID", null=True, blank=True)
    incoterm = models.CharField(max_length=50, verbose_name="Incoterm", null=True, blank=True)
    agencia_de_carga = models.CharField(max_length=100, blank=True, null=True, verbose_name="Agencia De Carga")
    correo = models.EmailField(verbose_name="Correo", null=True, blank=True)
    correo2 = models.EmailField(verbose_name="Correo 2", null=True, blank=True)
    telefono = models.CharField(max_length=20, verbose_name="Telefono", null=True, blank=True)
    intermediario = models.CharField(max_length=100, verbose_name="Intermediario", null=True, blank=True)
    direccion2 = models.CharField(max_length=255, verbose_name="Direccion 2", null=True, blank=True)
    ciudad2 = models.CharField(max_length=100, verbose_name="Ciudad 2", null=True, blank=True)
    tax_id2 = models.CharField(max_length=50, verbose_name="Tax ID2", null=True, blank=True)
    encargado_de_reservar = models.CharField(max_length=100, verbose_name="Reservar", null=True, blank=True)
    negociaciones_cartera = models.IntegerField(verbose_name="Dias Cartera")
    presentaciones = models.ManyToManyField('Presentacion', through='ClientePresentacion', related_name='clientes')

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Presentacion(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Presentación", unique=False)
    kilos = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                verbose_name="Kilos")

    class Meta:
        ordering = ['nombre']
        unique_together = ['nombre', 'kilos']

    def __str__(self):
        return f'{self.nombre} - {self.kilos}'


class Insumo(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Insumo")
    precio = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2, verbose_name="Precio", null=True, blank=True)
    unidad_medida = models.CharField(max_length=20, verbose_name="Unidad de Medida", null=True, blank=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return f'{self.nombre} - {self.unidad_medida} -$ {self.precio}'


    # Modelo PresentacionInsumo eliminado; el costo de insumos
    # se calcula exclusivamente desde PresentacionInsumoCliente.


class Fruta(models.Model):
    nombre = models.CharField(max_length=20, unique=True)
    descripcion = models.TextField(verbose_name="Descripción", blank=True, null=True)
    nombre_en = models.CharField(max_length=20, verbose_name="Nombre en inglés", blank=True, null=True)
    descripcion_en = models.TextField(verbose_name="Descripción en inglés", blank=True, null=True)
    imagen = models.ImageField(upload_to='frutas/', verbose_name="Imagen", blank=True, null=True)
    presentaciones = models.ManyToManyField(Presentacion, through='ClientePresentacion', related_name='frutas')

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class ClientePresentacion(models.Model):
    """
    Configuración de presentación para un cliente específico
    """
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='presentaciones_config')
    presentacion = models.ForeignKey(Presentacion, on_delete=models.CASCADE)
    fruta = models.ForeignKey(Fruta, on_delete=models.CASCADE)
    exportador = models.ForeignKey(
        Exportador, on_delete=models.CASCADE,
        verbose_name="Exportador Proveedor",
        null=True, blank=True
    )
    referencia = models.ForeignKey(
        Referencias, on_delete=models.CASCADE,
        verbose_name="Referencia (Caja)",
        limit_choices_to={'exportador': models.F('exportador')},
        null=True, blank=True
    )

    # Mano de obra se movió a CostoPresentacionCliente
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['cliente', 'fruta']
        unique_together = ('cliente', 'presentacion', 'fruta', 'exportador')
        verbose_name = "Cliente Presentación"
        verbose_name_plural = "Clientes Presentaciones"

    def __str__(self):
        cliente_str = self.cliente.nombre if self.cliente_id else "SIN CLIENTE"
        pres_str = f"{self.presentacion.nombre} - {self.presentacion.kilos}kg" if self.presentacion_id else "SIN PRESENTACIÓN"
        fruta_str = self.fruta.nombre if self.fruta_id else "SIN FRUTA"
        exp_str = self.exportador.nombre if self.exportador_id else "SIN EXPORTADOR"
        return f'{cliente_str} | {fruta_str} | {pres_str} | {exp_str}'

    @property
    def costo_total_insumos(self):
        """Suma el costo de insumos SOLO personalizados por cliente"""
        costo_total = Decimal('0')
        for pic in PresentacionInsumoCliente.objects.filter(cliente_presentacion=self).select_related('insumo'):
            cantidad = pic.cantidad_efectiva
            costo_total += cantidad * (pic.insumo.precio or Decimal('0'))
        return costo_total


class PresentacionInsumoCliente(models.Model):
    """
    Permite override de insumos específicos para un cliente
    Si no existe aquí, se hereda de PresentacionInsumo
    """
    cliente_presentacion = models.ForeignKey(
        'ClientePresentacion', on_delete=models.CASCADE,
        related_name='insumos_personalizados'
    )
    insumo = models.ForeignKey(Insumo, on_delete=models.CASCADE)
    cantidad = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Cantidad Personalizada", null=True, blank=True
    )

    class Meta:
        ordering = ['cliente_presentacion']
        unique_together = ['cliente_presentacion', 'insumo']
        verbose_name = "Presentación Insumo Cliente"
        verbose_name_plural = "Presentaciones Insumos Clientes"

    def __str__(self):
        cantidad_str = self.cantidad if self.cantidad else "Default"
        return f"{self.cliente_presentacion} - {self.insumo} (x{cantidad_str})"

    @property
    def cantidad_efectiva(self):
        """Retorna cantidad personalizada; si no hay, 0 (sin insumo)"""
        if self.cantidad is not None:
            return self.cantidad
        return Decimal('0')

    @property
    def costo_total(self):
        """Costo total considerando cantidad efectiva"""
        return self.cantidad_efectiva * (self.insumo.precio or Decimal('0'))


class PresentacionReferencia(models.Model):
    presentacion = models.ForeignKey(Presentacion, on_delete=models.CASCADE)
    referencia = models.ForeignKey(Referencias, on_delete=models.CASCADE)
    fruta = models.ForeignKey(Fruta, on_delete=models.CASCADE)
    tipo_caja = models.ForeignKey(TipoCaja, on_delete=models.CASCADE)

    class Meta:
        ordering = ['fruta']
        constraints = [
            UniqueConstraint(
                fields=['presentacion', 'referencia', 'fruta', 'tipo_caja'],
                name='unique_presentacion_referencia'
            )
        ]

    def __str__(self):
        # Chequear todos los FKs para evitar errores
        ref_str = str(self.referencia) if self.referencia_id else "Sin Ref"
        pres_str = str(self.presentacion) if self.presentacion_id else "Sin Present."
        fruta_str = str(self.fruta) if self.fruta_id else "Sin Fruta"
        caja_str = str(self.tipo_caja) if self.tipo_caja_id else "Sin Caja"
        return f"Refe: {ref_str} Presen: {pres_str} -Marca: {caja_str} -Fruta {fruta_str}"





class ListaPreciosFrutaExportador(models.Model):
    fruta = models.ForeignKey(Fruta, on_delete=models.CASCADE)
    exportadora = models.ForeignKey(Exportador, on_delete=models.CASCADE)
    precio_kilo = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2, verbose_name="Precio Kg", null=True, blank=True)
    fecha = models.DateField(auto_now=True, verbose_name='Fecha Ultima Actualización')
    precio_anterior = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2, verbose_name="Precio Anterior", null=True, blank=True)

    class Meta:
        ordering = ['fruta', 'exportadora', '-fecha']
        unique_together = [['fruta', 'exportadora']]

    def __str__(self):
        return f"{self.exportadora} - {self.fruta} - $ {self.precio_kilo}/kg"


@receiver(pre_save, sender=ListaPreciosFrutaExportador)
def guardar_precio_anterior_fruta(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = ListaPreciosFrutaExportador.objects.get(pk=instance.pk)
            if old_instance.precio_kilo != instance.precio_kilo:
                instance.precio_anterior = old_instance.precio_kilo
        except ListaPreciosFrutaExportador.DoesNotExist:
            pass


class AgenciaCarga(models.Model):
    nombre = models.CharField(max_length=50, verbose_name="Agencia Carga", unique=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Aerolinea(models.Model):
    codigo = models.CharField(max_length=3, verbose_name="Codigo Aerolinea", unique=True)
    nombre = models.CharField(max_length=50, verbose_name="Nombre Aerolinea", unique=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class TarifaAerea(models.Model):
    aerolinea = models.ForeignKey(Aerolinea, on_delete=models.CASCADE, related_name='tarifas')
    destino = models.ForeignKey(Iata, on_delete=models.CASCADE, verbose_name="Destino")
    tarifa_por_kilo = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Tarifa USD/Kg"
    )
    fecha = models.DateField(auto_now=True, verbose_name='Fecha Ultima Actualización')
    es_activa = models.BooleanField(default=True)

    class Meta:
        ordering = ['aerolinea', 'destino', '-fecha']
        unique_together = [['aerolinea', 'destino']]
        verbose_name_plural = "Tarifas Aéreas"

    def __str__(self):
        return f'{self.aerolinea.nombre} → {self.destino.codigo} - ${self.tarifa_por_kilo}/kg'


class CostoPresentacionCliente(models.Model):
    """
    MODELO CENTRAL: Costo COMPLETO de una presentación para un cliente
    considerando aerolinea, destino y tipo de acuerdo.
    """
    cliente_presentacion = models.ForeignKey(
        ClientePresentacion, on_delete=models.CASCADE,
        related_name='costos_contextuales'
    )
    # Aerolínea y Destino se gestionan en la cotización, no se almacenan aquí

    # COSTOS DE EMPAQUE
    mano_obra_cop = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=12, decimal_places=2,
        verbose_name="Mano de Obra COP por Kg", default=0
    )

    deshidratacion_fruta = models.DecimalField(
        validators=[MinValueValidator(0), MaxValueValidator(100)], max_digits=5, decimal_places=2,
        verbose_name="Deshidratación Fruta (%)", default=0,
        help_text="Porcentaje de deshidratación a sumar por caja. Ej: 1.25 aplica +1.25% sobre los kilos de la presentación"
    )

    # MARGEN / UTILIDAD
    margen_adicional_usd = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Margen Adicional USD por Caja", default=0,
        help_text="Margen que aplicas a esta venta específica / se divide en Heavens y Exportador"
    )

    # CONTROL
    es_activo = models.BooleanField(default=True, verbose_name="¿Es Activo?")
    fecha_inicio = models.DateField(auto_now_add=True, verbose_name="Fecha Inicio Vigencia")
    fecha_fin = models.DateField(
        null=True, blank=True,
        verbose_name="Fecha Fin Vigencia (dejar vacío para vigencia indefinida)"
    )
    aprobada = models.BooleanField(default=False)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    trm_aprobacion = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    desglose_aprobado = models.JSONField(null=True, blank=True, default=None)

    class Meta:
        ordering = ['-fecha_inicio']
        unique_together = ['cliente_presentacion']
        indexes = [
            models.Index(fields=['cliente_presentacion']),
            models.Index(fields=['es_activo']),
        ]
        verbose_name = "Costo Presentación Cliente"
        verbose_name_plural = "Costos Presentaciones Clientes"

    def __str__(self):
        return f"{self.cliente_presentacion}"

    # ==================== GETTERS DE COSTOS ====================

    @property
    def costo_insumos(self):
        """Costo de insumos de la presentación"""
        return self.cliente_presentacion.costo_total_insumos

    @property
    def costo_fruta_por_caja(self):
        try:
            precio_fruta = ListaPreciosFrutaExportador.objects.get(
                fruta=self.cliente_presentacion.fruta,
                exportadora=self.cliente_presentacion.exportador
            )
            kilos_por_caja = self.cliente_presentacion.presentacion.kilos or Decimal('0')
            precio_kilo = precio_fruta.precio_kilo or Decimal('0')
            return kilos_por_caja * precio_kilo
        except ListaPreciosFrutaExportador.DoesNotExist:
            return Decimal('0')

    def costo_contenedor_por_caja(self, use_contenedor=None):
        referencia = self.cliente_presentacion.referencia
        flag = use_contenedor if use_contenedor is not None else bool(referencia.contenedor)
        if not flag or not referencia.contenedor or not referencia.cant_contenedor:
            return Decimal('0')
        contenedor_precio = referencia.contenedor.precio or Decimal('0')
        cant_cajas_por_contenedor = referencia.cant_contenedor or 0
        if contenedor_precio <= 0 or cant_cajas_por_contenedor <= 0:
            return Decimal('0')
        return contenedor_precio / cant_cajas_por_contenedor

    def costo_referencia_por_caja(self):
        ref = self.cliente_presentacion.referencia
        if not ref:
            return Decimal('0')
        precio_ref = ref.precio or Decimal('0')
        if precio_ref <= 0:
            return Decimal('0')
        return precio_ref

    @property
    def costo_estibado_por_caja(self):
        """
        Costo de estibado (malla, esquineros, etc) prorrateado por caja
        Usa costos generales de estibado
        """
        referencia = self.cliente_presentacion.referencia

        try:
            # Buscar el primer registro activo de costos de estibado
            costos_estibado = CostosEstibado.objects.filter(es_activo=True).first()
            if not costos_estibado:
                return Decimal('0')
            
            cajas_por_pallet = (
                referencia.cantidad_pallet_con_contenedor
                if referencia.contenedor else
                referencia.cantidad_pallet_sin_contenedor
            ) or 1

            costo_total_pallet = costos_estibado.costo_total

            return costo_total_pallet / cajas_por_pallet
        except Exception:
            return Decimal('0')

    def costo_estibado_por_caja_prorrateado(self, total_cajas_pedido=1, use_contenedor=None):
        """
        Costo de estibado prorrateado según el total de cajas del pedido
        Usa costos generales de estibado
        """
        referencia = self.cliente_presentacion.referencia
        try:
            # Buscar el primer registro activo de costos de estibado
            costos_estibado = CostosEstibado.objects.filter(es_activo=True).first()
            if not costos_estibado:
                return Decimal('0')
            
            with_contenedor = use_contenedor if use_contenedor is not None else bool(referencia.contenedor)
            cajas_por_pallet = (
                referencia.cantidad_pallet_con_contenedor
                if with_contenedor else
                referencia.cantidad_pallet_sin_contenedor
            )
            if not cajas_por_pallet or cajas_por_pallet <= 0:
                return Decimal('0')
            
            costo_total_pallet = costos_estibado.costo_total
            
            if total_cajas_pedido and total_cajas_pedido > 0:
                pallets = Decimal(math.ceil(float(Decimal(total_cajas_pedido) / Decimal(cajas_por_pallet))))
                return (costo_total_pallet * pallets) / Decimal(total_cajas_pedido)
            return Decimal('0')
        except Exception:
            return Decimal('0')

    def tarifa_aerea_por_caja(self, aerolinea_id=None, destino_id=None):
        """Calcula la tarifa aérea por caja usando el peso bruto (deshidratación + peso caja)"""
        if not aerolinea_id or not destino_id:
            return Decimal('0')
        try:
            tarifa = TarifaAerea.objects.get(
                aerolinea_id=aerolinea_id,
                destino_id=destino_id,
                es_activa=True
            )
            # Usar kilos_peso_bruto para el flete (incluye deshidratación + peso bruto de la caja)
            kilos_por_caja = self.kilos_peso_bruto()
            tarifa_por_kilo = tarifa.tarifa_por_kilo or Decimal('0')
            return kilos_por_caja * tarifa_por_kilo
        except TarifaAerea.DoesNotExist:
            return Decimal('0')

    def costos_embarque_unitarios(self, aerolinea_id=None, destino_id=None):
        """
        Costos de embarque base (solo FOB, sin costos CIF).
        Primero busca un registro específico para la combinación aerolinea-destino.
        Si no existe, usa el registro por defecto.
        """
        try:
            costos = None
            # Primero buscar registro específico para la combinación aerolinea-destino
            if aerolinea_id and destino_id:
                costos = CostosUnicosEmbarque.objects.filter(
                    aerolinea_id=aerolinea_id,
                    destino_id=destino_id,
                    es_activo=True
                ).first()
            
            # Si no hay registro específico, usar el registro por defecto
            if not costos:
                costos = CostosUnicosEmbarque.objects.filter(
                    aerolinea__isnull=True,
                    destino__isnull=True,
                    es_activo=True
                ).first()
            
            if costos:
                return (
                    (costos.transporte_aeropuerto or Decimal('0')) +
                    (costos.termo or Decimal('0')) +
                    (costos.precinto or Decimal('0')) +
                    (costos.aduana or Decimal('0')) +
                    (costos.comision_bancaria or Decimal('0'))
                )
        except:
            pass
        return Decimal('0')

    def costos_embarque_base_cop(self, aerolinea_id=None, destino_id=None):
        """
        Costos de embarque base en COP.
        Primero busca un registro específico para la combinación aerolinea-destino.
        Si no existe, usa el registro por defecto.
        """
        try:
            costos = None
            # Primero buscar registro específico para la combinación aerolinea-destino
            if aerolinea_id and destino_id:
                costos = CostosUnicosEmbarque.objects.filter(
                    aerolinea_id=aerolinea_id,
                    destino_id=destino_id,
                    es_activo=True
                ).first()
            
            # Si no hay registro específico, usar el registro por defecto
            if not costos:
                costos = CostosUnicosEmbarque.objects.filter(
                    aerolinea__isnull=True,
                    destino__isnull=True,
                    es_activo=True
                ).first()
            
            if costos:
                return (
                    (costos.transporte_aeropuerto or Decimal('0')) +
                    (costos.termo or Decimal('0')) +
                    (costos.precinto or Decimal('0')) +
                    (costos.aduana or Decimal('0')) +
                    (costos.comision_bancaria or Decimal('0'))
                )
        except:
            pass
        return Decimal('0')

    def costos_cif_usd(self, aerolinea_id=None, destino_id=None):
        """
        Costos adicionales CIF en USD (due agent, due carrier, fito, certificado origen).
        Busca primero un registro específico para la combinación aerolinea-destino.
        Si no existe, usa el registro por defecto.
        """
        try:
            costos = None
            # Primero buscar registro específico para la combinación aerolinea-destino
            if aerolinea_id and destino_id:
                costos = CostosUnicosEmbarque.objects.filter(
                    aerolinea_id=aerolinea_id,
                    destino_id=destino_id,
                    es_activo=True
                ).first()
            
            # Si no hay registro específico, usar el registro por defecto
            if not costos:
                costos = CostosUnicosEmbarque.objects.filter(
                    aerolinea__isnull=True,
                    destino__isnull=True,
                    es_activo=True
                ).first()
            
            if costos:
                return (
                    (costos.due_agent_usd or Decimal('0')) +
                    (costos.due_carrier_usd or Decimal('0')) +
                    (costos.fito_usd or Decimal('0')) +
                    (costos.certificado_origen_usd or Decimal('0'))
                )
        except:
            pass
        return Decimal('0')

    # ==================== CALCULO DEL PRECIO FINAL ====================

    def calcular_costo_total_por_caja(self, total_cajas_pedido=1, trm=Decimal('1'), cajas_item=None, use_contenedor=None, aerolinea_id=None, destino_id=None):
        """
        COSTO TOTAL POR CAJA (sin margen)

        Args:
            total_cajas_pedido: Total de cajas en el pedido (para prorratear costos únicos)
            trm: Tasa de cambio (si es en pesos)

        Returns:
            Decimal: Costo total en USD
        """
        cop_total = (
            (self.costo_insumos or Decimal('0')) +
            (self.costo_fruta_por_caja or Decimal('0')) +
            (self.costo_referencia_por_caja() or Decimal('0')) +
            (self.costo_contenedor_por_caja(use_contenedor) or Decimal('0')) +
            (self.costo_estibado_por_caja_prorrateado(cajas_item or total_cajas_pedido, use_contenedor) or Decimal('0')) +
            ((self.mano_obra_cop or Decimal('0')) * (self.kilos_ajustados() or Decimal('0'))) +
            ((self.costos_embarque_base_cop(aerolinea_id, destino_id) or Decimal('0')) / (total_cajas_pedido or 1))
        )

        usd_total = (cop_total / (trm or Decimal('1')))

        # Incoterm (CIF/FOB) se aplica fuera de este método
        
        return usd_total

    def calcular_precio_venta(self, total_cajas_pedido=1, trm=Decimal('1'),
                              porcentaje_heavens=Decimal('35')):
        """
        PRECIO DE VENTA AL CLIENTE

        Estructura de margen:
        - 65% para Exportador
        - 35% para Heavens Fruit (configurable)

        Args:
            total_cajas_pedido: Total de cajas en el pedido
            trm: Tasa de cambio
            porcentaje_heavens: Tu porcentaje de margen (default 35%)

        Returns:
            Dict con desglose de costos
        """
        costo_base = self.calcular_costo_total_por_caja(total_cajas_pedido, trm)
        costo_base += (self.margen_adicional_usd or Decimal('0'))

        porcentaje_exportador = Decimal('100') - (porcentaje_heavens or Decimal('0'))

        if porcentaje_exportador == 0:
            precio_final = costo_base
            utilidad_heavens = Decimal('0')
        else:
            precio_final = costo_base / (porcentaje_exportador / Decimal('100'))
            utilidad_heavens = precio_final - costo_base

        return {
            'costo_base': costo_base,
            'margen_adicional': self.margen_adicional_usd,
            'precio_final_usd': precio_final,
            'utilidad_heavens_usd': utilidad_heavens,
            'utilidad_exportador_usd': precio_final * (porcentaje_exportador / Decimal('100')) - (self.margen_adicional_usd or Decimal('0')),
            'porcentaje_heavens': porcentaje_heavens,
        }

    def get_desglose_costos(self, total_cajas_pedido=1, trm=Decimal('1'), cajas_item=None, use_contenedor=None, aerolinea_id=None, destino_id=None):
        return {
            'insumos_usd': (self.costo_insumos or Decimal('0')) / (trm or Decimal('1')),
            'fruta_usd': (self.costo_fruta_por_caja or Decimal('0')) / (trm or Decimal('1')),
            'referencia_usd': (self.costo_referencia_por_caja() or Decimal('0')) / (trm or Decimal('1')),
            'contenedor_usd': (self.costo_contenedor_por_caja(use_contenedor) or Decimal('0')) / (trm or Decimal('1')),
            'estibado_usd': (self.costo_estibado_por_caja_prorrateado(cajas_item or total_cajas_pedido, use_contenedor) or Decimal('0')) / (trm or Decimal('1')),
            'mano_obra_usd': (((self.mano_obra_cop or Decimal('0')) * (self.cliente_presentacion.presentacion.kilos or Decimal('0'))) / (trm or Decimal('1'))),
            'costos_embarque_base_usd': ((self.costos_embarque_base_cop(aerolinea_id, destino_id) or Decimal('0')) / (total_cajas_pedido or 1)) / (trm or Decimal('1')),
            # Costos CIF ya están en USD, solo se prorratean por caja
            'costos_cif_usd': (self.costos_cif_usd(aerolinea_id, destino_id) or Decimal('0')) / (total_cajas_pedido or 1),
            'tarifa_aerea_usd': (self.tarifa_aerea_por_caja(aerolinea_id, destino_id) or Decimal('0')),
        }

    def validar_campos_para_calculo(self, use_contenedor=None):
        errores = []
        cp = self.cliente_presentacion
        ref = cp.referencia
        use = use_contenedor if use_contenedor is not None else (bool(ref.contenedor) if ref else False)
        kilos = cp.presentacion.kilos or Decimal('0')
        if kilos <= 0:
            errores.append(f'Presentación sin kilos (actual: {kilos})')
        if not ref:
            errores.append('Referencia no configurada')
            return {'ok': False, 'errores': errores}
        precio_ref = ref.precio or Decimal('0')
        if precio_ref <= 0:
            errores.append(f'Referencia "{ref.nombre}" sin precio (actual: {precio_ref})')
        if use:
            if not ref.contenedor_id:
                errores.append(f'Referencia "{ref.nombre}" sin contenedor')
            else:
                precio_cont = ref.contenedor.precio or Decimal('0')
                if precio_cont <= 0:
                    errores.append(f'Contenedor "{ref.contenedor.nombre}" sin precio (actual: {precio_cont})')
            if not ref.cant_contenedor or ref.cant_contenedor <= 0:
                errores.append(f'Cantidad de cajas por contenedor inválida (actual: {ref.cant_contenedor})')
            if not ref.cantidad_pallet_con_contenedor or ref.cantidad_pallet_con_contenedor <= 0:
                errores.append(f'Cajas por pallet con contenedor inválidas (actual: {ref.cantidad_pallet_con_contenedor})')
        else:
            if not ref.cantidad_pallet_sin_contenedor or ref.cantidad_pallet_sin_contenedor <= 0:
                errores.append(f'Cajas por pallet sin contenedor inválidas (actual: {ref.cantidad_pallet_sin_contenedor})')
        try:
            if not CostosEstibado.objects.filter(es_activo=True).exists():
                errores.append('Costos de estibado generales no configurados')
        except Exception:
            pass
        try:
            precios = ListaPreciosFrutaExportador.objects.get(
                fruta=cp.fruta,
                exportadora=cp.exportador
            )
            if not precios.precio_kilo or precios.precio_kilo <= 0:
                errores.append(f'Precio kilo fruta inválido (actual: {precios.precio_kilo}) para {cp.fruta} - {cp.exportador}')
        except ListaPreciosFrutaExportador.DoesNotExist:
            errores.append(f'Precio kilo fruta no configurado para {cp.fruta} - {cp.exportador}')
        return {'ok': len(errores) == 0, 'errores': errores}

    def pallets_necesarios(self, cajas_item=1):
        referencia = self.cliente_presentacion.referencia
        cajas_por_pallet = (
            referencia.cantidad_pallet_con_contenedor if referencia.contenedor else referencia.cantidad_pallet_sin_contenedor
        ) or 1
        return Decimal(math.ceil(float(Decimal(cajas_item) / Decimal(cajas_por_pallet))))

    def costo_por_kg_fob(self, cajas_item=1, total_cajas_pedido=1, trm=Decimal('1')):
        kilos = self.cliente_presentacion.presentacion.kilos or Decimal('1')
        desglose = self.get_desglose_costos(total_cajas_pedido=total_cajas_pedido, trm=trm, cajas_item=cajas_item)
        base = (
            desglose['insumos_usd'] +
            desglose['fruta_usd'] +
            desglose['referencia_usd'] +
            desglose['contenedor_usd'] +
            desglose['estibado_usd'] +
            desglose['mano_obra_usd'] +
            desglose['costos_embarque_base_usd']
        )
        return base / kilos

    def costo_por_kg_cif(self, cajas_item=1, total_cajas_pedido=1, trm=Decimal('1')):
        kilos = self.kilos_ajustados() or Decimal('1')
        desglose = self.get_desglose_costos(total_cajas_pedido=total_cajas_pedido, trm=trm, cajas_item=cajas_item)
        base = (
            desglose['insumos_usd'] +
            desglose['fruta_usd'] +
            desglose['referencia_usd'] +
            desglose['contenedor_usd'] +
            desglose['estibado_usd'] +
            desglose['mano_obra_usd'] +
            desglose['costos_embarque_base_usd'] +
            desglose['costos_cif_usd'] +
            desglose['tarifa_aerea_usd']
        )
        return base / kilos

    def kilos_ajustados(self):
        """Retorna los kilos ajustados considerando la deshidratación"""
        kilos = self.cliente_presentacion.presentacion.kilos or Decimal('0')
        pct = self.deshidratacion_fruta or Decimal('0')
        factor = (Decimal('1') + (pct / Decimal('100')))
        return kilos * factor

    def kilos_peso_bruto(self):
        """
        Retorna los kilos con peso bruto (deshidratación + porcentaje_peso_bruto)
        Este es el peso real que se usa para calcular el flete aéreo CIF
        """
        kilos = self.cliente_presentacion.presentacion.kilos or Decimal('0')
        pct_deshidratacion = self.deshidratacion_fruta or Decimal('0')
        pct_peso_bruto = self.cliente_presentacion.referencia.porcentaje_peso_bruto or Decimal('0')
        factor_deshidratacion = (Decimal('1') + (pct_deshidratacion / Decimal('100')))
        factor_peso_bruto = (Decimal('1') + (pct_peso_bruto / Decimal('100')))
        return kilos * factor_deshidratacion * factor_peso_bruto


class CostosUnicosEmbarque(models.Model):
    """Costos fijos por embarque (vinculados a aerolinea/destino)"""
    aerolinea = models.ForeignKey(
        Aerolinea, on_delete=models.CASCADE, null=True, blank=True,
        related_name='costos_embarque', verbose_name="Aerolinea (opcional)"
    )
    destino = models.ForeignKey(
        Iata, on_delete=models.CASCADE, null=True, blank=True,
        related_name='costos_embarque', verbose_name="Destino (opcional)"
    )

    transporte_aeropuerto = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Transporte Aeropuerto", null=True, blank=True
    )
    termo = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Termoregistro", null=True, blank=True
    )
    precinto = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Precinto", null=True, blank=True
    )
    aduana = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Aduana", null=True, blank=True
    )
    comision_bancaria = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Comisión Bancaria", null=True, blank=True
    )
    # Costos CIF (guardados en USD, dependen de TRM al calcular)
    due_agent_usd = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Due Agent (USD)", null=True, blank=True,
        help_text="Costo en USD, solo aplica para negociación CIF"
    )
    due_carrier_usd = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Due Carrier (USD)", null=True, blank=True,
        help_text="Costo en USD, solo aplica para negociación CIF"
    )
    fito_usd = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Fito (USD)", null=True, blank=True,
        help_text="Costo en USD, solo aplica para negociación CIF"
    )
    certificado_origen_usd = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Certificado Origen (USD)", null=True, blank=True,
        help_text="Costo en USD, solo aplica para negociación CIF"
    )

    fecha_actualizacion = models.DateField(auto_now=True)
    es_activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['-fecha_actualizacion']
        unique_together = [['aerolinea', 'destino']]
        verbose_name = "Costos Únicos Embarque"
        verbose_name_plural = "Costos Únicos Embarque"

    def clean(self):
        """
        Validación para asegurar que solo exista un registro sin aerolinea ni destino.
        Este registro sirve como costos FOB por defecto.
        """
        from django.core.exceptions import ValidationError
        
        # Si ambos campos son nulos, verificar que no exista otro registro igual
        if self.aerolinea is None and self.destino is None:
            existing = CostosUnicosEmbarque.objects.filter(
                aerolinea__isnull=True,
                destino__isnull=True
            ).exclude(pk=self.pk)
            
            if existing.exists():
                raise ValidationError(
                    "Ya existe un registro de costos por defecto (sin aerolínea ni destino). "
                    "Solo puede existir un único registro por defecto para los costos FOB."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        if self.aerolinea is None and self.destino is None:
            return "Por Defecto (General) → General"
        aero = self.aerolinea.nombre if self.aerolinea else "(Sin Aerolínea)"
        dest = self.destino.codigo if self.destino else "(Sin Destino)"
        return f"{aero} → {dest}"
    
    @property
    def es_registro_por_defecto(self):
        """Indica si este es el registro por defecto (sin aerolinea ni destino)"""
        return self.aerolinea is None and self.destino is None

    @property
    def costo_total_base_cop(self):
        """Costos base en COP (FOB y CIF)"""
        return sum([
            self.transporte_aeropuerto or Decimal('0'),
            self.termo or Decimal('0'),
            self.precinto or Decimal('0'),
            self.aduana or Decimal('0'),
            self.comision_bancaria or Decimal('0'),
        ])

    @property
    def costos_cif_usd(self):
        """Costos adicionales CIF en USD (due agent, due carrier, fito, certificado origen)"""
        return sum([
            self.due_agent_usd or Decimal('0'),
            self.due_carrier_usd or Decimal('0'),
            self.fito_usd or Decimal('0'),
            self.certificado_origen_usd or Decimal('0'),
        ])


class CostosEstibado(models.Model):
    """Costos generales de estibado que aplican a todas las cotizaciones"""
    nombre = models.CharField(
        max_length=100, verbose_name="Nombre/Descripción",
        default="Costos Estibado General",
        help_text="Identificador para este conjunto de costos"
    )

    estiba = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Estiba", null=True, blank=True
    )
    malla_tela = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Malla Tela", null=True, blank=True
    )

    malla_termica = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Malla Termica", null=True, blank=True
    )

    esquineros_zuncho = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Esquineros Zuncho", null=True, blank=True
    )
    entrega = models.DecimalField(
        validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
        verbose_name="Entrega", null=True, blank=True
    )

    fecha_actualizacion = models.DateField(auto_now=True)
    es_activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['-fecha_actualizacion']
        verbose_name = "Costos Estibado"
        verbose_name_plural = "Costos Estibado"

    def __str__(self):
        return f"{self.nombre} - ${self.costo_total}"

    @property
    def costo_total(self):
        """Suma de todos los costos de estibado"""
        return sum([
            self.estiba or Decimal('0'),
            self.malla_tela or Decimal('0'),
            self.malla_termica or Decimal('0'),
            self.esquineros_zuncho or Decimal('0'),
            self.entrega or Decimal('0')
        ])


class CotizacionConjuntaHistorico(models.Model):
    """
    Snapshot completo de una cotización conjunta aprobada.
    Guarda toda la información utilizada en el cálculo para poder
    visualizarla exactamente igual en cualquier momento futuro,
    independientemente de cambios en los modelos base.
    """
    
    # === CABECERA DE LA COTIZACIÓN ===
    numero_cotizacion = models.CharField(
        max_length=50, unique=True, verbose_name="Número de Cotización",
        help_text="Identificador único generado automáticamente"
    )
    
    # FKs para referencia (el snapshot JSON tiene los valores del momento)
    cliente = models.ForeignKey(
        Cliente, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cotizaciones_historico', verbose_name="Cliente"
    )
    aerolinea = models.ForeignKey(
        Aerolinea, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cotizaciones_historico', verbose_name="Aerolínea"
    )
    destino = models.ForeignKey(
        Iata, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cotizaciones_historico', verbose_name="Destino"
    )
    
    # Tipo de negociación
    TIPO_NEGOCIACION_CHOICES = [
        ('CIF', 'CIF'),
        ('FOB', 'FOB'),
    ]
    tipo_negociacion = models.CharField(
        max_length=3, choices=TIPO_NEGOCIACION_CHOICES, default='CIF',
        verbose_name="Tipo de Negociación"
    )
    
    # Parámetros de cálculo usados
    trm = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="TRM Usado"
    )
    utilidad_general_pct = models.DecimalField(
        max_digits=5, decimal_places=2, verbose_name="Utilidad General (%)"
    )
    heavens_pct = models.DecimalField(
        max_digits=5, decimal_places=2, verbose_name="% Heavens"
    )
    exportador_pct = models.DecimalField(
        max_digits=5, decimal_places=2, verbose_name="% Exportador"
    )
    
    # Totales de la cotización
    total_cajas = models.IntegerField(verbose_name="Total Cajas")
    total_pallets = models.IntegerField(verbose_name="Total Pallets")
    estibado_por_caja_usd = models.DecimalField(
        max_digits=10, decimal_places=4, verbose_name="Estibado por Caja USD",
        null=True, blank=True
    )
    
    # === SNAPSHOTS COMPLETOS EN JSON ===
    
    # Snapshot de la cabecera con nombres (no solo IDs)
    cabecera_snapshot = models.JSONField(
        verbose_name="Cabecera Snapshot",
        help_text="Nombres de cliente, aerolínea, destino tal como estaban en ese momento"
    )
    
    # Snapshot de costos globales usados (embarque, estibado, tarifa aérea)
    costos_globales_snapshot = models.JSONField(
        verbose_name="Costos Globales Snapshot",
        help_text="Costos de embarque, estibado y tarifa aérea usados en el cálculo"
    )
    
    # Snapshot de todos los items/productos con su detalle completo
    items_snapshot = models.JSONField(
        verbose_name="Items Snapshot",
        help_text="Lista completa de productos con todos los valores calculados y datos usados"
    )
    
    # Resumen de totales calculados
    totales_snapshot = models.JSONField(
        verbose_name="Totales Snapshot",
        help_text="Resumen de totales y utilidades de toda la cotización",
        null=True, blank=True
    )
    
    # === CONTROL Y AUDITORÍA ===
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    fecha_aprobacion = models.DateTimeField(
        default=timezone.now, verbose_name="Fecha de Aprobación"
    )
    usuario = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cotizaciones_aprobadas', verbose_name="Usuario que Aprobó"
    )
    notas = models.TextField(
        null=True, blank=True, verbose_name="Notas",
        help_text="Notas o comentarios adicionales sobre esta cotización"
    )
    
    class Meta:
        ordering = ['-fecha_aprobacion']
        verbose_name = "Cotización Conjunta Histórico"
        verbose_name_plural = "Cotizaciones Conjuntas Histórico"
        indexes = [
            models.Index(fields=['cliente', 'fecha_aprobacion']),
            models.Index(fields=['numero_cotizacion']),
        ]
    
    def __str__(self):
        cliente_str = self.cliente.nombre if self.cliente else "SIN CLIENTE"
        return f"{self.numero_cotizacion} - {cliente_str} ({self.fecha_aprobacion.strftime('%d/%m/%Y')})"
    
    @classmethod
    def generar_numero_cotizacion(cls):
        """Genera un número de cotización único basado en fecha y secuencial"""
        from datetime import datetime
        hoy = datetime.now()
        prefijo = f"COT-{hoy.strftime('%Y%m%d')}"
        
        # Buscar el último número del día
        ultimo = cls.objects.filter(
            numero_cotizacion__startswith=prefijo
        ).order_by('-numero_cotizacion').first()
        
        if ultimo:
            try:
                ultimo_num = int(ultimo.numero_cotizacion.split('-')[-1])
                nuevo_num = ultimo_num + 1
            except (ValueError, IndexError):
                nuevo_num = 1
        else:
            nuevo_num = 1
        
        return f"{prefijo}-{nuevo_num:04d}"
    
    def get_item_by_fruta_presentacion(self, fruta_nombre, presentacion_nombre):
        """Busca un item específico en el snapshot por fruta y presentación"""
        if not self.items_snapshot:
            return None
        for item in self.items_snapshot:
            meta = item.get('meta', {})
            if meta.get('fruta') == fruta_nombre and meta.get('presentacion') == presentacion_nombre:
                return item
        return None
    
    @property
    def resumen_productos(self):
        """Retorna un resumen de productos para visualización rápida"""
        if not self.items_snapshot:
            return []
        resumen = []
        for item in self.items_snapshot:
            meta = item.get('meta', {})
            resumen.append({
                'fruta': meta.get('fruta', 'N/A'),
                'presentacion': meta.get('presentacion', 'N/A'),
                'cajas': item.get('cajas', 0),
                'precio_fob': item.get('precio_final_fob', 0),
                'precio_cif': item.get('precio_final_cif', 0),
                'utilidad_total': item.get('utilidad_total', 0),
            })
        return resumen


class SubExportadora(models.Model):
    nombre = models.CharField(max_length=50, verbose_name="Subexportadora", unique=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Intermediario(models.Model):
    nombre = models.CharField(max_length=50, verbose_name="Intermediario", unique=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


def validate_awb(value):
    if len(value) != 12:
        raise ValidationError(
            'El AWB debe tener exactamente 12 caracteres.',
            params={'value': value},
        )
    if ' ' in value:
        raise ValidationError(
            'El AWB no puede contener espacios.',
            params={'value': value},
        )


# Los Campos editable=True Se deben cambiar una vez desplegado a produccion, lo mismo para el caso de reprogramado.
class Pedido(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, verbose_name="Cliente")
    intermediario = models.ForeignKey(Intermediario, on_delete=models.CASCADE, verbose_name="Intermediario", null=True,
                                      blank=True)
    semana = models.CharField(verbose_name="Semana", null=True, blank=True, editable=False)
    fecha_solicitud = models.DateField(verbose_name="Fecha Solicitud", auto_now_add=True, editable=False)
    fecha_entrega = models.DateField(verbose_name="Fecha Entrega")
    fecha_llegada = models.DateField(verbose_name="Fecha Llegada Estimada", blank=True, null=True)
    exportadora = models.ForeignKey(Exportador, on_delete=models.CASCADE, verbose_name="Exportador")
    subexportadora = models.ForeignKey(SubExportadora, on_delete=models.CASCADE, verbose_name="Subexportadora",
                                       null=True, blank=True)
    dias_cartera = models.IntegerField(verbose_name="Dias Cartera", editable=False, null=True, blank=True)
    awb = models.CharField(
        max_length=12,
        verbose_name="AWB",
        null=True,
        blank=True,
        default=None,
        validators=[validate_awb]
    )
    destino = models.ForeignKey(Iata, on_delete=models.CASCADE, verbose_name="Destino", null=True, blank=True)
    numero_factura = models.CharField(max_length=50, verbose_name="Factura", null=True, blank=True, default=None)
    total_cajas_solicitadas = models.IntegerField(verbose_name="Cajas Solicitadas", null=True, blank=True,
                                                  editable=False)
    total_cajas_enviadas = models.IntegerField(verbose_name="Cajas Enviadas", null=True, blank=True, editable=False)
    total_peso_bruto_solicitado = models.DecimalField(max_digits=10, decimal_places=2,
                                                      verbose_name="Total Bruto Solicitado",
                                                      editable=False, default=0)
    total_peso_bruto_enviado = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total Bruto Enviado",
                                                   editable=False, default=0)
    total_piezas_solicitadas = models.IntegerField(verbose_name="Total Piezas Solicitadas", null=True, blank=True,
                                                   editable=False)
    total_piezas_enviadas = models.IntegerField(verbose_name="Total Piezas Enviadas", null=True, blank=True,
                                                editable=False)
    nota_credito_no = models.CharField(max_length=50, verbose_name="Nota Crédito", null=True, blank=True, default=None)
    motivo_nota_credito = models.CharField(max_length=20, choices=motivo_nota, verbose_name="Motivo Nota Crédito",
                                           null=True, blank=True, default=None)
    descuento = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                    verbose_name="$Descuento C", null=True, blank=True,
                                    default=0)
    valor_total_nota_credito_usd = models.DecimalField(max_digits=10, decimal_places=2, editable=False,
                                                       verbose_name="$Total Nota Crédito", null=True, blank=True,
                                                       default=0)
    tasa_representativa_usd_diaria = models.DecimalField(max_digits=10, decimal_places=2, editable=False,
                                                         verbose_name="$TRM Oficial", null=True, blank=True, default=0)
    trm_cotizacion = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                         verbose_name="$TRM Cotización", null=True, blank=True, default=0)
    valor_pagado_cliente_usd = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                                   verbose_name="$Pagado Cliente", null=True, blank=True, default=0)
    utilidad_bancaria_usd = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                                verbose_name="$Utilidad Bancaria USD", null=True, blank=True, default=0)
    fecha_pago = models.DateField(verbose_name="Fecha Pago Cliente", null=True, blank=True)
    fecha_monetizacion = models.DateField(verbose_name="Fecha Monetización", null=True, blank=True)
    trm_monetizacion = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                           verbose_name="$TRM Monetización", null=True, blank=True)
    estado_factura = models.CharField(max_length=50, verbose_name="Estado Factura", null=True, blank=True,
                                      editable=False)
    diferencia_por_abono = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Diferencia o Abono",
                                               editable=False, null=True, blank=True)
    dias_de_vencimiento = models.IntegerField(verbose_name="Dias Vencimiento", editable=False, null=True, blank=True)
    valor_total_factura_usd = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$Total Factura",
                                                  null=True, blank=True, editable=False, default=0)
    valor_total_utilidad_usd = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$ Utilidades USD",
                                                   null=True, blank=True, editable=False, default=0)
    valor_total_recuperacion_usd = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$ Recuperaciónes USD", null=True, blank=True, editable=False, default=0)
    valor_utilidad_pesos = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="$Utilidades Pesos",
                                               null=True, blank=True, editable=False, default=0)
    documento_cobro_utilidad = models.CharField(max_length=50, verbose_name="Doc Cobro Utilidad", null=True, blank=True,
                                                default=None)
    fecha_pago_utilidad = models.DateField(verbose_name="Fecha Pago Utilidad", null=True, blank=True)
    estado_utilidad = models.CharField(max_length=50, verbose_name="Estado Utilidad", editable=False)
    estado_pedido = models.CharField(max_length=20, verbose_name="Estado Pedido", editable=False, null=True, blank=True,
                                     default="En Proceso")
    estado_cancelacion = models.CharField(max_length=20,
                                          choices=[
                                              ('sin_solicitud', 'Sin solicitud'),
                                              ('pendiente', 'Pendiente'),
                                              ('autorizado', 'Autorizado'),
                                              ('no_autorizado', 'No Autorizado')
                                          ],
                                          default='sin_solicitud', editable=False, verbose_name="Estado Cancelación")
    observaciones = models.TextField(verbose_name="Observaciones", validators=[MaxLengthValidator(300)], blank=True,
                                     null=True)
    # -------------------------------------- Campos Para Tracking ----------------------------------------------
    variedades = models.TextField(verbose_name="Variedades", validators=[MaxLengthValidator(500)], blank=True,
                                  null=True, editable=False)
    responsable_reserva = models.ForeignKey(Exportador, on_delete=models.CASCADE, verbose_name="Responsable Reserva",
                                            related_name='pedidos_responsable_reserva', blank=True, null=True)
    estatus_reserva = models.CharField(max_length=50, choices=estatus_reserva_list, verbose_name="Estado Reserva",
                                       null=True, blank=True)
    agencia_carga = models.ForeignKey(AgenciaCarga, on_delete=models.CASCADE, verbose_name="Agencia Carga", null=True,
                                      blank=True)
    aerolinea = models.ForeignKey(Aerolinea, on_delete=models.CASCADE, verbose_name="Aerolinea", null=True,
                                  blank=True)
    etd = models.DateTimeField(verbose_name="Estimated Time of Departure", null=True, blank=True)
    eta = models.DateTimeField(verbose_name="Estimated Time of Arrival", null=True, blank=True)
    peso_awb = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                   verbose_name="Peso Awb", null=True, blank=True)
    estado_documentos = models.CharField(max_length=60, choices=estado_documentos_list,
                                         verbose_name="Estado Documentos",
                                         null=True, blank=True)
    observaciones_tracking = models.TextField(validators=[MaxLengthValidator(300)],
                                              verbose_name="Observaciones Tracking", blank=True, null=True)
    eta_real = models.DateTimeField(verbose_name="Real ETA", null=True, blank=True)
    diferencia_peso_factura_awb = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kg Invoice / AWB",
                                                      null=True,
                                                      blank=True, editable=False)
    termo = models.CharField(max_length=20, verbose_name="Termo", null=True, blank=True, default=None)
    history = HistoricalRecords()

    def __str__(self):
        return str(self.id)


    @property
    def autorizacion(self):
        return self.autorizacioncancelacion_set.first()  # Asume que solo hay una autorización por pedido

    def save(self, *args, **kwargs):
        # Agregación de campo aerolinea:
        if self.awb:
            codigo_aerolinea = self.awb[:3]
            try:
                aerolinea = Aerolinea.objects.get(codigo=codigo_aerolinea)
                self.aerolinea = aerolinea
            except Aerolinea.DoesNotExist:
                self.aerolinea = None
        else:
            self.aerolinea = None

        # Comprobación de cambio de exportador y eliminación de detalles de pedido:
        if self.pk is not None:
            try:
                pedido_anterior = Pedido.objects.get(pk=self.pk)
                if pedido_anterior.exportadora != self.exportadora:
                    DetallePedido.objects.filter(pedido=self).delete()
                    # Reset all counters and financial fields when exporter changes
                    self.total_cajas_enviadas = 0
                    self.total_cajas_solicitadas = 0
                    self.total_piezas_solicitadas = 0
                    self.total_piezas_enviadas = 0
                    self.valor_total_factura_usd = 0
                    self.valor_pagado_cliente_usd = 0
                    self.valor_total_nota_credito_usd = 0
                    self.utilidad_bancaria_usd = 0
                    self.descuento = 0
                    self.valor_total_utilidad_usd = 0
                    self.valor_utilidad_pesos = 0
                    self.diferencia_por_abono = 0
                    self.peso_awb = 0
                    self.diferencia_peso_factura_awb = 0
                    self.variedades = None
                    self.total_peso_bruto_solicitado = 0
                    self.total_peso_bruto_enviado = 0
                if pedido_anterior.fecha_entrega and self.fecha_entrega and pedido_anterior.fecha_entrega != self.fecha_entrega:
                    self.estado_pedido = "Reprogramado"
            except Pedido.DoesNotExist:
                # Manejar el caso donde el pedido no exista, si es necesario
                pass

        # Campos Calculados
        if self.fecha_entrega is not None:
            semana_numero = self.fecha_entrega.isocalendar()[1]
            ano = self.fecha_entrega.year
            if semana_numero == 1 and self.fecha_entrega.month == 12:
                ano += 1

            # Si la semana es 52 o 53 y el día está en los primeros días de enero,
            # debemos ajustarlo al año anterior.
            if semana_numero >= 52 and self.fecha_entrega.month == 1:
                ano -= 1

            self.semana = f"{semana_numero}-{ano}"

        if self.valor_pagado_cliente_usd is None or self.valor_pagado_cliente_usd == 0:
            self.diferencia_por_abono = 0
        else:
            self.diferencia_por_abono = (
                    (self.valor_total_nota_credito_usd + self.valor_pagado_cliente_usd + self.utilidad_bancaria_usd
                     + self.descuento) - self.valor_total_factura_usd)
        if self.valor_total_factura_usd != 0 and self.trm_monetizacion is not None:
            self.valor_utilidad_pesos = self.valor_total_utilidad_usd * self.trm_monetizacion
        if self.valor_pagado_cliente_usd == 0:
            if self.estado_cancelacion == "autorizado":
                self.estado_factura = "Cancelada"
            elif self.valor_total_factura_usd == 0:
                self.estado_factura = "Factura sin valor"
            elif (
                    self.valor_total_nota_credito_usd + self.descuento) >= self.valor_total_factura_usd and self.valor_total_factura_usd > 0:
                self.estado_factura = "Pagada"
            else:
                self.estado_factura = "Pendiente Pago"
        else:
            total_restante = self.valor_total_factura_usd - self.valor_total_nota_credito_usd - self.utilidad_bancaria_usd - self.descuento
            if self.valor_pagado_cliente_usd < total_restante:
                self.estado_factura = "Abono"
            else:
                self.estado_factura = "Pagada"

        # Actualizar los campos que vienen del cliente
        if self.cliente:
            self.dias_cartera = self.cliente.negociaciones_cartera
        # Calcular dias_de_vencimiento:
        if self.fecha_pago is not None:
            self.dias_de_vencimiento = 0
        else:
            if isinstance(self.fecha_entrega, datetime):
                fecha_entrega = self.fecha_entrega.date()
            elif isinstance(self.fecha_entrega, date):
                fecha_entrega = self.fecha_entrega
            else:
                raise ValueError("Tipo de fecha no soportado")

            fecha_entrega += timedelta(days=self.dias_cartera)
            hoy = datetime.now().date()
            self.dias_de_vencimiento = (hoy - fecha_entrega).days
        # Cálculo diferencia_peso_factura_awb:
        if self.peso_awb:
            if self.total_peso_bruto_enviado > 0:
                self.diferencia_peso_factura_awb = self.peso_awb - self.total_peso_bruto_enviado
            else:
                self.diferencia_peso_factura_awb = None
        # Estado Utilidad:
        if self.fecha_pago is None and (self.valor_pagado_cliente_usd is None or self.valor_pagado_cliente_usd == 0):
            self.estado_utilidad = "Pendiente Pago Cliente"
        elif self.estado_factura == "Abono":
            self.estado_utilidad = "Factura en abono"
        elif self.fecha_pago is not None and self.estado_factura == "Pagada" and self.documento_cobro_utilidad is None:
            self.estado_utilidad = "Por Facturar"
        elif self.fecha_pago is not None and self.documento_cobro_utilidad is not None and self.fecha_pago_utilidad is None:
            self.estado_utilidad = "Facturada"
        elif self.fecha_pago_utilidad is not None and self.documento_cobro_utilidad is not None and self.fecha_pago is not None:
            self.estado_utilidad = "Pagada"
        else:
            self.estado_utilidad = "Pendiente Pago Cliente"

        # Estado pedido:
        if self.estado_cancelacion == "autorizado":
            self.estado_pedido = "Cancelado"
        elif self.awb and self.numero_factura is not None:
            self.estado_pedido = "Despachado"
        elif self.estado_utilidad == "Pagada" and self.estado_factura == "Pagada":
            self.estado_pedido = "Finalizado"
        elif self.awb is None or self.numero_factura is None:
            self.estado_pedido = "En Proceso"

        # Llama al metodo save de la clase base para realizar el guardado
        super().save(*args, **kwargs)

    def actualizar_tasa_representativa(self):
        # Usar fecha_pago si fecha_monetizacion es None
        fecha_base = self.fecha_monetizacion or self.fecha_pago

        if fecha_base is None:
            self.tasa_representativa_usd_diaria = 0
            Pedido.objects.filter(pk=self.pk).update(tasa_representativa_usd_diaria=0)
            return

        url = "https://www.datos.gov.co/resource/mcec-87by.json"
        response = requests.get(url)

        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame(data)
            df.loc[:, 'vigenciadesde'] = pd.to_datetime(df['vigenciadesde'])
            df = df.sort_values('vigenciadesde')
            fecha_base = pd.to_datetime(fecha_base)
            df_filtrado = df[df['vigenciadesde'] <= fecha_base]

            if not df_filtrado.empty:
                tasa_valor = df_filtrado.iloc[-1]['valor']
                self.tasa_representativa_usd_diaria = tasa_valor
                Pedido.objects.filter(pk=self.pk).update(tasa_representativa_usd_diaria=tasa_valor)
        else:
            print("Error al acceder al banco de la republica")

    class Meta:
        ordering = ['-id']
        indexes = [
            models.Index(fields=['cliente']),
            models.Index(fields=['exportadora']),
            models.Index(fields=['awb']),
            models.Index(fields=['numero_factura']),
        ]

class AutorizacionCancelacion(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, verbose_name="Pedido")
    usuario_solicitante = models.ForeignKey(User, on_delete=models.CASCADE, related_name='solicitante',
                                            verbose_name="Usuario Solicitante")
    usuario_autorizador = models.ForeignKey(User, on_delete=models.CASCADE, related_name='autorizador',
                                            verbose_name="Usuario Autorizador", null=True, blank=True)
    autorizado = models.BooleanField(default=False)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_autorizacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['pedido']

    def __str__(self):
        # Manejo de IDs y campos nulos
        pedido_str = self.pedido_id if self.pedido_id else "N/A"
        solic_str = self.usuario_solicitante.username if self.usuario_solicitante_id else "SIN SOLICITANTE"
        auto_str = (
            self.usuario_autorizador.username
            if self.usuario_autorizador_id else "SIN AUTORIZADOR"
        )
        return f'Pedido: {pedido_str} - Solicitante: {solic_str} Autorizador: {auto_str}'


class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, verbose_name="Pedido")
    fruta = models.ForeignKey(Fruta, on_delete=models.CASCADE, verbose_name="Fruta")
    presentacion = models.ForeignKey(Presentacion, on_delete=models.CASCADE, verbose_name="Presentación")
    cajas_solicitadas = models.IntegerField(validators=[MinValueValidator(0)], verbose_name="Cajas Solicitadas")
    presentacion_peso = models.DecimalField(verbose_name="Peso Caja", editable=False, max_digits=5,
                                            decimal_places=2, null=True, blank=True)
    kilos = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kilos Netos", editable=False)
    cajas_enviadas = models.IntegerField(validators=[MinValueValidator(0)], verbose_name="Cajas Enviadas", null=True,
                                         blank=True, default=0)
    kilos_enviados = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kilos Enviados", editable=False)
    diferencia = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Diferencia", editable=False)
    tipo_caja = models.ForeignKey(TipoCaja, on_delete=models.CASCADE, verbose_name="Marca Caja")
    referencia = models.ForeignKey(Referencias, on_delete=models.CASCADE, verbose_name="Referencia")
    stickers = models.CharField(max_length=255, verbose_name="Stickers", editable=False, null=True, blank=True)
    lleva_contenedor = models.BooleanField(choices=[(True, "Sí"), (False, "No")], verbose_name="LLeva Contenedor")
    referencia_contenedor = models.CharField(max_length=255, verbose_name="Contenedor", blank=True,
                                             null=True, editable=False)
    cantidad_contenedores = models.IntegerField(verbose_name="No. Contenedores", blank=True, null=True,
                                                editable=False)
    tarifa_utilidad = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                          verbose_name="$Utilidad Por Caja", null=True,
                                          blank=True, default=0)
    tarifa_recuperacion = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                            verbose_name="$ Recuperacion", null=True,
                                            blank=True, default=0)
    valor_x_caja_usd = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                           verbose_name="$Por Caja USD", null=True,
                                           blank=True, default=0)
    valor_x_producto = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$Por Producto", null=True,
                                           blank=True, editable=False)
    no_cajas_nc = models.DecimalField(max_digits=10, decimal_places=3, verbose_name="No Cajas NC", null=True,
                                      blank=True, default=0)
    valor_nota_credito_usd = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$Nota Crédito USD",
                                                 null=True, blank=True, editable=False)
    afecta_utilidad = models.BooleanField(choices=[(True, "Sí"), (False, "No"), (None, "Descuento")],
                                          verbose_name="Afecta Utilidad",
                                          null=True, blank=True, default=False)
    valor_total_utilidad_x_producto = models.DecimalField(max_digits=10, decimal_places=2,
                                                          verbose_name="$Utilidad X Producto", null=True,
                                                          blank=True, editable=False)
    valor_total_recuperacion_x_producto = models.DecimalField(max_digits=10, decimal_places=2,
                                                          verbose_name="$Recuperación X Producto", null=True,
                                                          blank=True, editable=False)
    precio_proforma = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$Proforma", null=True,
                                          blank=True, default=None)
    observaciones = models.CharField(verbose_name="Observaciones", max_length=100, blank=True, null=True)
    history = HistoricalRecords()

    def get_inline_title(self):
        """Custom title for inline representation in Unfold admin"""
        return f"Detalle {self.id}: {self.fruta} - {self.presentacion} ({self.cajas_solicitadas} cajas)"

    def save(self, *args, **kwargs):
        # 1) Guardar detalle antiguo (si existe) para comparar
        detalle_anterior = None
        if self.pk:
            try:
                detalle_anterior = DetallePedido.objects.get(pk=self.pk)
            except DetallePedido.DoesNotExist:
                detalle_anterior = None

        # 2) Cálculos propios del detalle (igual que antes)
        if self.presentacion:
            self.presentacion_peso = self.presentacion.kilos

        self.kilos = self.presentacion_peso * self.cajas_solicitadas
        self.kilos_enviados = self.presentacion_peso * self.cajas_enviadas
        self.diferencia = self.cajas_solicitadas - self.cajas_enviadas

        self.valor_x_producto = self.valor_x_caja_usd * self.cajas_enviadas
        if self.afecta_utilidad is True:  # O sea "Sí"
            self.valor_total_utilidad_x_producto = (self.cajas_enviadas - self.no_cajas_nc) * self.tarifa_utilidad
            self.valor_total_recuperacion_x_producto = (self.cajas_enviadas - self.no_cajas_nc) * self.tarifa_recuperacion
            self.valor_nota_credito_usd = (self.no_cajas_nc or 0) * self.valor_x_caja_usd
        elif self.afecta_utilidad is False:  # O sea "No"
            self.valor_total_utilidad_x_producto = self.cajas_enviadas * self.tarifa_utilidad
            self.valor_total_recuperacion_x_producto = self.cajas_enviadas * self.tarifa_recuperacion
            self.valor_nota_credito_usd = (self.no_cajas_nc or 0) * self.valor_x_caja_usd
        else:  # None = "Descuento"
            self.valor_total_recuperacion_x_producto =(self.cajas_enviadas - self.no_cajas_nc) * self.tarifa_recuperacion
            self.valor_total_utilidad_x_producto = (self.cajas_enviadas - self.no_cajas_nc) * self.tarifa_utilidad
            self.valor_nota_credito_usd = 0

        if self.lleva_contenedor and self.referencia and self.referencia.contenedor:
            self.referencia_contenedor = self.referencia.contenedor.nombre
            self.cantidad_contenedores = math.ceil(self.cajas_enviadas / self.referencia.cant_contenedor)
        else:
            self.referencia_contenedor = None
            self.cantidad_contenedores = None

        self.stickers = self.tipo_caja.nombre if self.tipo_caja else None

        super().save(*args, **kwargs)

        # 3) Actualizar totales de manera incremental
        if detalle_anterior is None:
            # Caso: registro nuevo
            self._actualizar_totales_incremental('add')
        else:
            # Caso: edición de registro existente
            self._actualizar_totales_incremental('edit', detalle_anterior)

    def delete(self, *args, **kwargs):
        # Guardamos valores actuales para restarlos del Pedido
        detalle_copia = DetallePedido.objects.get(pk=self.pk)

        super().delete(*args, **kwargs)

        # Llamamos la actualización incremental pasando la copia
        detalle_copia._actualizar_totales_incremental('delete')

    def _incrementar_variedad(self):
        """Agrega la fruta de este detalle al campo `variedades` del pedido, si aún no existe."""
        pedido = self.pedido
        fruta_nombre = self.fruta.nombre

        # Convertir el campo `variedades` en un conjunto de frutas
        if not pedido.variedades:
            set_frutas = set()
        else:
            set_frutas = set(f.strip() for f in pedido.variedades.split(",") if f.strip())

        # Si la fruta no estaba en el conjunto, la añadimos
        if fruta_nombre not in set_frutas:
            set_frutas.add(fruta_nombre)
            # Convertimos el set a string ordenado (opcional, para mantener consistencia)
            pedido.variedades = ", ".join(sorted(set_frutas))
            pedido.save()

    def _disminuir_variedad(self):
        """
        Elimina la fruta de este detalle del campo `variedades` del pedido
        solo si no existe otro DetallePedido que la utilice.
        """
        pedido = self.pedido
        fruta_nombre = self.fruta.nombre

        # Verificamos si hay otros detalles usando esta fruta
        existe_otro = DetallePedido.objects.filter(
            pedido=pedido,
            fruta=self.fruta
        ).exclude(pk=self.pk).exists()

        # Si NO hay más detalles con esta fruta, la removemos de `variedades`
        if not existe_otro:
            if not pedido.variedades:
                return  # Evitamos errores si está vacío
            set_frutas = set(f.strip() for f in pedido.variedades.split(",") if f.strip())
            if fruta_nombre in set_frutas:
                set_frutas.remove(fruta_nombre)
                pedido.variedades = ", ".join(sorted(set_frutas))
                pedido.save()

    def _disminuir_variedad_fruta_previa(self, fruta_previa):
        """
        Similar a _disminuir_variedad, pero usando la fruta_previa.
        """
        pedido = self.pedido
        fruta_nombre = fruta_previa.nombre
        existe_otro = DetallePedido.objects.filter(
            pedido=pedido,
            fruta=fruta_previa
        ).exclude(pk=self.pk).exists()

        if not existe_otro:
            set_frutas = set(f.strip() for f in (pedido.variedades or "").split(",") if f.strip())
            if fruta_nombre in set_frutas:
                set_frutas.remove(fruta_nombre)
                pedido.variedades = ", ".join(sorted(set_frutas))
                pedido.save()

    def _actualizar_totales_incremental(self, operacion, detalle_anterior=None):
        pedido = self.pedido

        # 1) Cálculo incremental para cajas, valores monetarios, pesos brutos, etc.
        cajas_enviadas_delta = self.cajas_enviadas or 0
        cajas_solicitadas_delta = self.cajas_solicitadas or 0
        valor_x_producto_delta = self.valor_x_producto or 0
        valor_nota_delta = self.valor_nota_credito_usd or 0
        valor_utilidad_delta = self.valor_total_utilidad_x_producto or 0
        valor_recuperacion_delta = self.valor_total_recuperacion_x_producto or 0
        peso_bruto_solicitado_delta = self.calcular_peso_bruto()
        peso_bruto_enviado_delta = self.calcular_peso_bruto_final()

        if operacion == 'edit' and detalle_anterior:
            cajas_enviadas_delta -= (detalle_anterior.cajas_enviadas or 0)
            cajas_solicitadas_delta -= (detalle_anterior.cajas_solicitadas or 0)
            valor_x_producto_delta -= (detalle_anterior.valor_x_producto or 0)
            valor_nota_delta -= (detalle_anterior.valor_nota_credito_usd or 0)
            valor_utilidad_delta -= (detalle_anterior.valor_total_utilidad_x_producto or 0)
            valor_recuperacion_delta -= (detalle_anterior.valor_total_recuperacion_x_producto or 0)
            peso_bruto_solicitado_delta -= detalle_anterior.calcular_peso_bruto()
            peso_bruto_enviado_delta -= detalle_anterior.calcular_peso_bruto_final()

        elif operacion == 'delete':
            cajas_enviadas_delta = -(self.cajas_enviadas or 0)
            cajas_solicitadas_delta = -(self.cajas_solicitadas or 0)
            valor_x_producto_delta = -(self.valor_x_producto or 0)
            valor_nota_delta = -(self.valor_nota_credito_usd or 0)
            valor_utilidad_delta = -(self.valor_total_utilidad_x_producto or 0)
            valor_recuperacion_delta = -(self.valor_total_recuperacion_x_producto or 0)
            peso_bruto_solicitado_delta = -self.calcular_peso_bruto()
            peso_bruto_enviado_delta = -self.calcular_peso_bruto_final()

        # 2) Aplicamos esos deltas al Pedido (solo para los campos "numéricos" que sí queremos manejar de forma incremental)
        pedido.total_cajas_enviadas = (pedido.total_cajas_enviadas or 0) + cajas_enviadas_delta
        pedido.total_cajas_solicitadas = (pedido.total_cajas_solicitadas or 0) + cajas_solicitadas_delta
        pedido.valor_total_factura_usd = (pedido.valor_total_factura_usd or 0) + valor_x_producto_delta
        pedido.valor_total_nota_credito_usd = (pedido.valor_total_nota_credito_usd or 0) + valor_nota_delta
        pedido.valor_total_utilidad_usd = (pedido.valor_total_utilidad_usd or 0) + valor_utilidad_delta
        pedido.valor_total_recuperacion_usd = (pedido.valor_total_recuperacion_usd or 0) + valor_recuperacion_delta
        pedido.total_peso_bruto_solicitado = (pedido.total_peso_bruto_solicitado or 0) + peso_bruto_solicitado_delta
        pedido.total_peso_bruto_enviado = (pedido.total_peso_bruto_enviado or 0) + peso_bruto_enviado_delta

        # 3) Recalcular total de piezas (solicitadas y enviadas) sumando todos los DetallePedido
        #    y aplicar math.ceil al TOTAL, en lugar de cada detalle.
        total_piezas_solicitadas = 0
        total_piezas_enviadas = 0

        detalles = pedido.detallepedido_set.all()
        for d in detalles:
            total_piezas_solicitadas += (d.calcular_no_piezas() or 0)
            total_piezas_enviadas += (d.calcular_no_piezas_final() or 0)

        pedido.total_piezas_solicitadas = math.ceil(total_piezas_solicitadas)
        pedido.total_piezas_enviadas = math.ceil(total_piezas_enviadas)

        # 4) Guardar el pedido con todos los cambios
        pedido.save()

    def calcular_peso_bruto(self):
        # Asegurarse de que todos los valores son de tipo Decimal
        porcentaje = Decimal(self.referencia.porcentaje_peso_bruto)
        kilos = Decimal(self.kilos)
        return round(kilos + ((kilos * porcentaje) / 100), 2)

    def calcular_peso_bruto_final(self):
        # Asegurarse de que todos los valores son de tipo Decimal
        porcentaje = Decimal(self.referencia.porcentaje_peso_bruto)
        kilos_enviados = Decimal(self.kilos_enviados)
        return round(kilos_enviados + ((kilos_enviados * porcentaje) / 100), 2)

    def calcular_no_piezas(self):
        # todos los valores son de tipo Decimal
        cajas_solicitadas = Decimal(self.cajas_solicitadas)
        if self.lleva_contenedor is True:
            return cajas_solicitadas / self.referencia.cantidad_pallet_con_contenedor
        else:
            return cajas_solicitadas / self.referencia.cantidad_pallet_sin_contenedor

    def calcular_no_piezas_final(self):
        # todos los valores son de tipo Decimal
        cajas_enviadas = Decimal(self.cajas_enviadas)
        if self.lleva_contenedor is True:
            return cajas_enviadas / self.referencia.cantidad_pallet_con_contenedor
        else:
            return cajas_enviadas / self.referencia.cantidad_pallet_sin_contenedor

    class Meta:
        ordering = ['pedido', 'fruta']
        indexes = [
            models.Index(fields=['pedido']),
            models.Index(fields=['fruta']),
            models.Index(fields=['referencia']),
            models.Index(fields=['presentacion']),
        ]

def actualizar_inventario(referencia):
    Inventario = import_module('inventarios.models').Inventario
    inventario, created = Inventario.objects.get_or_create(
        numero_item=referencia,
        defaults={'ventas': 0, 'venta_contenedor': 0}
    )
    inventario.ventas = DetallePedido.objects.filter(
        referencia=referencia
    ).aggregate(Sum('cajas_enviadas'))['cajas_enviadas__sum'] or 0
    inventario.venta_contenedor = DetallePedido.objects.filter(
        referencia=referencia
    ).aggregate(Sum('cantidad_contenedores'))['cantidad_contenedores__sum'] or 0
    inventario.save()


@receiver(pre_save, sender=DetallePedido)
def almacenar_referencia_antes_de_guardar(sender, instance, **kwargs):
    try:
        referencia_previa = sender.objects.get(pk=instance.pk)
        instance._referencia_previa = referencia_previa.referencia
    except ObjectDoesNotExist:
        instance._referencia_previa = None

@receiver(pre_save, sender=DetallePedido)
def almacenar_fruta_previa(sender, instance, **kwargs):
    try:
        detalle_previo = sender.objects.get(pk=instance.pk)
        instance._fruta_previa = detalle_previo.fruta
    except sender.DoesNotExist:
        instance._fruta_previa = None


@receiver(post_save, sender=DetallePedido)
def actualizar_inventario_despues_de_guardar(sender, instance, **kwargs):
    from importlib import import_module
    Inventario = import_module('inventarios.models').Inventario

    referencia_antigua = getattr(instance, '_referencia_previa', None)
    referencia_nueva = instance.referencia

    if referencia_antigua and referencia_antigua != referencia_nueva:
        # Actualizar inventario para la referencia antigua
        actualizar_inventario(referencia_antigua)

    # Actualizar inventario para la referencia nueva
    actualizar_inventario(referencia_nueva)

@receiver(post_save, sender=DetallePedido)
def detalle_pedido_post_save(sender, instance, created, **kwargs):
    """
    Se llama cada vez que se guarda un DetallePedido.
    - Si es nuevo, incrementa la fruta directamente.
    - Si se edita, revisa si cambió la fruta (usando _referencia_previa o algo similar).
    """
    if created:
        # DetallePedido nuevo -> simplemente incrementamos la fruta
        instance._incrementar_variedad()
    else:
        # DetallePedido existente -> verificar si la fruta cambió
        fruta_previa = getattr(instance, '_fruta_previa', None)
        if fruta_previa and fruta_previa != instance.fruta:
            # Disminuimos la fruta anterior, incrementamos la nueva
            instance._disminuir_variedad_fruta_previa(fruta_previa)
            instance._incrementar_variedad()



@receiver(post_delete, sender=DetallePedido)
def actualizar_inventario_al_eliminar(sender, instance, **kwargs):
    from importlib import import_module
    Inventario = import_module('inventarios.models').Inventario
    nuevo_inventario = Inventario.objects.get(
        numero_item=instance.referencia,
    )
    nuevo_inventario.ventas = DetallePedido.objects.filter(
        referencia=instance.referencia
    ).aggregate(Sum('cajas_enviadas'))['cajas_enviadas__sum'] or 0
    nuevo_inventario.venta_contenedor = DetallePedido.objects.filter(
        referencia=instance.referencia
    ).aggregate(Sum('cantidad_contenedores'))['cantidad_contenedores__sum'] or 0
    nuevo_inventario.save()

@receiver(post_delete, sender=DetallePedido)
def detalle_pedido_post_delete(sender, instance, **kwargs):
    """
    Se llama al eliminar un DetallePedido -> disminuye la fruta.
    """
    instance._disminuir_variedad()

@receiver(post_save, sender=Pedido)
def actualizar_tasa_representativa_post_save(sender, instance, **kwargs):
    instance.actualizar_tasa_representativa()

