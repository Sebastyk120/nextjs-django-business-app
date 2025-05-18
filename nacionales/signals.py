from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CompraNacional, VentaNacional, ReporteCalidadExportador, ReporteCalidadProveedor

@receiver(post_save, sender=CompraNacional)
def actualizar_venta_nacional(sender, instance, **kwargs):
    """
    Actualiza la VentaNacional relacionada cuando se guarda una CompraNacional.
    """
    try:
        venta_nacional = instance.ventanacional  # Accede al modelo relacionado
        venta_nacional.save()  # Esto ejecutará el método save() de VentaNacional
    except VentaNacional.DoesNotExist:
        pass  # No existe una VentaNacional relacionada

@receiver(post_save, sender=VentaNacional)
def actualizar_reporte_calidad_exportador(sender, instance, **kwargs):
    """
    Actualiza el ReporteCalidadExportador relacionado cuando se guarda una VentaNacional.
    """
    try:
        reporte = instance.reportecalidadexportador  # Accede al modelo relacionado
        reporte.save()  # Esto ejecutará el método save() de ReporteCalidadExportador
    except ReporteCalidadExportador.DoesNotExist:
        pass  # No existe un ReporteCalidadExportador relacionado

@receiver(post_save, sender=ReporteCalidadExportador)
def actualizar_precio_compra_nal(sender, instance, **kwargs):
    """
    Actualiza el campo precio_compra_nal en CompraNacional cuando se guarda un ReporteCalidadExportador.
    Se utiliza update() para evitar disparar nuevamente los métodos save() y las señales.
    """
    compra_nacional = instance.venta_nacional.compra_nacional
    venta_nacional = instance.venta_nacional
    CompraNacional.objects.filter(pk=compra_nacional.pk).update(precio_compra_nal=instance.precio_venta_kg_nal)

@receiver(post_save, sender=ReporteCalidadExportador)
def actualizar_reporte_calidad_proveedor(sender, instance, **kwargs):
    """
    Actualiza el ReporteCalidadProveedor relacionado cuando se guarda un ReporteCalidadExportador.
    """
    try:
        reporte_prov = instance.reportecalidadproveedor  # Accede al modelo relacionado
        reporte_prov.save()  # Esto ejecutará el método save() de ReporteCalidadProveedor
    except ReporteCalidadProveedor.DoesNotExist:
        pass  # No existe un ReporteCalidadProveedor relacionado