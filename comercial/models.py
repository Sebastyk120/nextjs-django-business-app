import math
from datetime import datetime, timedelta, date
from decimal import Decimal
from importlib import import_module
from django.core.exceptions import ObjectDoesNotExist
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Sum
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from simple_history.models import HistoricalRecords
from .choices import motivo_nota


class Fruta(models.Model):
    nombre = models.CharField(max_length=20, unique=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Pais(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


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


class Cliente(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Nombre Cliente", unique=True)
    direccion = models.CharField(max_length=255, verbose_name="Dirección")
    ciudad = models.CharField(max_length=100, verbose_name="Ciudad", null=True, blank=True)
    pais = models.ForeignKey(Pais, on_delete=models.CASCADE, verbose_name="Pais")
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
    nombre = models.CharField(max_length=255, verbose_name="Presentación", unique=True)
    kilos = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                verbose_name="Kilos")

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class ClientePresentacion(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    presentacion = models.ForeignKey(Presentacion, on_delete=models.CASCADE)

    class Meta:
        ordering = ['cliente']

    def __str__(self):
        return f'{self.cliente.nombre} -P: {self.presentacion.nombre}'


class Pedido(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, verbose_name="Cliente")
    fecha_solicitud = models.DateField(verbose_name="Fecha Solicitud")
    fecha_entrega = models.DateField(verbose_name="Fecha Entrega")
    exportadora = models.ForeignKey(Exportador, on_delete=models.CASCADE, verbose_name="Exportador")
    dias_cartera = models.IntegerField(verbose_name="Dias Cartera", editable=False, null=True, blank=True)
    awb = models.CharField(max_length=50, verbose_name="AWB", null=True, blank=True)
    destino = models.CharField(max_length=50, verbose_name="Destino", null=True, blank=True, editable=False)
    numero_factura = models.CharField(max_length=50, verbose_name="Factura", null=True, blank=True)
    total_cajas_enviadas = models.IntegerField(verbose_name="Cajas Enviadas", null=True, blank=True,
                                               editable=False)
    nota_credito_no = models.CharField(max_length=50, verbose_name="Nota Crédito", null=True, blank=True)
    motivo_nota_credito = models.CharField(max_length=20, choices=motivo_nota, verbose_name="Motivo Nota Crédito",
                                           null=True, blank=True)
    valor_total_nota_credito_usd = models.DecimalField(max_digits=10, decimal_places=2, editable=False,
                                                       verbose_name="$Total Nota Crédito", null=True, blank=True,
                                                       default=0)
    tasa_representativa_usd_diaria = models.DecimalField(max_digits=10, decimal_places=2, editable=False,
                                                         verbose_name="$TRM Oficial", null=True, blank=True,
                                                         default=0)
    valor_pagado_cliente_usd = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                                   verbose_name="$Pagado Cliente",
                                                   null=True, blank=True, default=0)
    comision_bancaria_usd = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                                verbose_name="$Comisión Bancaria USD",
                                                null=True, blank=True, default=0)
    fecha_pago = models.DateField(verbose_name="Fecha Pago", null=True, blank=True)
    trm_monetizacion = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                           verbose_name="$TRM Monetización", null=True,
                                           blank=True)
    estado_factura = models.CharField(max_length=50, verbose_name="Estado Factura", null=True, blank=True,
                                      editable=False)
    diferencia_por_abono = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Diferencia o Abono",
                                               editable=False, null=True, blank=True)
    dias_de_vencimiento = models.IntegerField(verbose_name="Dias Vencimiento", editable=False, null=True, blank=True)
    valor_total_factura_usd = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$Total Factura",
                                                  null=True, blank=True, editable=False, default=0)
    valor_total_comision_usd = models.DecimalField(max_digits=10, decimal_places=2,
                                                   verbose_name="$Comisiones USD", null=True, blank=True,
                                                   editable=False)
    valor_comision_pesos = models.DecimalField(max_digits=10, decimal_places=2,
                                               verbose_name="$Comisiones Pesos", null=True, blank=True,
                                               editable=False)
    documento_cobro_comision = models.CharField(max_length=50, verbose_name="Doc Cobro Comisión", null=True,
                                                blank=True)
    fecha_pago_comision = models.DateField(verbose_name="Fecha Pago Comisión", null=True, blank=True)
    estado_comision = models.CharField(max_length=50, verbose_name="Estado Comisión", editable=False)
    history = HistoricalRecords()

    def save(self, *args, **kwargs):
        # Campos Calculados
        self.diferencia_por_abono = ((self.valor_total_nota_credito_usd + self.valor_pagado_cliente_usd
                                      + self.comision_bancaria_usd) - self.valor_total_factura_usd)
        if self.valor_total_factura_usd != 0 and self.trm_monetizacion is not None:
            self.valor_comision_pesos = self.valor_total_comision_usd * self.trm_monetizacion
        if self.valor_pagado_cliente_usd == 0:
            self.estado_factura = "Pendiente Pago"
        elif self.valor_pagado_cliente_usd < (
                self.valor_total_factura_usd - self.valor_total_nota_credito_usd - self.comision_bancaria_usd):
            self.estado_factura = "Abono"
        else:
            self.estado_factura = "Pagada"
        # Actualizar los campos que vienen del cliente
        if self.cliente:
            self.destino = self.cliente.pais.nombre
            self.dias_cartera = self.cliente.negociaciones_cartera
        # Calcular dias_de_vencimiento:
        if self.fecha_pago is not None:
            self.dias_de_vencimiento = 0
        else:
            # Comprobar si self.fecha_entrega es un objeto datetime.datetime
            if isinstance(self.fecha_entrega, datetime):
                fecha_entrega = self.fecha_entrega.date()
            elif isinstance(self.fecha_entrega, date):
                # No se necesita conversión si ya es un objeto datetime.date
                fecha_entrega = self.fecha_entrega
            else:
                # Manejar otros casos o lanzar un error según sea necesario
                raise ValueError("Tipo de fecha no soportado")

            fecha_entrega += timedelta(days=self.dias_cartera)
            hoy = datetime.now().date()

            self.dias_de_vencimiento = (hoy - fecha_entrega).days

        # Estado comision:
        if self.fecha_pago is None:
            self.estado_comision = "Pendiente Pago Cliente"
        elif self.fecha_pago is not None and self.documento_cobro_comision is None:
            self.estado_comision = "Por Facturar"
        elif self.fecha_pago is not None and self.documento_cobro_comision is not None and self.fecha_pago_comision is None:
            self.estado_comision = "Facturada"
        elif self.fecha_pago_comision is not None and self.documento_cobro_comision is not None and self.fecha_pago is not None:
            self.estado_comision = "Pagada"
        # Llama al método save de la clase base para realizar el guardado
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f'Pedido: {self.id} - Cliente: {self.cliente.nombre}'


class Contenedor(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Nombre del Contenedor", unique=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Referencias(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Referencia")
    referencia_nueva = models.CharField(max_length=255, verbose_name="Referencia Nueva", blank=True, null=True)
    contenedor = models.ForeignKey(Contenedor, on_delete=models.CASCADE, verbose_name="Contenedor", null=True,
                                   blank=True)
    cant_contenedor = models.IntegerField(validators=[MinValueValidator(0)],
                                          verbose_name="Cantidad Cajas En Contenedor", null=True, blank=True)
    precio = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                 verbose_name="Precio", null=True, blank=True)
    exportador = models.ForeignKey(Exportador, on_delete=models.CASCADE, verbose_name="Exportador")

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} -N {self.referencia_nueva} - {self.exportador}"


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
    tarifa_comision = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                          verbose_name="$Comisión Por Caja", null=True,
                                          blank=True, default=0)
    valor_x_caja_usd = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                           verbose_name="$Por Caja USD", null=True,
                                           blank=True, default=0)
    valor_x_producto = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$Por Producto", null=True,
                                           blank=True, editable=False)
    no_cajas_nc = models.IntegerField(verbose_name="No Cajas NC", null=True, blank=True)
    valor_nota_credito_usd = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$Nota Crédito USD",
                                                 null=True, blank=True, editable=False)
    afecta_comision = models.BooleanField(choices=[(True, "Sí"), (False, "No")], verbose_name="Afecta Comisión",
                                          null=True, blank=True)
    valor_total_comision_x_producto = models.DecimalField(max_digits=10, decimal_places=2,
                                                          verbose_name="$Comisión X Producto", null=True,
                                                          blank=True, editable=False)
    precio_proforma = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$Proforma", null=True,
                                          blank=True)
    observaciones = models.CharField(verbose_name="Observaciones", max_length=100, blank=True, null=True)
    history = HistoricalRecords()

    def save(self, *args, **kwargs):
        # Configurar campos de otros modelos:
        if self.presentacion:
            self.presentacion_peso = self.presentacion.kilos
        self.kilos = self.presentacion_peso * self.cajas_solicitadas
        self.kilos_enviados = self.cajas_enviadas * self.presentacion_peso
        self.diferencia = self.cajas_solicitadas - self.cajas_enviadas
        self.valor_x_producto = self.valor_x_caja_usd * self.cajas_enviadas
        if self.no_cajas_nc is not None:
            self.valor_nota_credito_usd = self.no_cajas_nc * self.valor_x_caja_usd
        if self.afecta_comision is True:
            self.valor_total_comision_x_producto = (self.cajas_enviadas - self.no_cajas_nc) * self.tarifa_comision
        else:
            self.valor_total_comision_x_producto = self.cajas_enviadas * self.tarifa_comision
        if self.lleva_contenedor:
            self.referencia_contenedor = self.referencia.contenedor.nombre
            self.cantidad_contenedores = math.ceil(self.cajas_enviadas / self.referencia.cant_contenedor)
        else:
            self.referencia_contenedor = None
            self.cantidad_contenedores = None
        if self.tipo_caja:
            self.stickers = self.tipo_caja.nombre
        super().save(*args, **kwargs)
        # Realizar las totalizaciones al guardar el detalle del pedido
        self.actualizar_totales_pedido()

    def delete(self, *args, **kwargs):
        # Realizar las totalizaciones al eliminar el detalle del pedido
        super().delete(*args, **kwargs)
        self.actualizar_totales_pedido()

    def actualizar_totales_pedido(self):
        pedido = self.pedido
        detalles = DetallePedido.objects.filter(pedido=pedido)
        pedido.total_cajas_enviadas = sum(detalle.cajas_enviadas or 0 for detalle in detalles)
        pedido.valor_total_factura_usd = sum(detalle.valor_x_producto or 0 for detalle in detalles)
        pedido.valor_total_nota_credito_usd = sum(detalle.valor_nota_credito_usd or 0 for detalle in detalles)
        pedido.valor_total_comision_usd = sum(detalle.valor_total_comision_x_producto or 0 for detalle in detalles)
        pedido.save()

    def calcular_peso_bruto(self):
        # Asegurarse de que todos los valores son de tipo Decimal
        cajas_solicitadas = Decimal(self.cajas_solicitadas)
        kilos = Decimal(self.kilos)
        if self.presentacion_peso < Decimal('4'):
            return (cajas_solicitadas * Decimal('0.3')) + kilos
        elif self.presentacion_peso < Decimal('8'):
            return (cajas_solicitadas * Decimal('0.5')) + kilos
        else:
            return (cajas_solicitadas * Decimal('0.9')) + kilos

    def calcular_no_piezas(self):
        # Asegurarse de que todos los valores son de tipo Decimal
        cajas_solicitadas = Decimal(self.cajas_solicitadas)
        if self.presentacion_peso < 7.5:
            return cajas_solicitadas / 160
        else:
            return cajas_solicitadas / 50

    class Meta:
        ordering = ['pedido']

    def __str__(self):
        return f"Detalle Pedido - {self.pedido} - {self.fruta} - {self.presentacion}"


@receiver(pre_save, sender=DetallePedido)
def almacenar_referencia_antes_de_guardar(sender, instance, **kwargs):
    try:
        referencia_previa = sender.objects.get(pk=instance.pk)
        instance._referencia_previa = referencia_previa.referencia
    except ObjectDoesNotExist:
        instance._referencia_previa = None


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

# ////////// Señal para actualizar Tasa Representativa de bolsa de Valores //////////////////////////////
