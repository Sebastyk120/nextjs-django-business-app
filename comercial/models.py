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
    cantidad_pallet_con_contenedor = models.IntegerField(validators=[MinValueValidator(0)],
                                                         verbose_name="Cajas Pallet Contenedor", null=True, blank=True)
    cantidad_pallet_sin_contenedor = models.IntegerField(validators=[MinValueValidator(0)],
                                                         verbose_name="Cajas Pallet Sin Contenedor", null=True,
                                                         blank=True)
    porcentaje_peso_bruto = models.DecimalField(max_digits=5, decimal_places=2,
                                                validators=[MinValueValidator(0), MaxValueValidator(100)],
                                                verbose_name="Porcentaje de Peso Bruto", )

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} -N {self.referencia_nueva} - {self.exportador}"


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


class Fruta(models.Model):
    nombre = models.CharField(max_length=20, unique=True)
    presentaciones = models.ManyToManyField(Presentacion, through='ClientePresentacion', related_name='frutas')

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class ClientePresentacion(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    presentacion = models.ForeignKey(Presentacion, on_delete=models.CASCADE)
    fruta = models.ForeignKey(Fruta, on_delete=models.CASCADE)

    class Meta:
        ordering = ['cliente']
        unique_together = ('cliente', 'presentacion', 'fruta')

    def __str__(self):
        return f'{self.cliente.nombre} -P: {self.presentacion.nombre} - {self.presentacion.kilos} - {self.fruta}'


class PresentacionReferencia(models.Model):
    presentacion = models.ForeignKey(Presentacion, on_delete=models.CASCADE)
    referencia = models.ForeignKey(Referencias, on_delete=models.CASCADE)
    fruta = models.ForeignKey(Fruta, on_delete=models.CASCADE)
    tipo_caja = models.ForeignKey(TipoCaja, on_delete=models.CASCADE)

    class Meta:
        ordering = ['fruta']
        constraints = [
            UniqueConstraint(fields=['presentacion', 'referencia', 'fruta', 'tipo_caja'],
                             name='unique_presentacion_referencia')
        ]


    def __str__(self):
        return f"Refe: {self.referencia} Presen: {self.presentacion} -Marca: {self.tipo_caja} -Fruta {self.fruta}"


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
    valor_total_utilidad_usd = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$Utilidades USD",
                                                   null=True, blank=True, editable=False, default=0)
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
                    self.total_cajas_enviadas = 0
                    self.total_cajas_solicitadas = 0
                    self.total_piezas_solicitadas = 0
                    self.total_piezas_enviadas = 0
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

        # Llama al método save de la clase base para realizar el guardado
        super().save(*args, **kwargs)

    def actualizar_variedades(self):
        detalles = self.detallepedido_set.all()
        frutas = set(detalle.fruta.nombre for detalle in detalles)
        self.variedades = ", ".join(frutas)
        self.save()

    def actualizar_dias_de_vencimiento(self):
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
        self.save()

    def actualizar_tasa_representativa(self):
        if self.fecha_monetizacion is None:
            self.tasa_representativa_usd_diaria = 0
            self.save()
            return

        url = "https://www.datos.gov.co/resource/mcec-87by.json"
        response = requests.get(url)

        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame(data)
            df['vigenciadesde'] = pd.to_datetime(df['vigenciadesde'])
            df = df.sort_values('vigenciadesde')
            fecha_monetizacion = pd.to_datetime(self.fecha_monetizacion)
            df_filtrado = df[df['vigenciadesde'] <= fecha_monetizacion]
            if not df_filtrado.empty:
                tasa_valor = df_filtrado.iloc[-1]['valor']
                self.tasa_representativa_usd_diaria = tasa_valor
                self.save()
        else:
            print("Error al acceder al banco de la republica")

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f'Pedido: {self.id} - Cliente: {self.cliente.nombre}'


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
        return f'Pedido: {self.pedido.id} - Solicitante: {self.usuario_solicitante} Autorizador: {self.usuario_autorizador}'


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
    precio_proforma = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="$Proforma", null=True,
                                          blank=True, default=None)
    observaciones = models.CharField(verbose_name="Observaciones", max_length=100, blank=True, null=True)
    history = HistoricalRecords()

    def save(self, *args, **kwargs):
        # Configurar campos de otros modelos:
        if self.presentacion:
            self.presentacion_peso = self.presentacion.kilos

        # Cálculos de kilos y diferencia
        self.kilos = self.presentacion_peso * self.cajas_solicitadas
        self.kilos_enviados = self.presentacion_peso * self.cajas_enviadas
        self.diferencia = self.cajas_solicitadas - self.cajas_enviadas

        # Otros cálculos
        self.valor_x_producto = self.valor_x_caja_usd * self.cajas_enviadas
        # Cálculo de Utilidad
        if self.afecta_utilidad is True:  # Osea Seleccione SI
            self.valor_total_utilidad_x_producto = (self.cajas_enviadas - self.no_cajas_nc) * self.tarifa_utilidad
            self.valor_nota_credito_usd = (self.no_cajas_nc or 0) * self.valor_x_caja_usd
        elif self.afecta_utilidad is False:  # Osea Selecciona NO
            self.valor_total_utilidad_x_producto = self.cajas_enviadas * self.tarifa_utilidad
            self.valor_nota_credito_usd = (self.no_cajas_nc or 0) * self.valor_x_caja_usd
        else:  # afecta_utilidad is None Es Decir Descuento
            self.valor_total_utilidad_x_producto = (self.cajas_enviadas - self.no_cajas_nc) * self.tarifa_utilidad
            self.valor_nota_credito_usd = 0

        # Lógica de contenedor
        if self.lleva_contenedor and self.referencia and self.referencia.contenedor:
            self.referencia_contenedor = self.referencia.contenedor.nombre
            self.cantidad_contenedores = math.ceil(self.cajas_enviadas / self.referencia.cant_contenedor)
        else:
            self.referencia_contenedor = None
            self.cantidad_contenedores = None

        # Lógica de stickers
        self.stickers = self.tipo_caja.nombre if self.tipo_caja else None

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
        pedido.total_cajas_solicitadas = sum(detalle.cajas_solicitadas or 0 for detalle in detalles)
        pedido.valor_total_factura_usd = sum(detalle.valor_x_producto or 0 for detalle in detalles)
        pedido.valor_total_nota_credito_usd = sum(detalle.valor_nota_credito_usd or 0 for detalle in detalles)
        pedido.valor_total_utilidad_usd = sum(detalle.valor_total_utilidad_x_producto or 0 for detalle in detalles)
        pedido.total_piezas_solicitadas = math.ceil(sum(detalle.calcular_no_piezas() or 0 for detalle in detalles))
        pedido.total_piezas_enviadas = math.ceil(sum(detalle.calcular_no_piezas_final() or 0 for detalle in detalles))
        pedido.total_peso_bruto_solicitado = sum(detalle.calcular_peso_bruto() or 0 for detalle in detalles)
        pedido.total_peso_bruto_enviado = sum(detalle.calcular_peso_bruto_final() or 0 for detalle in detalles)
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


@receiver(post_save, sender=DetallePedido)
@receiver(post_delete, sender=DetallePedido)
def actualizar_variedades_pedido(sender, instance, **kwargs):
    pedido = instance.pedido
    pedido.actualizar_variedades()
