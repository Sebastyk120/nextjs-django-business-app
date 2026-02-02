from datetime import timedelta, date
from decimal import Decimal, ROUND_HALF_UP
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models, transaction
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from comercial.models import Fruta, Exportador
from .choices import origen_nacional, origen_transferencia, regimen
from django.core.exceptions import ValidationError


class ProveedorNacional(models.Model):
    nombre = models.CharField(max_length=50, verbose_name="Nombre Proveedor", unique=True)
    nit = models.CharField(max_length=20, verbose_name="Nit/C.C Proveedor", unique=True, null=True, blank=True)
    telefono = models.CharField(max_length=20, verbose_name="Telefono Proveedor", blank=True, null=True)
    email = models.EmailField(max_length=50, verbose_name="Email Proveedor", blank=True, null=True)
    asohofrucol = models.BooleanField(default=False, verbose_name="Asohofrucol 1%")
    rte_fte = models.BooleanField(default=False, verbose_name="Rete Fuente 1,5%")
    rte_ica = models.BooleanField(default=False, verbose_name="Rete Ica 4,14/1000")
    regimen = models.CharField(max_length=30, verbose_name="Regimen", choices=regimen, blank=True, null=True)
    ciudad  = models.CharField(max_length=50, verbose_name="Ciudad", blank=True, null=True)
    observaciones = models.TextField(verbose_name="Observaciones", blank=True, null=True)
    
    def __str__(self):
        return self.nombre

class Empaque(models.Model):
    nombre = models.CharField(max_length=20, verbose_name="Nombre Empaque", unique=True)
    peso = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Peso Empaque", validators=[MinValueValidator(0.0)])
    
    def __str__(self):
        return str(self.nombre) + ' Kg ' + str(self.peso)


class CompraNacional(models.Model):
    proveedor = models.ForeignKey(ProveedorNacional, on_delete=models.PROTECT, verbose_name="Proveedor")
    origen_compra = models.CharField(max_length=20 , choices=origen_nacional, verbose_name="Origen")
    fruta = models.ForeignKey(Fruta, on_delete=models.PROTECT, verbose_name="Fruta")
    peso_compra = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Peso Guia/Compra", validators=[MinValueValidator(0.0)])
    fecha_compra = models.DateField(verbose_name="Fecha de Compra")
    numero_guia = models.CharField(max_length=20, verbose_name="Numero Guia", unique=True)
    remision = models.CharField(max_length=20, verbose_name="Remision", blank=True, null=True, default='Sin Remision')
    precio_compra_exp = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$ Compra Exp", validators=[MinValueValidator(0.0)])
    precio_compra_nal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$ Compra Nal", blank=True, null=True, validators=[MinValueValidator(0.0)], editable=False)
    tipo_empaque = models.ForeignKey(Empaque, on_delete=models.PROTECT, verbose_name="Tipo Empaque")
    cantidad_empaque = models.PositiveIntegerField(verbose_name="Cantidad Empaque", validators=[MinValueValidator(0)])
    observaciones = models.TextField(verbose_name="Observaciones", blank=True, null=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return str(self.id) + ' - ' + str(self.proveedor) + ' Guia: ' + str(self.numero_guia) + ' Peso: ' + str(self.peso_compra)

    def calcular_porcentaje_completitud(self):
        """Calcula el porcentaje de completitud considerando múltiples ventas."""
        ventas = self.ventas.all()
        if not ventas.exists():
            return 25  # Solo existe CompraNacional (1/4 * 100 = 25%)
        
        total_porcentaje = 0
        for venta in ventas:
            completados = 2  # CompraNacional + VentaNacional
            if hasattr(venta, 'reportecalidadexportador'):
                completados += 1
                if hasattr(venta.reportecalidadexportador, 'reportecalidadproveedor'):
                    completados += 1
            
            if completados < 4:
                venta_porcentaje = (completados / 4) * 90
            else:
                reporte_prov = venta.reportecalidadexportador.reportecalidadproveedor
                venta_porcentaje = 100 if reporte_prov.completado else 90
            
            total_porcentaje += venta_porcentaje
        
        return total_porcentaje / ventas.count() if ventas.count() > 0 else 25

    @property
    def porcentaje_completitud(self):
        return self.calcular_porcentaje_completitud()

    def obtener_clase_progreso_color(self):
        porcentaje = self.porcentaje_completitud
        if porcentaje == 100:
            return 'barra-progreso-completa'
        if porcentaje >= 75:
            return 'barra-progreso-semicompleta'
        elif porcentaje >= 50:
            return 'barra-progreso-medio'
        else:
            return 'barra-progreso-bajo'

    @property
    def progreso_color(self):
        return self.obtener_clase_progreso_color()

    @property
    def reporte_completo(self):
        """Verifica si todas las ventas asociadas tienen sus reportes completos."""
        ventas = self.ventas.all()
        if not ventas.exists():
            return False
        
        for venta in ventas:
            tiene_reporte_exp = hasattr(venta, 'reportecalidadexportador')
            if not tiene_reporte_exp:
                return False
            tiene_reporte_prov = hasattr(venta.reportecalidadexportador, 'reportecalidadproveedor')
            if not tiene_reporte_prov:
                return False
        
        return True


TIPO_VENTA_CHOICES = [
    ('Mango Europa', 'Mango Europa'),
    ('Otros Destinos', 'Otros Destinos'),
]


class VentaNacional(models.Model):
    compra_nacional = models.ForeignKey(CompraNacional, on_delete=models.CASCADE, verbose_name="Compra Nacional", related_name='ventas')
    exportador = models.ForeignKey(Exportador, on_delete=models.PROTECT, verbose_name="Exportador")
    fecha_llegada = models.DateField(verbose_name="Fecha de Llegada")
    fecha_vencimiento = models.DateField(verbose_name="Vencimiento Reporte", editable=False)
    cantidad_empaque_recibida = models.PositiveIntegerField(verbose_name="Cantidad Empaque Recibida", validators=[MinValueValidator(0)], blank=True, null=True)
    peso_bruto_recibido = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Peso Bruto Recibido", validators=[MinValueValidator(0.0)])
    peso_neto_recibido = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Peso Neto Recibido", validators=[MinValueValidator(0.0)], editable=False)
    diferencia_peso = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Diferencia Peso", validators=[MinValueValidator(0.0)], blank=True, null=True, editable=False)
    diferencia_empaque = models.IntegerField(verbose_name="Diferencia Empaque", blank=True, null=True, editable=False)
    estado_venta = models.CharField(max_length=20, verbose_name="Estado Reporte (Exportador)", default='Pendiente', editable=False)
    observaciones = models.TextField(verbose_name="Observaciones", blank=True, null=True)
    tipo = models.CharField(max_length=20, verbose_name="Tipo", choices=TIPO_VENTA_CHOICES, blank=True, null=True)
    lote = models.CharField(max_length=30, verbose_name="Lote", blank=True, null=True)

    class Meta:
        ordering = ['-pk']

    def __str__(self):
        return str(self.id) + ' - ' + str(self.compra_nacional.proveedor) + ' Guia: ' + str(self.compra_nacional.numero_guia) + ' Neto Recibido: ' + str(self.peso_neto_recibido)

    def clean(self):
        if not self.compra_nacional_id:
            return
        if self.cantidad_empaque_recibida:
            if self.cantidad_empaque_recibida > self.compra_nacional.cantidad_empaque:
                raise ValidationError({
                    'cantidad_empaque_recibida': "El valor no puede ser mayor que la cantidad de empaque de compra."
                })
        super().clean()

    def save(self, *args, **kwargs):
        if not self.cantidad_empaque_recibida:  # Si no se ha modificado, ingreso la cantidad de empaque de compra.
            self.cantidad_empaque_recibida = self.compra_nacional.cantidad_empaque
        current_date = self.fecha_llegada
        days_added = 0
        while days_added < 3:
            current_date += timedelta(days=1)
            # Saltar solo domingos (weekday 6); contar sábados
            if current_date.weekday() != 6:
                days_added += 1

        self.fecha_vencimiento = current_date
        self.peso_neto_recibido = self.peso_bruto_recibido - (self.cantidad_empaque_recibida * self.compra_nacional.tipo_empaque.peso)
        self.diferencia_empaque = self.cantidad_empaque_recibida - self.compra_nacional.cantidad_empaque
        self.diferencia_peso = self.peso_bruto_recibido - self.compra_nacional.peso_compra
        if hasattr(self, 'reportecalidadexportador'):
            self.estado_venta = "Completado"
        elif date.today() > self.fecha_vencimiento:
            self.estado_venta = "Vencido"
            
        super().save(*args, **kwargs)


class ReporteCalidadExportador(models.Model):
    venta_nacional = models.OneToOneField(VentaNacional, on_delete=models.CASCADE, primary_key=True, verbose_name="Venta Nacional" )
    remision_exp = models.CharField(max_length=20, verbose_name="Remision/Reporte", blank=True, null=True, default='Sin Remision')
    fecha_reporte = models.DateField(verbose_name="Fecha Reporte Exp")
    kg_totales = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kg Totales", validators=[MinValueValidator(0.0)], editable=False)
    kg_exportacion = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kg Exp", validators=[MinValueValidator(0.0)])
    porcentaje_exportacion = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="% Exp", validators=[MinValueValidator(0.0), MaxValueValidator(100.00)], editable=False)
    precio_venta_kg_exp = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$ Kg Exp", validators=[MinValueValidator(0.0)])
    kg_nacional = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kg Nal", validators=[MinValueValidator(0.0)])
    porcentaje_nacional = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="% Nal", validators=[MinValueValidator(0.0), MaxValueValidator(100.00)], editable=False)
    precio_venta_kg_nal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$ Kg Nal", validators=[MinValueValidator(0.0)])
    kg_merma = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kg Merma", validators=[MinValueValidator(0.0)], editable=False)
    porcentaje_merma = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="% Merma", validators=[MinValueValidator(0.0), MaxValueValidator(100.00)], editable=False)
    precio_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total Factura", validators=[MinValueValidator(0.0)], editable=False)
    factura = models.CharField(max_length=20, verbose_name="Factura Heavens", blank=True, null=True)
    fecha_factura = models.DateField(verbose_name="Fecha Factura", blank=True, null=True)
    vencimiento_factura = models.DateField(verbose_name="Vencimiento Factura", blank=True, null=True, editable=False)
    estado_reporte_exp = models.CharField(max_length=20, verbose_name="Estado Reporte Exp", default='Pendiente', editable=False)

    class Meta:
        ordering = ['-pk']

    def __str__(self):
        return str(self.id) + ' - ' + str(self.venta_nacional.compra_nacional.numero_guia) + ' Exp: ' + str(self.venta_nacional.exportador) + ' Remision: ' + str(self.remision_exp)

    @property
    def id(self):
        return self.pk

    def clean(self):
        # Se evita el acceso a venta_nacional si aún no ha sido asignada.
        if not self.venta_nacional_id:
            return
            
        if self.venta_nacional.peso_neto_recibido:
            total = self.venta_nacional.peso_neto_recibido
            
            # Validación kg_exportacion
            if self.kg_exportacion and self.kg_exportacion > total:
                raise ValidationError({
                    'kg_exportacion': f"El valor no puede ser mayor que el peso neto recibido. ({total})"
                })
                
            # Validación kg_nacional
            if self.kg_nacional and self.kg_nacional > total:
                raise ValidationError({
                    'kg_nacional': f"El valor no puede ser mayor que el peso neto recibido. ({total})"
                })
                
            # Validación suma total
            if self.kg_exportacion and self.kg_nacional:
                computed_kg_merma = total - self.kg_exportacion - self.kg_nacional
                if computed_kg_merma < Decimal('0.00'):
                    raise ValidationError(f"La suma de Kg exportación y Kg nacional no puede superar el peso neto recibido. ({total})")

        
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.fecha_factura is None:
            self.vencimiento_factura = None
        else:
            self.vencimiento_factura = self.fecha_factura + timedelta(days=20)
        self.kg_totales = self.venta_nacional.peso_neto_recibido
        self.porcentaje_exportacion = (self.kg_exportacion / self.kg_totales * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.porcentaje_nacional = (self.kg_nacional / self.kg_totales * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.kg_merma = self.venta_nacional.peso_neto_recibido - self.kg_exportacion - self.kg_nacional
        self.porcentaje_merma = (self.kg_merma / self.kg_totales * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.precio_total = (self.kg_exportacion * self.precio_venta_kg_exp) + (self.kg_nacional * self.precio_venta_kg_nal)
        if self.factura:
            self.estado_reporte_exp = "Facturado"
        
        super().save(*args, **kwargs)
        
class ReporteCalidadProveedor(models.Model):
    rep_cal_exp = models.OneToOneField(ReporteCalidadExportador, on_delete=models.CASCADE, primary_key=True, verbose_name="Reporte Calidad Exportador")
    p_fecha_reporte = models.DateField(verbose_name="Fecha Reporte Prov", auto_now_add=True)
    p_kg_totales = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kg Totales", validators=[MinValueValidator(0.0)], null=True, blank=True)
    p_kg_exportacion = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kg Exp", validators=[MinValueValidator(0.0)], blank=True, null=True)
    p_porcentaje_exportacion = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="% Exp", validators=[MinValueValidator(0.0), MaxValueValidator(100.00)], editable=False)
    p_precio_kg_exp = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$ Kg Exp", validators=[MinValueValidator(0.0)], editable=False)
    p_kg_nacional = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kg Nal", validators=[MinValueValidator(0.0)], blank=True, null=True)
    p_porcentaje_nacional = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="% Nal", validators=[MinValueValidator(0.0), MaxValueValidator(100.00)], editable=False)
    p_precio_kg_nal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$ Kg Nal", validators=[MinValueValidator(0.0)], editable=False)
    p_kg_merma = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kg Merma", validators=[MinValueValidator(0.0)], editable=False)
    p_porcentaje_merma = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="% Merma", validators=[MinValueValidator(0.0), MaxValueValidator(100.00)], editable=False)
    p_total_facturar = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total Facturar", validators=[MinValueValidator(0.0)], editable=False)
    asohofrucol = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Asohofrucol 1%", validators=[MinValueValidator(0.0)], editable=False, default=0)
    rte_fte = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Rte Fte 1.5%", validators=[MinValueValidator(0.0)], editable=False, default=0)
    rte_ica = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Rte Ica 4.14/1000", validators=[MinValueValidator(0.0)], editable=False, default=0)
    p_total_pagar = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total A Pagar", validators=[MinValueValidator(0.0)], editable=False, default=0)
    monto_pendiente = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Monto Pendiente", validators=[MinValueValidator(0.0)], editable=False, default=0)
    p_utilidad = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Utilidad", editable=False, default=0)
    p_utilidad_sin_ajuste = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Utilidad Sin Ajuste", editable=False, default=0, null=True, blank=True)
    diferencia_utilidad = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Diferencia Utilidad", editable=False, default=0, null=True, blank=True)
    p_porcentaje_utilidad = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="% Utilidad", validators=[MinValueValidator(0.0), MaxValueValidator(100.00)], editable=False)
    reporte_enviado = models.BooleanField(default=False, verbose_name="Reporte Enviado")
    factura_prov = models.CharField(max_length=20, verbose_name="No Factura Proveedor", blank=True, null=True)
    reporte_pago = models.BooleanField(default=False, verbose_name="Reporte Pago", editable=False)
    estado_reporte_prov = models.CharField(max_length=50, verbose_name="Estado Reporte Prov", default='En Proceso', editable=False)
    completado = models.BooleanField(default=False, verbose_name="Completado", editable=False)

    class Meta:
        ordering = ['-pk']

    @property
    def id(self):
        return self.pk

    def clean(self):
        # RreporteCalidadExportador no ha sido asignado.
        if not self.rep_cal_exp_id:
            return
        
        # Si intentamos marcar el reporte como completado manualmente, verificamos que cumpla con todos los requisitos
        if self.completado:
            if self.factura_prov is None:
                raise ValidationError({
                    'factura_prov': 'Este campo es obligatorio si el reporte está completado.'
                })
            elif not self.reporte_enviado:
                raise ValidationError({
                    'reporte_enviado': 'Este campo es obligatorio si el reporte está completado.'
                })
            elif not self.reporte_pago:
                raise ValidationError(
                    'El reporte no puede ser completado si no se ha registrado el pago por el sistema.'
                )
        
        # Validación de campos relacionados
        if (self.p_kg_exportacion is None and self.p_kg_nacional is not None) or \
                (self.p_kg_exportacion is not None and self.p_kg_nacional is None):
            raise ValidationError("Ambos campos (Kg exportación y Kg nacional) deben estar completos o vacíos.")

        # Si p_kg_totales no está definido, usar peso_neto_recibido
        if self.p_kg_totales is None:
            self.p_kg_totales = self.rep_cal_exp.venta_nacional.peso_neto_recibido

        # Validaciones de pesos cuando tenemos la información necesaria
        if self.p_kg_exportacion and self.p_kg_nacional:
            # Validación kg_exportacion
            if self.p_kg_exportacion > self.p_kg_totales:
                raise ValidationError({
                    'p_kg_exportacion': f"El valor no puede ser mayor que el peso total. ({self.p_kg_totales})"
                })
            
            # Validación kg_nacional
            if self.p_kg_nacional > self.p_kg_totales:
                raise ValidationError({
                    'p_kg_nacional': f"El valor no puede ser mayor que el peso total. ({self.p_kg_totales})"
                })
            
            # Validación suma total
            computed_p_kg_merma = self.p_kg_totales - self.p_kg_exportacion - self.p_kg_nacional
            if computed_p_kg_merma < Decimal('0.00'):
                raise ValidationError(f"La suma de Kg exportación y Kg nacional no puede superar el peso total. ({self.p_kg_totales})")
                
        super().clean()

    def save(self, *args, **kwargs):
        # Si p_kg_totales no está definido, usar peso_neto_recibido
        if self.p_kg_totales is None:
            self.p_kg_totales = self.rep_cal_exp.venta_nacional.peso_neto_recibido

        # Si p_kg_exportacion no está definido, usar kg_exportacion del reporte exportador
        if self.p_kg_exportacion is None:
            self.p_kg_exportacion = self.rep_cal_exp.kg_exportacion

        # Si p_kg_nacional no está definido, usar kg_nacional del reporte exportador
        if self.p_kg_nacional is None:
            self.p_kg_nacional = self.rep_cal_exp.kg_nacional

        # Calcular kg_merma basado en p_kg_totales
        self.p_kg_merma = (self.p_kg_totales - self.p_kg_exportacion - self.p_kg_nacional).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Calcular porcentajes basados en p_kg_totales
        self.p_porcentaje_exportacion = (self.p_kg_exportacion / self.p_kg_totales * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.p_porcentaje_nacional = (self.p_kg_nacional / self.p_kg_totales * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.p_porcentaje_merma = (self.p_kg_merma / self.p_kg_totales * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Precios y totales
        self.p_precio_kg_exp = self.rep_cal_exp.venta_nacional.compra_nacional.precio_compra_exp
        self.p_precio_kg_nal = self.rep_cal_exp.venta_nacional.compra_nacional.precio_compra_nal
        self.p_total_facturar = (self.p_kg_exportacion * self.p_precio_kg_exp) + (self.p_kg_nacional * self.p_precio_kg_nal)
        self.p_utilidad_sin_ajuste = self.rep_cal_exp.precio_total - ((self.rep_cal_exp.kg_exportacion * self.rep_cal_exp.venta_nacional.compra_nacional.precio_compra_exp) + (self.rep_cal_exp.kg_nacional * self.rep_cal_exp.venta_nacional.compra_nacional.precio_compra_nal))
        # Cálculos de retenciones
        proveedor = self.rep_cal_exp.venta_nacional.compra_nacional.proveedor
        if proveedor.asohofrucol:
            self.asohofrucol = self.p_total_facturar * Decimal("1.00") / Decimal("100.00")
        else:
            self.asohofrucol = Decimal("0.00")

        if proveedor.rte_fte:
            self.rte_fte = self.p_total_facturar * Decimal("1.50") / Decimal("100.00")
        else:
            self.rte_fte = Decimal("0.00")

        if proveedor.rte_ica:
            self.rte_ica = self.p_total_facturar * Decimal("4.14") / Decimal("1000.00")
        else:
            self.rte_ica = Decimal("0.00")

        # Total a pagar y utilidad
        self.p_total_pagar = self.p_total_facturar - self.asohofrucol - self.rte_fte - self.rte_ica
        self.p_utilidad = self.rep_cal_exp.precio_total - self.p_total_facturar
        self.diferencia_utilidad = self.p_utilidad - self.p_utilidad_sin_ajuste
        self.p_porcentaje_utilidad = (self.p_utilidad / self.rep_cal_exp.precio_total) * Decimal("100.00")

        # Automatizar el campo completado basado en condiciones necesarias
        # Este valor se calcula siempre y no depende del estado previo
        self.completado = bool(self.factura_prov and self.reporte_enviado and self.reporte_pago)

        # Estado del reporte (ahora basado en completado)
        if self.completado:
            self.estado_reporte_prov = "Completado"
        elif self.reporte_pago:
            self.estado_reporte_prov = "Pagado"
        elif self.factura_prov:
            self.estado_reporte_prov = "Facturado"
        elif self.reporte_enviado:
            self.estado_reporte_prov = "Reporte Enviado"
        else:
            self.estado_reporte_prov = "En Proceso"

        # Inicializar monto_pendiente con el total a pagar si es un nuevo registro
        if not self.pk:
            self.monto_pendiente = self.p_total_pagar

        super().save(*args, **kwargs)


class TransferenciasProveedor(models.Model):
    proveedor = models.ForeignKey(ProveedorNacional, on_delete=models.PROTECT, verbose_name="Proveedor")
    referencia = models.CharField(max_length=20, verbose_name="Referencia", unique=True, blank=True, null=True)
    fecha_transferencia = models.DateField(verbose_name="Fecha Transferencia")
    valor_transferencia = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor Transferencia", validators=[MinValueValidator(0.0)])
    origen_transferencia = models.CharField(max_length=20, choices=origen_transferencia, verbose_name="Origen Transferencia")
    observaciones = models.TextField(verbose_name="Observaciones", blank=True, null=True)

    class Meta:
        ordering = ['-id']


class BalanceProveedor(models.Model):
    proveedor = models.OneToOneField(ProveedorNacional, on_delete=models.CASCADE, verbose_name="Proveedor")
    saldo_disponible = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Saldo Disponible")
    ultima_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")

    def __str__(self):
        return f"{self.proveedor.nombre} - Saldo: {self.saldo_disponible}"
    
    class Meta:
        verbose_name = "Balance de Proveedor"
        verbose_name_plural = "Balances de Proveedores"


# Variable global para evitar recursión
_processing_payment = False

def reevaluar_pagos_proveedor(proveedor):
    """Resetea y reevalúa todos los pagos de un proveedor"""
    global _processing_payment
    
    # Evitar recursión
    if _processing_payment:
        return
    
    _processing_payment = True
    try:
        from django.db import connection
        
        # Primero calculamos el saldo total de transferencias
        total_transferencias = TransferenciasProveedor.objects.filter(
            proveedor=proveedor
        ).aggregate(total=models.Sum('valor_transferencia'))['total'] or 0
        
        # Obtenemos todos los reportes antes de modificarlos
        reportes_query = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor
        ).select_related('rep_cal_exp__venta_nacional__compra_nacional')
        
        # Agrupamos reportes por fecha de compra
        reportes_por_fecha = {}
        for reporte in reportes_query:
            fecha_compra = reporte.rep_cal_exp.venta_nacional.compra_nacional.fecha_compra
            if fecha_compra not in reportes_por_fecha:
                reportes_por_fecha[fecha_compra] = []
            reportes_por_fecha[fecha_compra].append(reporte)
        
        # Para cada fecha, ordenamos los reportes por pk de CompraNacional
        for fecha in reportes_por_fecha:
            reportes_por_fecha[fecha].sort(key=lambda r: r.rep_cal_exp.venta_nacional.compra_nacional.pk)
        
        # Inicializar todos los reportes: reiniciar estado de pago y monto pendiente
        for reporte in reportes_query:
            reporte.reporte_pago = False
            reporte.monto_pendiente = reporte.p_total_pagar
            reporte.save(update_fields=['reporte_pago', 'monto_pendiente'])
        
        # Procesamos pagos con el saldo total disponible
        saldo_disponible = total_transferencias
        
        # Ordenamos las fechas cronológicamente
        fechas_ordenadas = sorted(reportes_por_fecha.keys())
        
        # Para cada fecha, procesamos los reportes ordenados por pk de CompraNacional
        for fecha in fechas_ordenadas:
            reportes = reportes_por_fecha[fecha]
            for reporte in reportes:
                # Si hay saldo disponible, procesamos el pago
                if saldo_disponible > 0:
                    # Calculamos cuánto podemos pagar de este reporte
                    monto_a_pagar = min(reporte.monto_pendiente, saldo_disponible)
                    
                    # Reducimos el monto pendiente y el saldo disponible
                    reporte.monto_pendiente -= monto_a_pagar
                    saldo_disponible -= monto_a_pagar
                    
                    # Si el monto pendiente llega a cero, marcamos el reporte como pagado
                    if reporte.monto_pendiente <= Decimal('0.00'):
                        reporte.reporte_pago = True
                        reporte.monto_pendiente = Decimal('0.00')  # Aseguramos que sea exactamente cero
                    else:
                        reporte.reporte_pago = False  # Aseguramos que se marque como no pagado si queda saldo pendiente
                    
                    # Actualizamos si el reporte está completado basado en las condiciones
                    reporte.completado = bool(reporte.factura_prov and reporte.reporte_enviado and reporte.reporte_pago)
                    
                    # Guardamos los cambios en el reporte
                    reporte.save(update_fields=['monto_pendiente', 'reporte_pago', 'completado'])
                else:
                    # Si no hay saldo disponible, aseguramos que el reporte esté marcado como no pagado
                    reporte.reporte_pago = False
                    
                    # Aseguramos que completado sea actualizado basado en el cambio de reporte_pago
                    reporte.completado = bool(reporte.factura_prov and reporte.reporte_enviado and reporte.reporte_pago)
                    
                    reporte.save(update_fields=['reporte_pago', 'completado'])
                
                # Actualizamos el estado del reporte basado en todos los campos relevantes
                # Usamos completado directamente para determinar el estado
                if reporte.completado:
                    nuevo_estado = "Completado"
                elif reporte.reporte_pago:
                    nuevo_estado = "Pagado"
                elif reporte.factura_prov:
                    nuevo_estado = "Facturado"
                elif reporte.reporte_enviado:
                    nuevo_estado = "Reporte Enviado"
                else:
                    nuevo_estado = "En Proceso"
                
                # Solo actualizamos si el estado ha cambiado
                if reporte.estado_reporte_prov != nuevo_estado:
                    reporte.estado_reporte_prov = nuevo_estado
                    reporte.save(update_fields=['estado_reporte_prov'])
        
        # Actualizamos el balance del proveedor con el saldo final (anticipo)
        balance, created = BalanceProveedor.objects.get_or_create(proveedor=proveedor)
        balance.saldo_disponible = saldo_disponible
        balance.save()
        
    finally:
        _processing_payment = False


@receiver(post_save, sender=TransferenciasProveedor)
def actualizar_balance_tras_transferencia(sender, instance, **kwargs):
    """Actualiza el balance del proveedor después de crear o modificar una transferencia"""
    reevaluar_pagos_proveedor(instance.proveedor)


@receiver(post_delete, sender=TransferenciasProveedor)
def actualizar_balance_tras_eliminar_transferencia(sender, instance, **kwargs):
    """Actualiza el balance del proveedor después de eliminar una transferencia"""
    reevaluar_pagos_proveedor(instance.proveedor)


@receiver(post_save, sender=ReporteCalidadProveedor)
def verificar_pago_tras_crear_o_editar_reporte(sender, instance, created, **kwargs):
    """Verifica si un reporte nuevo o editado puede pagarse con el saldo disponible"""
    global _processing_payment
    if (_processing_payment):
        return
        
    proveedor = instance.rep_cal_exp.venta_nacional.compra_nacional.proveedor
    reevaluar_pagos_proveedor(proveedor)


@receiver(post_delete, sender=ReporteCalidadProveedor)
def actualizar_balance_tras_eliminar_reporte(sender, instance, **kwargs):
    """Actualiza el balance cuando se elimina un reporte de calidad proveedor"""
    proveedor = instance.rep_cal_exp.venta_nacional.compra_nacional.proveedor
    reevaluar_pagos_proveedor(proveedor)






