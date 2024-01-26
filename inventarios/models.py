import logging
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.db.models import Sum
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from comercial.models import Referencias, Exportador
from .choices import tipo_documento


class Bodega(models.Model):
    nombre = models.CharField(max_length=100)
    exportador = models.ForeignKey(Exportador, on_delete=models.CASCADE, verbose_name="Exportador")

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} - {self.exportador} "


class Proveedor(models.Model):
    nombre = models.CharField(max_length=100, verbose_name="Proveedor", unique=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre}"


class Item(models.Model):
    numero_item = models.ForeignKey(Referencias, verbose_name="Referencia", on_delete=models.CASCADE)
    cantidad_cajas = models.IntegerField(validators=[MinValueValidator(1)], verbose_name="Cantidad Cajas")
    tipo_documento = models.CharField(max_length=20, verbose_name="Tipo Documento", choices=tipo_documento)
    documento = models.CharField(max_length=100, verbose_name="Documento")
    bodega = models.ForeignKey(Bodega, verbose_name="Tipo De Movimiento", on_delete=models.CASCADE)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, verbose_name="Proveedor O Tercero")
    fecha_movimiento = models.DateField(verbose_name="Fecha Movimiento")
    propiedad = models.ForeignKey(Exportador, on_delete=models.CASCADE, verbose_name="Propiedad")
    observaciones = models.CharField(max_length=255, verbose_name="Observaciones", blank=True, null=True)
    user = models.ForeignKey(User, null=False, on_delete=models.CASCADE, verbose_name="Usuario")

    def __str__(self):
        return (f"Referencia: {self.numero_item} -Bodega: {self.bodega} -Cantidad {self.cantidad_cajas} "
                f"- {self.fecha_movimiento}")


class Movimiento(models.Model):
    item_historico = models.CharField(max_length=100)
    cantidad_cajas_h = models.IntegerField(verbose_name="Cantidad Cajas")
    bodega = models.ForeignKey(Bodega, verbose_name="Bodega", on_delete=models.CASCADE)
    propiedad = models.CharField(max_length=50, verbose_name="Propiedad")
    fecha_movimiento = models.DateField(verbose_name="Fecha Movimiento")
    observaciones = models.CharField(max_length=255, verbose_name="Observaciones", blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True, verbose_name="Fecha Historico")
    user = models.ForeignKey(User, null=False, on_delete=models.CASCADE, verbose_name="Usuario")

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.item_historico} - {self.cantidad_cajas_h} - {self.bodega} - {self.fecha}"


class Inventario(models.Model):
    numero_item = models.ForeignKey(Referencias, verbose_name="Referencia", on_delete=models.CASCADE)
    compras_efectivas = models.IntegerField(default=0, verbose_name="Compras Efectivas", blank=True, null=True)
    saldos_iniciales = models.IntegerField(default=0, verbose_name="Saldos Iniciales", blank=True, null=True)
    salidas = models.IntegerField(default=0, verbose_name="Salidas", blank=True, null=True)
    traslado_propio = models.IntegerField(default=0, verbose_name="Traslado Propio", blank=True, null=True)
    traslado_remisionado = models.IntegerField(default=0, verbose_name="Traslado Remisionado", blank=True, null=True)
    ventas = models.IntegerField(default=0, verbose_name="Ventas", blank=True, null=True)
    venta_contenedor = models.IntegerField(default=0, verbose_name="Venta Contenedor", blank=True, null=True)

    class Meta:
        ordering = ['numero_item']

    def __str__(self):
        return f"{self.numero_item.nombre} - {self.numero_item.exportador.nombre}"


# Señal para actualizar automáticamente el modelo Inventario después de guardar o borrar un objeto Item
@receiver(post_save, sender=Item)
def actualizar_inventario_al_guardar(sender, instance, **kwargs):
    try:
        with transaction.atomic():
            nuevo_inventario, created = Inventario.objects.get_or_create(
                numero_item=instance.numero_item,
                defaults={'compras_efectivas': 0, 'saldos_iniciales': 0, 'salidas': 0,
                          'traslado_propio': 0, 'traslado_remisionado': 0, 'ventas': 0}
            )

            campos_bodega = {
                'Ingreso: Compras Efectivas': 'compras_efectivas',
                'Ingreso: Saldos Iniciales': 'saldos_iniciales',
                'Salida: Baja': 'salidas',
                'Salida: Traslado Propio': 'traslado_propio',
                'Salida: Traslado Remisionado': 'traslado_remisionado',
                'Salida: Ventas': 'ventas',
            }

            campo_a_actualizar = campos_bodega.get(instance.bodega.nombre)

            if campo_a_actualizar:
                cantidad_agregada = Item.objects.filter(
                    numero_item=instance.numero_item, bodega=instance.bodega
                ).aggregate(Sum('cantidad_cajas'))['cantidad_cajas__sum'] or 0

                setattr(nuevo_inventario, campo_a_actualizar, cantidad_agregada)
                nuevo_inventario.save()
            else:
                # Manejo de error y envío de alerta
                logging.error(f"Condición no manejada para la bodega: {instance.bodega.nombre}")
                # messages.error(request, f"Condición no manejada para la bodega: {instance.bodega.nombre}")
    except Exception as e:
        logging.error(f"Error al actualizar el inventario: {e}")
        # informar al usuario


@receiver(post_delete, sender=Item)
def actualizar_inventario_al_eliminar(sender, instance, **kwargs):
    try:
        with transaction.atomic():
            nuevo_inventario = Inventario.objects.get(numero_item=instance.numero_item)

            campos_bodega = {
                'Ingreso: Compras Efectivas': 'compras_efectivas',
                'Ingreso: Saldos Iniciales': 'saldos_iniciales',
                'Salida: Baja': 'salidas',
                'Salida: Traslado Propio': 'traslado_propio',
                'Salida: Traslado Remisionado': 'traslado_remisionado',
                'Salida: Ventas': 'ventas',
            }

            campo_a_actualizar = campos_bodega.get(instance.bodega.nombre)

            if campo_a_actualizar:
                cantidad_agregada = Item.objects.filter(
                    numero_item=instance.numero_item, bodega=instance.bodega
                ).aggregate(Sum('cantidad_cajas'))['cantidad_cajas__sum'] or 0

                setattr(nuevo_inventario, campo_a_actualizar, cantidad_agregada)
                nuevo_inventario.save()
            else:
                # Manejo de error y envío de alerta
                logging.error(f"Condición no manejada para la bodega: {instance.bodega.nombre}")
    except Exception as e:
        logging.error(f"Error al actualizar el inventario después de eliminar: {e}")
