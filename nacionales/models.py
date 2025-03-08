from datetime import timedelta, date
from decimal import Decimal, ROUND_HALF_UP
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
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
        completados = 1  # CompraNacional siempre existe
        if hasattr(self, 'ventanacional'):
            completados += 1
            if hasattr(self.ventanacional, 'reportecalidadexportador'):
                completados += 1
                if hasattr(self.ventanacional.reportecalidadexportador, 'reportecalidadproveedor'):
                    completados += 1
        if completados < 4:
            return (completados / 4) * 90
        # Si existen los 4 modelos, se asignan 90% base y se agregan 10% si 'completado' es True.
        reporte_prov = self.ventanacional.reportecalidadexportador.reportecalidadproveedor
        return 100 if reporte_prov.completado else 90

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
        tiene_venta = hasattr(self, 'ventanacional')
        tiene_reporte_exp = False
        tiene_reporte_prov = False

        if tiene_venta:
            venta = self.ventanacional
            tiene_reporte_exp = hasattr(venta, 'reportecalidadexportador')
            if tiene_reporte_exp:
                reporte_exp = venta.reportecalidadexportador
                tiene_reporte_prov = hasattr(reporte_exp, 'reportecalidadproveedor')

        return tiene_venta and tiene_reporte_exp and tiene_reporte_prov


class VentaNacional(models.Model):
    compra_nacional = models.OneToOneField(CompraNacional, on_delete=models.CASCADE, verbose_name="Compra Nacional", primary_key=True)
    exportador = models.ForeignKey(Exportador, on_delete=models.PROTECT, verbose_name="Exportador")
    fecha_llegada = models.DateField(verbose_name="Fecha de Llegada")
    fecha_vencimiento = models.DateField(verbose_name="Vencimiento Reporte", editable=False)
    cantidad_empaque_recibida = models.PositiveIntegerField(verbose_name="Cantidad Empaque Recibida", validators=[MinValueValidator(0)], blank=True, null=True)
    peso_bruto_recibido = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Peso Bruto Recibido", validators=[MinValueValidator(0.0)])
    peso_neto_recibido = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Peso Neto Recibido", validators=[MinValueValidator(0.0)], editable=False)
    diferencia_peso = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Diferencia Peso", validators=[MinValueValidator(0.0)], blank=True, null=True, editable=False)
    diferencia_empaque = models.IntegerField(verbose_name="Diferencia Empaque", blank=True, null=True, editable=False)
    estado_venta = models.CharField(max_length=20, verbose_name="Estado Venta", default='En Proceso', editable=False)
    observaciones = models.TextField(verbose_name="Observaciones", blank=True, null=True)


    class Meta:
        ordering = ['-pk']

    def __str__(self):
        return str(self.id) + ' - ' + str(self.compra_nacional.proveedor) + ' Guia: ' + str(self.compra_nacional.numero_guia) + ' Neto Recibido: ' + str(self.peso_neto_recibido)
    
    @property
    def id(self):
        return self.pk

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
        business_days_added = 0
        while business_days_added < 3:
            current_date += timedelta(days=1)
            if current_date.weekday() < 5:  # 0-4 son los días de semana
                business_days_added += 1

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
    pagado = models.BooleanField(default=False, verbose_name="Pagado", blank=True, null=True)
    estado_reporte_exp = models.CharField(max_length=20, verbose_name="Estado Reporte Exp", default='En Proceso', editable=False)

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
        if self.venta_nacional.peso_neto_recibido and self.kg_exportacion and self.kg_nacional:
            total = self.venta_nacional.peso_neto_recibido
            if self.kg_exportacion > total:
                raise ValidationError({
                    'kg_exportacion': "El valor no puede ser mayor que el peso neto recibido."
                })
            if self.kg_nacional > total:
                raise ValidationError({
                    'kg_nacional': "El valor no puede ser mayor que el peso neto recibido."
                })
            # Se asume que kg_merma se calcula como:
            computed_kg_merma = total - self.kg_exportacion - self.kg_nacional
            if computed_kg_merma < Decimal('0.00'):
                raise ValidationError("La suma de Kg exportacion y Kg nacional no puede superar el peso neto recibido.")
        if self.pagado and (self.fecha_factura is None or self.factura is None):
            raise ValidationError({
                'fecha_factura': "Debe ingresar la fecha de la factura.",
                'factura': "Debe ingresar el número de la factura."
            })
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
        if self.pagado:
            self.estado_reporte_exp = "Pagado"
        
        super().save(*args, **kwargs)
        
class ReporteCalidadProveedor(models.Model):
    rep_cal_exp = models.OneToOneField(ReporteCalidadExportador, on_delete=models.CASCADE, primary_key=True, verbose_name="Reporte Calidad Exportador")
    p_fecha_reporte = models.DateField(verbose_name="Fecha Reporte Prov", auto_now_add=True)
    p_kg_totales = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Kg Totales", validators=[MinValueValidator(0.0)], editable=False)
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
    p_utilidad = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Utilidad", validators=[MinValueValidator(0.0)], editable=False, default=0)
    p_porcentaje_utilidad = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="% Utilidad", validators=[MinValueValidator(0.0), MaxValueValidator(100.00)], editable=False)
    reporte_enviado = models.BooleanField(default=False, verbose_name="Reporte Enviado")
    factura_prov = models.CharField(max_length=20, verbose_name="No Factura Proveedor", blank=True, null=True)
    reporte_pago = models.BooleanField(default=False, verbose_name="Reporte Pago")
    estado_reporte_prov = models.CharField(max_length=50, verbose_name="Estado Reporte Prov", default='En Proceso', editable=False)
    completado = models.BooleanField(default=False, verbose_name="Completado")

    class Meta:
        ordering = ['-pk']

    @property
    def id(self):
        return self.pk

    def clean(self):
        # RreporteCalidadExportador no ha sido asignado.
        if not self.rep_cal_exp_id:
            return
        if self.completado and not (self.reporte_pago or self.factura_prov or self.reporte_enviado):
            raise ValidationError({
                'completado': "No se puede marcar como completado si no se ha pagado."
            })

        if (self.p_kg_exportacion is None and self.p_kg_nacional is not None) or \
                (self.p_kg_exportacion is not None and self.p_kg_nacional is None):
            raise ValidationError("Ambos campos (Kg exportación y Kg nacional) deben estar completos o vacíos.")

        if self.rep_cal_exp.venta_nacional.peso_neto_recibido and self.p_kg_exportacion and self.p_kg_nacional:
            total = self.rep_cal_exp.venta_nacional.peso_neto_recibido
            if self.p_kg_exportacion > total:
                raise ValidationError({
                    'p_kg_exportacion': "El valor no puede ser mayor que el peso neto recibido."
                })
            if self.p_kg_nacional > total:
                raise ValidationError({
                    'p_kg_nacional': "El valor no puede ser mayor que el peso neto recibido."
                })
            # kg_merma se calcula como:
            computed_p_kg_merma = total - self.p_kg_exportacion - self.p_kg_nacional
            if computed_p_kg_merma < Decimal('0.00'):
                raise ValidationError("La suma de Kg exportacion y Kg nacional no puede superar el peso neto recibido.")
        super().clean()

    def save(self, *args, **kwargs):
        if self.p_kg_exportacion is None:
            self.p_kg_exportacion = self.rep_cal_exp.kg_exportacion
        if self.p_kg_nacional is None:
            self.p_kg_nacional = self.rep_cal_exp.kg_nacional
        if self.p_kg_merma is None:
            self.p_kg_merma = self.rep_cal_exp.kg_merma
        self.p_kg_totales = self.rep_cal_exp.venta_nacional.peso_neto_recibido
        self.p_precio_kg_exp = self.rep_cal_exp.venta_nacional.compra_nacional.precio_compra_exp
        self.p_porcentaje_exportacion = (self.p_kg_exportacion / self.p_kg_totales * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.p_precio_kg_nal = self.rep_cal_exp.venta_nacional.compra_nacional.precio_compra_nal
        self.p_porcentaje_nacional = (self.p_kg_nacional / self.p_kg_totales * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.p_kg_merma = (self.p_kg_totales - self.p_kg_exportacion - self.p_kg_nacional).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.p_porcentaje_merma = (self.p_kg_merma / self.p_kg_totales * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.p_total_facturar = (self.p_kg_exportacion * self.p_precio_kg_exp) + (self.p_kg_nacional * self.p_precio_kg_nal)
        if self.reporte_enviado:
            self.estado_reporte_prov = "Reporte Enviado"
        if self.reporte_pago:
            self.estado_reporte_prov = "Pagado"
        if self.factura_prov:
            self.estado_reporte_prov = "Facturado Por Proveedor"
        if self.completado:
            self.estado_reporte_prov = "Completado"

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
            
        self.p_total_pagar = self.p_total_facturar - self.asohofrucol - self.rte_fte - self.rte_ica
        self.p_utilidad = self.rep_cal_exp.precio_total - self.p_total_facturar
        self.p_porcentaje_utilidad = (self.p_utilidad / self.rep_cal_exp.precio_total) * Decimal("100.00")
        
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

class FacturacionExportadores(models.Model):
    no_factura = models.CharField(max_length=20, verbose_name="No Factura", unique=True)
    fecha_factura = models.DateField(verbose_name="Fecha Factura")
    fruta = models.ForeignKey(Fruta, on_delete=models.PROTECT, verbose_name="Fruta")
    exportador = models.ForeignKey(Exportador, on_delete=models.PROTECT, verbose_name="Exportador")
    peso_kg = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Peso Kg", validators=[MinValueValidator(0.0)])
    precio_kg = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$ Kg", validators=[MinValueValidator(0.0)])
    precio_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total Factura", validators=[MinValueValidator(0.0)], editable=False)

    def save(self, *args, **kwargs):
        self.precio_total = self.peso_kg * self.precio_kg
        super().save(*args, **kwargs)




