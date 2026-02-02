from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CompraNacional, VentaNacional, ReporteCalidadExportador, ReporteCalidadProveedor

@receiver(post_save, sender=CompraNacional)
def actualizar_venta_nacional(sender, instance, **kwargs):
    """
    Actualiza las Ventas Nacionales relacionadas cuando se guarda una CompraNacional.
    """
    ventas = instance.ventas.all()
    for venta in ventas:
        venta.save()

@receiver(post_save, sender=VentaNacional)
def actualizar_reporte_calidad_exportador(sender, instance, **kwargs):
    """
    Actualiza el ReporteCalidadExportador relacionado cuando se guarda una VentaNacional.
    Si el peso_neto_recibido disminuye por debajo de los kg registrados, ajusta proporcionalmente.
    """
    from decimal import Decimal, ROUND_HALF_UP
    try:
        reporte = instance.reportecalidadexportador  # Accede al modelo relacionado
        nuevo_peso_neto = instance.peso_neto_recibido
        
        # Si el peso neto ha disminuido y los kg registrados exceden el nuevo peso,
        # ajustar proporcionalmente para evitar errores de validación
        if nuevo_peso_neto and reporte.kg_exportacion and reporte.kg_nacional:
            total_kg_actual = reporte.kg_exportacion + reporte.kg_nacional
            
            if total_kg_actual > nuevo_peso_neto:
                # Calcular factor de escala
                factor = nuevo_peso_neto / total_kg_actual
                
                # Ajustar proporcionalmente
                reporte.kg_exportacion = (reporte.kg_exportacion * factor).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
                reporte.kg_nacional = (reporte.kg_nacional * factor).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
        
        reporte.save()  # Esto ejecutará el full_clean y recalculará porcentajes
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
        reporte_prov.save()  # Esto ejecutará el m
    except ReporteCalidadProveedor.DoesNotExist:
        pass  # No existe un ReporteCalidadProveedor relacionado

@receiver(post_save, sender=ReporteCalidadProveedor)
def sincronizar_campo_completado(sender, instance, **kwargs):
    """
    Asegura que el campo completado se sincronice correctamente con los campos
    factura_prov, reporte_enviado y reporte_pago.
    
    Este signal es necesario en caso de que se realicen actualizaciones parciales 
    que no llamen al m
    """
    from django.db import transaction
    
    # Evitamos recursión comprobando si estamos en una transacción de actualización
    if transaction.get_autocommit():
        # Calculamos el valor que debería tener el campo completado
        debe_estar_completado = bool(instance.factura_prov and instance.reporte_enviado and instance.reporte_pago)
        
        # Si el valor actual no coincide con el que debería tener
        if instance.completado != debe_estar_completado:
            # Actualizamos usando update para evitar lla
            # y así evitar un bucle infinito de señales
            ReporteCalidadProveedor.objects.filter(pk=instance.pk).update(completado=debe_estar_completado)
            
            # También actualizamos el estado_reporte_prov si es necesario
            nuevo_estado = "Completado" if debe_estar_completado else (
                "Pagado" if instance.reporte_pago else (
                    "Facturado" if instance.factura_prov else (
                        "Reporte Enviado" if instance.reporte_enviado else "En Proceso"
                    )
                )
            )
            
            if instance.estado_reporte_prov != nuevo_estado:
                ReporteCalidadProveedor.objects.filter(pk=instance.pk).update(estado_reporte_prov=nuevo_estado)