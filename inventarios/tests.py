# Unir un Item De Compra
""""numero_item = form.cleaned_data['numero_item']
        bodega = form.cleaned_data['bodega']
        cantidad_cajas = form.cleaned_data['cantidad_cajas']
        observaciones = form.cleaned_data['observaciones']
        proveedor = form.cleaned_data['proveedor']
        # Buscar el item igual en la misma bodega con el mismo numero_item
        try:
            existing_item = Item.objects.get(numero_item=numero_item, bodega=bodega, proveedor=proveedor)
            existing_item.cantidad_cajas += cantidad_cajas  # Sumar las cajas
            existing_item.save()
            Movimiento.objects.create(
                item_historico=existing_item.numero_item,
                cantidad_cajas_h=existing_item.cantidad_cajas,
                bodega_origen=existing_item.bodega,
                bodega_destino=existing_item.bodega,
                propiedad=existing_item.propiedad,
                t_ingreso=existing_item.tipo_ingreso,
                observaciones=observaciones,
                fecha=timezone.now(),
                user=existing_item.user
            )
            return JsonResponse({'success': True})
        except Item.DoesNotExist:
            pass"""