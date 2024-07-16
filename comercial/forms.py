import datetime

from django import forms
from django.forms import DateInput
from django.core.exceptions import ValidationError
from .models import Pedido, Cliente, DetallePedido, Referencias, Presentacion, Exportador, Fruta


class SearchFormReferencias(forms.Form):
    item_busqueda = forms.CharField(max_length=256, required=False)


WEEK_CHOICES = [(str(i), f'Semana {i}') for i in range(1, 53)]


class FiltroSemanaExportadoraForm(forms.Form):
    semana = forms.ChoiceField(
        choices=[('', 'Seleccione una semana')] + WEEK_CHOICES,
        label='Semana',
        required=False,
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


class SearchForm(forms.Form):
    SEARCH_CHOICES = [
        ('awb', 'AWB'),
        ('numero_factura', 'Número de Factura'),
        ('cliente', 'Cliente'),
        ('id', 'No Pedido')
    ]
    metodo_busqueda = forms.ChoiceField(choices=SEARCH_CHOICES, required=True)
    item_busqueda = forms.CharField(max_length=255, required=True)


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
    fecha_pago_utilidad = forms.DateField(
        required=False,
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    def clean(self):
        cleaned_data = super().clean()
        fecha_solicitud = datetime.datetime.now()
        fecha_entrega = cleaned_data.get('fecha_entrega')

        if fecha_entrega and fecha_entrega < fecha_solicitud:
            self.add_error('fecha_entrega', 'La fecha de entrega no puede ser anterior a la fecha de solicitud.')

        return cleaned_data

    class Meta:
        model = Pedido
        fields = ['cliente', 'intermediario', 'fecha_entrega', 'exportadora',
                  'subexportadora',
                  'awb', 'destino', 'numero_factura', 'descuento', 'nota_credito_no', 'motivo_nota_credito',
                  'documento_cobro_utilidad', 'fecha_pago_utilidad', 'observaciones']


# ------------------------------------ Formulario Editar Pedido ---------------------------------------------

class EditarPedidoForm(forms.ModelForm):
    fecha_entrega = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )
    fecha_pago_utilidad = forms.DateField(
        required=False,
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    def clean(self):
        cleaned_data = super().clean()
        fecha_solicitud = datetime.datetime.now()
        fecha_entrega = cleaned_data.get('fecha_entrega')

        if fecha_entrega and fecha_entrega < fecha_solicitud:
            self.add_error('fecha_entrega', 'La fecha de entrega no puede ser anterior a la fecha de solicitud.')

        return cleaned_data

    class Meta:
        model = Pedido
        fields = ['cliente', 'intermediario', 'fecha_entrega', 'exportadora',
                  'subexportadora',
                  'awb', 'destino', 'numero_factura', 'descuento', 'nota_credito_no', 'motivo_nota_credito',
                  'documento_cobro_utilidad', 'fecha_pago_utilidad', 'observaciones']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


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
        fields = ['pedido', 'fruta', 'presentacion', 'cajas_solicitadas', 'cajas_enviadas',
                  'tipo_caja', 'referencia', 'lleva_contenedor', 'tarifa_utilidad',
                  'valor_x_caja_usd', 'no_cajas_nc', 'afecta_utilidad', 'observaciones', 'precio_proforma']

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

        # Filtrar las frutas según el cliente del pedido
        self.fields['fruta'].queryset = Fruta.objects.filter(clientepresentacion__cliente=pedido.cliente).distinct()

        # Inicialmente, la presentación debe estar vacía
        self.fields['presentacion'].queryset = Presentacion.objects.none()

        if 'fruta' in self.data:
            try:
                fruta_id = int(self.data.get('fruta'))
                self.fields['presentacion'].queryset = Presentacion.objects.filter(
                    clientepresentacion__cliente=pedido.cliente, clientepresentacion__fruta_id=fruta_id)
            except (ValueError, TypeError):
                pass  # Invalid input; ignore and fallback to empty queryset
        elif self.instance.pk:
            self.fields['presentacion'].queryset = Presentacion.objects.filter(
                clientepresentacion__cliente=pedido.cliente, clientepresentacion__fruta=self.instance.fruta
            )

        # Filtrar las referencias según el exportador del pedido
        self.fields['referencia'].queryset = Referencias.objects.filter(exportador=pedido.exportadora)

        # Añadir clases CSS a los widgets
        self.fields['fruta'].widget.attrs.update({'class': 'fruta-select'})
        self.fields['presentacion'].widget.attrs.update({'class': 'presentacion-select'})


# ------------------------------------ Formulario editar Detalle Pedido ---------------------------------------

class EditarDetallePedidoForm(forms.ModelForm):
    class Meta:
        model = DetallePedido
        fields = ['pedido', 'fruta', 'presentacion', 'cajas_solicitadas', 'cajas_enviadas',
                  'tipo_caja', 'referencia', 'lleva_contenedor', 'tarifa_utilidad',
                  'valor_x_caja_usd', 'no_cajas_nc', 'afecta_utilidad', 'observaciones', 'precio_proforma']

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

        # Filtrar las frutas según el cliente del pedido
        self.fields['fruta'].queryset = Fruta.objects.filter(clientepresentacion__cliente=pedido.cliente).distinct()

        if 'fruta' in self.data:
            try:
                fruta_id = int(self.data.get('fruta'))
                self.fields['presentacion'].queryset = Presentacion.objects.filter(
                    clientepresentacion__cliente=pedido.cliente, clientepresentacion__fruta_id=fruta_id)
            except (ValueError, TypeError):
                pass  # Invalid input; ignore and fallback to empty queryset
        elif self.instance.pk:
            self.fields['presentacion'].queryset = Presentacion.objects.filter(
                clientepresentacion__cliente=pedido.cliente, clientepresentacion__fruta=self.instance.fruta
            )

        # Filtrar las referencias según el exportador del pedido y la presentación inicializada
        if self.instance.pk:
            self.fields['referencia'].queryset = Referencias.objects.filter(
                exportador=pedido.exportadora,
                presentacionreferencia__presentacion=self.instance.presentacion
            )
        else:
            self.fields['referencia'].queryset = Referencias.objects.filter(exportador=pedido.exportadora)

        # Añadir clases CSS a los widgets
        self.fields['fruta'].widget.attrs.update({'class': 'fruta-select'})
        self.fields['presentacion'].widget.attrs.update({'class': 'presentacion-select'})


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
        label=Pedido._meta.get_field('Fecha Llegada').verbose_name,
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
            'estado_documentos',
            'observaciones_tracking'
        ]
        widgets = {
            'etd': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'eta': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
        }
