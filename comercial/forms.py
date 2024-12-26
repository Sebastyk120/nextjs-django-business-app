from django import forms
from django.core.exceptions import ValidationError
from django.forms import DateInput
from .models import Pedido, Cliente, DetallePedido, Referencias, Presentacion, Exportador, Fruta, Intermediario


class SearchFormReferencias(forms.Form):
    item_busqueda = forms.CharField(max_length=256, required=False)


def get_unique_weeks():
    # Obtenemos las semanas únicas de los pedidos
    semanas = Pedido.objects.values_list('semana', flat=True).distinct()
    # Convertimos las semanas en tuplas y las ordenamos en formato WW-YYYY
    semanas_tuplas = {(int(s.split('-')[0]), int(s.split('-')[1])) for s in semanas}
    semanas_ordenadas = sorted(semanas_tuplas, key=lambda x: (x[1], x[0]), reverse=True)
    # Devolvemos las semanas en el formato correcto
    return [(f"{semana[0]}-{semana[1]}", f'Semana {semana[0]}-{semana[1]}') for semana in semanas_ordenadas]

class FiltroSemanaExportadoraForm(forms.Form):
    semana = forms.ChoiceField(
        label='Semana',
        required=True,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    exportadora = forms.ModelChoiceField(
        queryset=Exportador.objects.all(),
        label='Exportadora',
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Actualizamos las opciones de semana en cada instancia del formulario
        self.fields['semana'].choices = [('', 'Seleccione una semana')] + get_unique_weeks()

# --------------------------- Formulario con filtro Cliente -------------------------------------------------------
class SearchForm(forms.Form):
    METODO_BUSQUEDA_CHOICES = [
        ('awb', 'AWB'),
        ('numero_factura', 'Número de Factura'),
        ('id', 'Número De Pedido'),
        ('intermediario', 'Intermediario'),
    ]
    metodo_busqueda = forms.ChoiceField(choices=METODO_BUSQUEDA_CHOICES, required=False, label="Modo De Búsqueda")
    item_busqueda = forms.CharField(max_length=100, required=False, label="Ingrese búsqueda")
    cliente = forms.ModelChoiceField(queryset=Cliente.objects.none(), required=False, label="Cliente")

    def __init__(self, *args, **kwargs):
        clientes = kwargs.pop('clientes', None)
        super(SearchForm, self).__init__(*args, **kwargs)
        if clientes is not None:
            self.fields['cliente'].queryset = clientes


class ExportSearchForm(forms.Form):
    cliente = forms.ModelChoiceField(queryset=Cliente.objects.filter(pedido__isnull=False).distinct(), required=False,
                                     label="Seleccione un cliente")
    intermediario = forms.ModelChoiceField(queryset=Intermediario.objects.filter(pedido__isnull=False).distinct(),
                                           required=False, label="Seleccione un intermediario")


class ExportSearchFormSeguimientos(forms.Form):
    cliente = forms.ModelChoiceField(queryset=Cliente.objects.filter(pedido__isnull=False).distinct(), required=False,
                                     label="Seleccione un cliente")
    intermediario = forms.ModelChoiceField(queryset=Intermediario.objects.filter(pedido__isnull=False).distinct(),
                                           required=False, label="Seleccione un intermediario")
    fecha_inicial = forms.DateField(required=False, label="Fecha Inicial")
    fecha_final = forms.DateField(required=False, label="Fecha Final")


# ------------------------------------ Formulario Crear Pedido ---------------------------------------------
class PedidoForm(forms.ModelForm):
    cliente = forms.ModelChoiceField(
        queryset=Cliente.objects.all(),
        empty_label="Seleccione Un Cliente",
        to_field_name="nombre",
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    fecha_entrega = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    class Meta:
        model = Pedido
        fields = ['cliente', 'intermediario', 'fecha_entrega', 'exportadora',
                  'subexportadora', 'destino', 'observaciones']


# ------------------------------------ Formulario Editar Pedido ---------------------------------------------

class EditarPedidoForm(forms.ModelForm):
    fecha_entrega = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    class Meta:
        model = Pedido
        fields = ['cliente', 'intermediario', 'fecha_entrega', 'exportadora',
                  'subexportadora', 'destino', 'observaciones']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


# ------------------------ Fomrulario Editar Pedido 2 -------------------------------------------------------------
class EditarPedidoFormDos(forms.ModelForm):
    fecha_entrega = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )
    fecha_pago_utilidad = forms.DateField(
        required=False,
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    class Meta:
        model = Pedido
        fields = ['cliente', 'intermediario', 'fecha_entrega', 'exportadora',
                  'subexportadora', 'destino', 'awb', 'numero_factura', 'descuento', 'observaciones']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cliente'].disabled = True
        self.fields['intermediario'].disabled = True
        self.fields['fecha_entrega'].disabled = True
        self.fields['exportadora'].disabled = True
        self.fields['subexportadora'].disabled = True
        self.fields['destino'].disabled = True


# ------------------------ Fomrulario Editar Pedido Cartera -------------------------------------------------------------
class EditarPedidoFormCartera(forms.ModelForm):
    fecha_entrega = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )
    fecha_pago_utilidad = forms.DateField(
        required=False,
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    class Meta:
        model = Pedido
        fields = ['cliente', 'intermediario', 'fecha_entrega', 'exportadora',
                  'subexportadora', 'destino', 'nota_credito_no', 'motivo_nota_credito', 'observaciones']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cliente'].disabled = True
        self.fields['intermediario'].disabled = True
        self.fields['fecha_entrega'].disabled = True
        self.fields['exportadora'].disabled = True
        self.fields['subexportadora'].disabled = True
        self.fields['destino'].disabled = True


# ------------------------ Fomrulario Editar Pedido Utilidades ---------------------------------------------------------
class EditarPedidoFormUtilidades(forms.ModelForm):
    fecha_entrega = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )
    fecha_pago_utilidad = forms.DateField(
        required=False,
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    class Meta:
        model = Pedido
        fields = ['cliente', 'intermediario', 'fecha_entrega', 'exportadora',
                  'subexportadora', 'destino', 'nota_credito_no', 'motivo_nota_credito', 'documento_cobro_utilidad',
                  'fecha_pago_utilidad', 'observaciones']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cliente'].disabled = True
        self.fields['intermediario'].disabled = True
        self.fields['fecha_entrega'].disabled = True
        self.fields['exportadora'].disabled = True
        self.fields['subexportadora'].disabled = True
        self.fields['destino'].disabled = True
        self.fields['nota_credito_no'].disabled = True
        self.fields['motivo_nota_credito'].disabled = True


# ------------------------------------ Formulario Eliminar Pedido ---------------------------------------------
class EliminarPedidoForm(forms.ModelForm):
    fecha_entrega = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    class Meta:
        model = Pedido
        fields = ['cliente', 'fecha_entrega', 'exportadora', 'awb',
                  'numero_factura']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cliente'].disabled = True
        self.fields['fecha_entrega'].disabled = True
        self.fields['exportadora'].disabled = True
        self.fields['awb'].disabled = True
        self.fields['numero_factura'].disabled = True


# ------------------------------------ Formulario Crear o editar Detalle Pedido ---------------------------------------
class DetallePedidoForm(forms.ModelForm):
    class Meta:
        model = DetallePedido
        fields = ['pedido', 'fruta', 'presentacion', 'cajas_solicitadas', 'tipo_caja', 'referencia', 'lleva_contenedor',
                  'tarifa_utilidad', 'valor_x_caja_usd', 'observaciones', 'precio_proforma']

    def __init__(self, *args, **kwargs):
        pedido_id = kwargs.pop('pedido_id', None)
        if not pedido_id:
            raise ValidationError("El pedido_id es requerido")

        super(DetallePedidoForm, self).__init__(*args, **kwargs)
        self.fields['pedido'].disabled = True

        try:
            pedido = Pedido.objects.get(id=pedido_id)
        except Pedido.DoesNotExist:
            raise ValidationError(f"No se encontró el pedido con id {pedido_id}")

        cliente = pedido.cliente

        # Filtrar las frutas según el cliente del pedido
        self.fields['fruta'].queryset = Fruta.objects.filter(clientepresentacion__cliente=cliente).distinct()

        if 'fruta' in self.data:
            try:
                fruta_id = int(self.data.get('fruta'))
                self.fields['presentacion'].queryset = Presentacion.objects.filter(
                    clientepresentacion__cliente=cliente, clientepresentacion__fruta_id=fruta_id)
            except (ValueError, TypeError):
                pass  # Invalid input; ignore and fallback to empty queryset
        elif self.instance.pk:
            self.fields['presentacion'].queryset = Presentacion.objects.filter(
                clientepresentacion__cliente=cliente, clientepresentacion__fruta=self.instance.fruta
            )

        if 'presentacion' in self.data and 'tipo_caja' in self.data:
            try:
                presentacion_id = int(self.data.get('presentacion'))
                tipo_caja_id = int(self.data.get('tipo_caja'))
                fruta_id = int(self.data.get('fruta'))
                self.fields['referencia'].queryset = Referencias.objects.filter(
                    presentacionreferencia__presentacion_id=presentacion_id,
                    presentacionreferencia__tipo_caja_id=tipo_caja_id,
                    presentacionreferencia__fruta_id=fruta_id,
                    exportador=pedido.exportadora
                )
            except (ValueError, TypeError):
                pass  # Invalid input; ignore and fallback to empty queryset
        elif self.instance.pk:
            self.fields['referencia'].queryset = Referencias.objects.filter(
                presentacionreferencia__presentacion=self.instance.presentacion,
                presentacionreferencia__tipo_caja=self.instance.tipo_caja,
                presentacionreferencia__fruta=self.instance.fruta,
                exportador=pedido.exportadora
            )

        # Añadir clases CSS a los widgets
        self.fields['fruta'].widget.attrs.update({'class': 'fruta-select'})
        self.fields['presentacion'].widget.attrs.update({'class': 'presentacion-select'})
        self.fields['tipo_caja'].widget.attrs.update({'class': 'tipo-caja-select'})

    def clean(self):
        cleaned_data = super().clean()
        referencia = cleaned_data.get("referencia")
        lleva_contenedor = cleaned_data.get("lleva_contenedor")

        if referencia:
            if referencia.cantidad_pallet_con_contenedor in [0, None] and lleva_contenedor:
                self.add_error('lleva_contenedor',
                               "No puede seleccionar Si porque la referencia no permite contenedor.")
        return cleaned_data


# ------------------------------------ Formulario editar Detalle Pedido ---------------------------------------

class EditarDetallePedidoForm(forms.ModelForm):
    class Meta:
        model = DetallePedido
        fields = ['pedido', 'fruta', 'presentacion', 'cajas_solicitadas', 'tipo_caja', 'referencia', 'lleva_contenedor',
                  'tarifa_utilidad', 'valor_x_caja_usd', 'observaciones', 'precio_proforma']

    def __init__(self, *args, **kwargs):
        pedido_id = kwargs.pop('pedido_id', None)
        if not pedido_id:
            raise ValidationError("El pedido_id es requerido")

        super(EditarDetallePedidoForm, self).__init__(*args, **kwargs)
        self.fields['pedido'].disabled = True

        try:
            pedido = Pedido.objects.get(id=pedido_id)
        except Pedido.DoesNotExist:
            raise ValidationError(f"No se encontró el pedido con id {pedido_id}")

        cliente = pedido.cliente

        # Filtrar las frutas según el cliente del pedido
        self.fields['fruta'].queryset = Fruta.objects.filter(clientepresentacion__cliente=cliente).distinct()

        if 'fruta' in self.data:
            try:
                fruta_id = int(self.data.get('fruta'))
                self.fields['presentacion'].queryset = Presentacion.objects.filter(
                    clientepresentacion__cliente=cliente, clientepresentacion__fruta_id=fruta_id)
            except (ValueError, TypeError):
                pass  # Invalid input; ignore and fallback to empty queryset
        elif self.instance.pk:
            self.fields['presentacion'].queryset = Presentacion.objects.filter(
                clientepresentacion__cliente=cliente, clientepresentacion__fruta=self.instance.fruta
            )

        if 'presentacion' in self.data and 'tipo_caja' in self.data:
            try:
                presentacion_id = int(self.data.get('presentacion'))
                tipo_caja_id = int(self.data.get('tipo_caja'))
                fruta_id = int(self.data.get('fruta'))
                self.fields['referencia'].queryset = Referencias.objects.filter(
                    presentacionreferencia__presentacion_id=presentacion_id,
                    presentacionreferencia__tipo_caja_id=tipo_caja_id,
                    presentacionreferencia__fruta_id=fruta_id,
                    exportador=pedido.exportadora
                )
            except (ValueError, TypeError):
                pass  # Invalid input; ignore and fallback to empty queryset
        elif self.instance.pk:
            self.fields['referencia'].queryset = Referencias.objects.filter(
                presentacionreferencia__presentacion=self.instance.presentacion,
                presentacionreferencia__tipo_caja=self.instance.tipo_caja,
                presentacionreferencia__fruta=self.instance.fruta,
                exportador=pedido.exportadora
            )

        # Añadir clases CSS a los widgets
        self.fields['fruta'].widget.attrs.update({'class': 'fruta-select'})
        self.fields['presentacion'].widget.attrs.update({'class': 'presentacion-select'})
        self.fields['tipo_caja'].widget.attrs.update({'class': 'tipo-caja-select'})

    def clean(self):
        cleaned_data = super().clean()
        referencia = cleaned_data.get("referencia")
        lleva_contenedor = cleaned_data.get("lleva_contenedor")

        if referencia:
            if referencia.cantidad_pallet_con_contenedor in [0, None] and lleva_contenedor:
                self.add_error('lleva_contenedor',
                               "No puedes seleccionar Si en el campo Lleva contenedor porque la referencia no "
                               "permite contenedor.")
        return cleaned_data


# ------------------------------  Editar Detalle De Pedido, Cajas enviadas momento 2 -------------------------
class EditarDetallePedidoDosForm(forms.ModelForm):
    class Meta:
        model = DetallePedido
        fields = ['pedido', 'fruta', 'presentacion', 'cajas_solicitadas', 'tipo_caja', 'referencia', 'lleva_contenedor',
                  'tarifa_utilidad', 'valor_x_caja_usd', 'observaciones', 'precio_proforma', 'cajas_enviadas']

    def __init__(self, *args, **kwargs):
        pedido_id = kwargs.pop('pedido_id', None)
        if not pedido_id:
            raise ValidationError("El pedido_id es requerido")

        super(EditarDetallePedidoDosForm, self).__init__(*args, **kwargs)
        self.fields['pedido'].disabled = True
        self.fields['fruta'].disabled = True
        self.fields['presentacion'].disabled = True
        self.fields['cajas_solicitadas'].disabled = True
        self.fields['tipo_caja'].disabled = True
        self.fields['referencia'].disabled = True
        self.fields['lleva_contenedor'].disabled = True
        self.fields['tarifa_utilidad'].disabled = True
        self.fields['valor_x_caja_usd'].disabled = True
        self.fields['precio_proforma'].disabled = True

        try:
            pedido = Pedido.objects.get(id=pedido_id)
        except Pedido.DoesNotExist:
            raise ValidationError(f"No se encontró el pedido con id {pedido_id}")

        cliente = pedido.cliente

        # Filtrar las frutas según el cliente del pedido
        self.fields['fruta'].queryset = Fruta.objects.filter(clientepresentacion__cliente=cliente).distinct()

        if 'fruta' in self.data:
            try:
                fruta_id = int(self.data.get('fruta'))
                self.fields['presentacion'].queryset = Presentacion.objects.filter(
                    clientepresentacion__cliente=cliente, clientepresentacion__fruta_id=fruta_id)
            except (ValueError, TypeError):
                pass  # Invalid input; ignore and fallback to empty queryset
        elif self.instance.pk:
            self.fields['presentacion'].queryset = Presentacion.objects.filter(
                clientepresentacion__cliente=cliente, clientepresentacion__fruta=self.instance.fruta
            )

        if 'presentacion' in self.data and 'tipo_caja' in self.data:
            try:
                presentacion_id = int(self.data.get('presentacion'))
                tipo_caja_id = int(self.data.get('tipo_caja'))
                fruta_id = int(self.data.get('fruta'))
                self.fields['referencia'].queryset = Referencias.objects.filter(
                    presentacionreferencia__presentacion_id=presentacion_id,
                    presentacionreferencia__tipo_caja_id=tipo_caja_id,
                    presentacionreferencia__fruta_id=fruta_id,
                    exportador=pedido.exportadora
                )
            except (ValueError, TypeError):
                pass  # Invalid input; ignore and fallback to empty queryset
        elif self.instance.pk:
            self.fields['referencia'].queryset = Referencias.objects.filter(
                presentacionreferencia__presentacion=self.instance.presentacion,
                presentacionreferencia__tipo_caja=self.instance.tipo_caja,
                presentacionreferencia__fruta=self.instance.fruta,
                exportador=pedido.exportadora
            )

        # Añadir clases CSS a los widgets
        self.fields['fruta'].widget.attrs.update({'class': 'fruta-select'})
        self.fields['presentacion'].widget.attrs.update({'class': 'presentacion-select'})
        self.fields['tipo_caja'].widget.attrs.update({'class': 'tipo-caja-select'})

    def clean(self):
        cleaned_data = super().clean()
        referencia = cleaned_data.get("referencia")
        lleva_contenedor = cleaned_data.get("lleva_contenedor")

        if referencia:
            if referencia.cantidad_pallet_con_contenedor in [0, None] and lleva_contenedor:
                self.add_error('lleva_contenedor',
                               "No puedes seleccionar Si en el campo Lleva contenedor porque la referencia no "
                               "permite contenedor.")
        return cleaned_data


# ------------------------------  Editar Detalle De Pedido, Cajas enviadas momento 3 -------------------------
class EditarDetallePedidoTresForm(forms.ModelForm):
    class Meta:
        model = DetallePedido
        fields = ['pedido', 'fruta', 'presentacion', 'cajas_solicitadas', 'cajas_enviadas',
                  'tipo_caja', 'referencia', 'lleva_contenedor', 'tarifa_utilidad',
                  'valor_x_caja_usd', 'no_cajas_nc', 'afecta_utilidad', 'observaciones', 'precio_proforma']

    def __init__(self, *args, **kwargs):
        pedido_id = kwargs.pop('pedido_id', None)
        if not pedido_id:
            raise ValidationError("El pedido_id es requerido")

        super(EditarDetallePedidoTresForm, self).__init__(*args, **kwargs)
        self.fields['pedido'].disabled = True
        self.fields['fruta'].disabled = True
        self.fields['presentacion'].disabled = True
        self.fields['cajas_solicitadas'].disabled = True
        self.fields['cajas_enviadas'].disabled = True
        self.fields['tipo_caja'].disabled = True
        self.fields['referencia'].disabled = True
        self.fields['lleva_contenedor'].disabled = True
        self.fields['tarifa_utilidad'].disabled = True
        self.fields['valor_x_caja_usd'].disabled = True
        self.fields['precio_proforma'].disabled = True

        try:
            pedido = Pedido.objects.get(id=pedido_id)
        except Pedido.DoesNotExist:
            raise ValidationError(f"No se encontró el pedido con id {pedido_id}")

        cliente = pedido.cliente

        # Filtrar las frutas según el cliente del pedido
        self.fields['fruta'].queryset = Fruta.objects.filter(clientepresentacion__cliente=cliente).distinct()

        if 'fruta' in self.data:
            try:
                fruta_id = int(self.data.get('fruta'))
                self.fields['presentacion'].queryset = Presentacion.objects.filter(
                    clientepresentacion__cliente=cliente, clientepresentacion__fruta_id=fruta_id)
            except (ValueError, TypeError):
                pass  # Invalid input; ignore and fallback to empty queryset
        elif self.instance.pk:
            self.fields['presentacion'].queryset = Presentacion.objects.filter(
                clientepresentacion__cliente=cliente, clientepresentacion__fruta=self.instance.fruta
            )

        if 'presentacion' in self.data and 'tipo_caja' in self.data:
            try:
                presentacion_id = int(self.data.get('presentacion'))
                tipo_caja_id = int(self.data.get('tipo_caja'))
                fruta_id = int(self.data.get('fruta'))
                self.fields['referencia'].queryset = Referencias.objects.filter(
                    presentacionreferencia__presentacion_id=presentacion_id,
                    presentacionreferencia__tipo_caja_id=tipo_caja_id,
                    presentacionreferencia__fruta_id=fruta_id,
                    exportador=pedido.exportadora
                )
            except (ValueError, TypeError):
                pass  # Invalid input; ignore and fallback to empty queryset
        elif self.instance.pk:
            self.fields['referencia'].queryset = Referencias.objects.filter(
                presentacionreferencia__presentacion=self.instance.presentacion,
                presentacionreferencia__tipo_caja=self.instance.tipo_caja,
                presentacionreferencia__fruta=self.instance.fruta,
                exportador=pedido.exportadora
            )

        # Añadir clases CSS a los widgets
        self.fields['fruta'].widget.attrs.update({'class': 'fruta-select'})
        self.fields['presentacion'].widget.attrs.update({'class': 'presentacion-select'})
        self.fields['tipo_caja'].widget.attrs.update({'class': 'tipo-caja-select'})

    def clean(self):
        cleaned_data = super().clean()
        referencia = cleaned_data.get("referencia")
        lleva_contenedor = cleaned_data.get("lleva_contenedor")

        if referencia:
            if referencia.cantidad_pallet_con_contenedor in [0, None] and lleva_contenedor:
                self.add_error('lleva_contenedor',
                               "No puedes seleccionar Si en el campo Lleva contenedor porque la referencia no "
                               "permite contenedor.")
        return cleaned_data


# -------------------------- Formulario Eliminar  Detalle  De Pedido ---------------------------------------------


class EliminarDetallePedidoForm(forms.ModelForm):
    class Meta:
        model = DetallePedido
        fields = ['pedido', 'fruta', 'presentacion', 'cajas_solicitadas', 'cajas_enviadas',
                  'tipo_caja', 'referencia', 'lleva_contenedor', 'tarifa_utilidad',
                  'valor_x_caja_usd', 'no_cajas_nc', 'afecta_utilidad', 'observaciones', 'precio_proforma']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['pedido'].disabled = True
        self.fields['fruta'].disabled = True
        self.fields['presentacion'].disabled = True
        self.fields['cajas_solicitadas'].disabled = True
        self.fields['cajas_enviadas'].disabled = True
        self.fields['tipo_caja'].disabled = True
        self.fields['referencia'].disabled = True
        self.fields['lleva_contenedor'].disabled = True
        self.fields['tarifa_utilidad'].disabled = True
        self.fields['valor_x_caja_usd'].disabled = True
        self.fields['no_cajas_nc'].disabled = True
        self.fields['afecta_utilidad'].disabled = True
        self.fields['observaciones'].disabled = True
        self.fields['precio_proforma'].disabled = True


# --------------------------------- Editar pedido por exportador --------------------------------------------------
class EditarPedidoExportadorForm(forms.ModelForm):
    fecha_pago = forms.DateField(
        label=Pedido._meta.get_field('fecha_pago').verbose_name,  # Establecer el label al verbose_name del modelo
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}), required=False
    )
    fecha_monetizacion = forms.DateField(
        label=Pedido._meta.get_field('fecha_monetizacion').verbose_name,
        # Establecer el label al verbose_name del modelo
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}), required=False
    )

    class Meta:
        model = Pedido
        fields = ['valor_pagado_cliente_usd', 'utilidad_bancaria_usd', 'fecha_pago', 'fecha_monetizacion',
                  'trm_monetizacion', 'trm_cotizacion']


# ------------------------------------------------ Editar Referencia ------------------------------------------------
class EditarReferenciaForm(forms.ModelForm):
    class Meta:
        model = Referencias
        fields = ['nombre', 'referencia_nueva', 'precio', 'contenedor', 'cant_contenedor',
                  'exportador']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['nombre'].disabled = True
        self.fields['cant_contenedor'].disabled = True
        self.fields['exportador'].disabled = True


# --------------------------------------- Editar Pedidos, Seguimiento o tracking -------------------------------------

class EditarPedidoSeguimientoForm(forms.ModelForm):
    fecha_llegada = forms.DateField(
        label=Pedido._meta.get_field('fecha_llegada').verbose_name,
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}), required=False
    )

    class Meta:
        model = Pedido
        fields = [
            'fecha_llegada',
            'responsable_reserva',
            'estatus_reserva',
            'agencia_carga',
            'etd',
            'eta',
            'peso_awb',
            'eta_real',
            'termo',
            'estado_documentos',
            'observaciones_tracking'
        ]
        widgets = {
            'etd': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'eta': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'eta_real': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
        }
