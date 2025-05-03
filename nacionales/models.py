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
            
        # Validación de facturación
        if self.pagado and (self.factura is None or self.fecha_factura is None):
            raise ValidationError({
                'pagado': 'No se puede marcar como pagado si no se ha registrado una factura válida y su fecha correspondiente.'
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
    p_utilidad = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Utilidad", validators=[MinValueValidator(0.0)], editable=False, default=0)
    p_porcentaje_utilidad = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="% Utilidad", validators=[MinValueValidator(0.0), MaxValueValidator(100.00)], editable=False)
    reporte_enviado = models.BooleanField(default=False, verbose_name="Reporte Enviado")
    factura_prov = models.CharField(max_length=20, verbose_name="No Factura Proveedor", blank=True, null=True)
    reporte_pago = models.BooleanField(default=False, verbose_name="Reporte Pago", editable=False)
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
            
        # Validación de completado
        pago_exportador = self.rep_cal_exp.pagado
        
        if self.completado:
            if self.factura_prov is None:
                raise ValidationError({
                    'factura_prov': 'Este campo es obligatorio si el reporte está completado.'
                })
            elif not self.reporte_enviado:
                raise ValidationError({
                    'reporte_enviado': 'Este campo es obligatorio si el reporte está completado.'
                })
            elif not pago_exportador:
                raise ValidationError(
                    'El reporte no puede ser completado si el exportador(Reporte Calidad Exportador) no ha registrado el pago.'
                )
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
        self.p_porcentaje_utilidad = (self.p_utilidad / self.rep_cal_exp.precio_total) * Decimal("100.00")

        # Estado del reporte
        if self.reporte_enviado:
            self.estado_reporte_prov = "Reporte Enviado"
        if self.reporte_pago:
            self.estado_reporte_prov = "Pagado"
        if self.factura_prov:
            self.estado_reporte_prov = "Facturado Por Proveedor"
        if self.completado:
            self.estado_reporte_prov = "Completado"

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
        #print(f"Reevaluando pagos para {proveedor}...")
        
        # Primero calculamos el saldo total de transferencias
        total_transferencias = TransferenciasProveedor.objects.filter(
            proveedor=proveedor
        ).aggregate(total=models.Sum('valor_transferencia'))['total'] or 0
        
        #print(f"Total transferencias: {total_transferencias}")
        
        # Obtenemos todos los reportes antes de modificarlos
        reportes_query = ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor
        ).select_related('rep_cal_exp__venta_nacional')
        
        # Agrupamos reportes por fecha de llegada
        reportes_por_fecha = {}
        for reporte in reportes_query:
            fecha_llegada = reporte.rep_cal_exp.venta_nacional.fecha_llegada
            if fecha_llegada not in reportes_por_fecha:
                reportes_por_fecha[fecha_llegada] = []
            reportes_por_fecha[fecha_llegada].append(reporte)
        
        # Para cada fecha, ordenamos los reportes por monto (menor a mayor)
        for fecha in reportes_por_fecha:
            reportes_por_fecha[fecha].sort(key=lambda r: r.p_total_pagar)
        
        #print(f"Reportes encontrados: {reportes_query.count()}")
        
        # Marcamos todos los reportes como no pagados directamente en BD
        ReporteCalidadProveedor.objects.filter(
            rep_cal_exp__venta_nacional__compra_nacional__proveedor=proveedor
        ).update(reporte_pago=False)
        
        # Procesamos pagos con el saldo total disponible
        saldo_disponible = total_transferencias
        reportes_pagados_ids = []
        
        # Ordenamos las fechas cronológicamente
        fechas_ordenadas = sorted(reportes_por_fecha.keys())
        
        # Para cada fecha, procesamos los reportes ordenados por valor
        continuar_procesando = True
        for fecha in fechas_ordenadas:
            if not continuar_procesando:
                break
                
            reportes = reportes_por_fecha[fecha]
            for reporte in reportes:
                monto_pagar = reporte.p_total_pagar
                #print(f"Reporte #{reporte.pk}: monto={monto_pagar}, saldo={saldo_disponible}")
                
                if saldo_disponible >= monto_pagar:
                    saldo_disponible -= monto_pagar
                    reportes_pagados_ids.append(reporte.pk)
                    #print(f"  ✓ Marcado como pagado. Saldo restante: {saldo_disponible}")
                else:
                    # Si no hay saldo suficiente para este reporte, no procesamos más fechas
                    continuar_procesando = False
                    #print(f"  ✗ Saldo insuficiente para pagar. No se procesarán más reportes.")
                    break
        
        # Actualizamos los reportes pagados en una sola operación
        if reportes_pagados_ids:
            ReporteCalidadProveedor.objects.filter(pk__in=reportes_pagados_ids).update(reporte_pago=True)
        
        # Actualizamos el balance del proveedor con el saldo final
        balance, created = BalanceProveedor.objects.get_or_create(proveedor=proveedor)
        balance.saldo_disponible = saldo_disponible
        balance.save()
        #print(f"Balance final actualizado: {saldo_disponible}")
        
        # Inicializamos la variable reportes
        reportes = []

        # Actualizamos TODOS los reportes para reflejar el estado correcto 
        for reporte in reportes:
            # Recargamos el reporte para obtener el valor actualizado de reporte_pago
            reporte.refresh_from_db()
            
            # Determinamos el estado correcto basado en todos los campos relevantes
            if reporte.completado:
                nuevo_estado = "Completado"
            elif reporte.reporte_pago:
                nuevo_estado = "Pagado"
            elif reporte.factura_prov:
                nuevo_estado = "Facturado Por Proveedor"
            elif reporte.reporte_enviado:
                nuevo_estado = "Reporte Enviado"
            else:
                nuevo_estado = "En Proceso"
            
            # Solo actualizamos si el estado ha cambiado
            if reporte.estado_reporte_prov != nuevo_estado:
                #print(f"Actualizando estado de reporte #{reporte.pk} de '{reporte.estado_reporte_prov}' a '{nuevo_estado}'")
                reporte.estado_reporte_prov = nuevo_estado
                # Usamos update_fields para evitar bucles y actualizar solo lo necesario
                reporte.save(update_fields=['estado_reporte_prov'])
        
        # Debug info
        #print("Consultas SQL ejecutadas:")
        #for query in connection.queries[-5:]:
            #print(query['sql'])
    finally:
        _processing_payment = False


@receiver(post_save, sender=TransferenciasProveedor)
def actualizar_balance_tras_transferencia(sender, instance, **kwargs):
    """Actualiza el balance del proveedor después de crear o modificar una transferencia"""
    #print(f"Señal recibida: transferencia guardada para {instance.proveedor}")
    reevaluar_pagos_proveedor(instance.proveedor)


@receiver(post_delete, sender=TransferenciasProveedor)
def actualizar_balance_tras_eliminar_transferencia(sender, instance, **kwargs):
    """Actualiza el balance del proveedor después de eliminar una transferencia"""
    #print(f"Señal recibida: transferencia eliminada para {instance.proveedor}")
    reevaluar_pagos_proveedor(instance.proveedor)


@receiver(post_save, sender=ReporteCalidadProveedor)
def verificar_pago_tras_crear_o_editar_reporte(sender, instance, created, **kwargs):
    """Verifica si un reporte nuevo o editado puede pagarse con el saldo disponible"""
    # Evitar recursión - no hacemos nada si estamos en proceso de actualizar pagos
    global _processing_payment
    if (_processing_payment):
        return
        
    proveedor = instance.rep_cal_exp.venta_nacional.compra_nacional.proveedor
    #print(f"Señal recibida: reporte {'creado' if created else 'editado'} para {proveedor}")
    reevaluar_pagos_proveedor(proveedor)


@receiver(post_delete, sender=ReporteCalidadProveedor)
def actualizar_balance_tras_eliminar_reporte(sender, instance, **kwargs):
    """Actualiza el balance cuando se elimina un reporte de calidad proveedor"""
    # Si el reporte estaba pagado, necesitamos recuperar esos fondos
    # y reevaluar los pagos para los reportes restantes
    proveedor = instance.rep_cal_exp.venta_nacional.compra_nacional.proveedor
    #print(f"Señal recibida: reporte eliminado para {proveedor}")
    #if instance.reporte_pago:
        #print(f"El reporte eliminado estaba pagado ({instance.p_total_pagar}), reevaluando pagos...")
    
    # Siempre reevaluamos todos los pagos después de eliminar un reporte
    reevaluar_pagos_proveedor(proveedor)






