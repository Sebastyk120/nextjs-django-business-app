from django import forms
from django.forms import DateInput

from .models import Pedido, Cliente, DetallePedido, Referencias, Presentacion


class SearchForm(forms.Form):
    item_busqueda = forms.CharField(max_length=256, required=False)


# ------------------------------------ Formulario Crear Pedido ---------------------------------------------
class PedidoForm(forms.ModelForm):
    cliente = forms.ModelChoiceField(
        queryset=Cliente.objects.all(),
        empty_label="Seleccione Un Cliente",
        to_field_name="nombre",
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    fecha_solicitud = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )
    fecha_entrega = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )
    fecha_pago_comision = forms.DateField(
        required=False,
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    def clean(self):
        cleaned_data = super().clean()
        fecha_solicitud = cleaned_data.get('fecha_solicitud')
        fecha_entrega = cleaned_data.get('fecha_entrega')

        if fecha_entrega and fecha_solicitud and fecha_entrega < fecha_solicitud:
            self.add_error('fecha_entrega', 'La fecha de entrega no puede ser anterior a la fecha de solicitud.')

        return cleaned_data

    class Meta:
        model = Pedido
        fields = ['cliente', 'fecha_solicitud', 'fecha_entrega', 'exportadora', 'awb',
                  'numero_factura', 'nota_credito_no', 'motivo_nota_credito', 'documento_cobro_comision',
                  'fecha_pago_comision']


# ------------------------------------ Formulario Editar Pedido ---------------------------------------------

class EditarPedidoForm(forms.ModelForm):
    fecha_solicitud = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )
    fecha_entrega = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )
    fecha_pago_comision = forms.DateField(
        required=False,
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    def clean(self):
        cleaned_data = super().clean()
        fecha_solicitud = cleaned_data.get('fecha_solicitud')
        fecha_entrega = cleaned_data.get('fecha_entrega')

        if fecha_entrega and fecha_solicitud and fecha_entrega < fecha_solicitud:
            self.add_error('fecha_entrega', 'La fecha de entrega no puede ser anterior a la fecha de solicitud.')

        return cleaned_data

    class Meta:
        model = Pedido
        fields = ['cliente', 'fecha_solicitud', 'fecha_entrega', 'exportadora', 'awb',
                  'numero_factura', 'nota_credito_no', 'motivo_nota_credito', 'documento_cobro_comision',
                  'fecha_pago_comision']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['exportadora'].disabled = True


# ------------------------------------ Formulario Eliminar Pedido ---------------------------------------------
class EliminarPedidoForm(forms.ModelForm):
    fecha_solicitud = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )
    fecha_entrega = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    class Meta:
        model = Pedido
        fields = ['cliente', 'fecha_solicitud', 'fecha_entrega', 'exportadora', 'awb',
                  'numero_factura']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cliente'].disabled = True
        self.fields['fecha_solicitud'].disabled = True
        self.fields['fecha_entrega'].disabled = True
        self.fields['exportadora'].disabled = True
        self.fields['awb'].disabled = True
        self.fields['numero_factura'].disabled = True


# ------------------------------------ Formulario Crear o editar Detalle Pedido ---------------------------------------
class DetallePedidoForm(forms.ModelForm):
    class Meta:
        model = DetallePedido
        fields = ['pedido', 'fruta', 'presentacion', 'cajas_solicitadas', 'cajas_enviadas',
                  'tipo_caja', 'referencia', 'lleva_contenedor', 'tarifa_comision',
                  'valor_x_caja_usd', 'no_cajas_nc', 'afecta_comision', 'observaciones', 'precio_proforma']

    def __init__(self, *args, **kwargs):
        pedido_id = kwargs.pop('pedido_id', None)
        super(DetallePedidoForm, self).__init__(*args, **kwargs)
        self.fields['pedido'].disabled = True

        if pedido_id:
            pedido = Pedido.objects.get(id=pedido_id)
            self.fields['referencia'].queryset = Referencias.objects.filter(exportador=pedido.exportadora)
            self.fields['presentacion'].queryset = Presentacion.objects.filter(clientes=pedido.cliente)


# -------------------------- Formulario Eliminar  Detalle  De Pedido ---------------------------------------------


class EliminarDetallePedidoForm(forms.ModelForm):
    class Meta:
        model = DetallePedido
        fields = ['pedido', 'fruta', 'presentacion', 'cajas_solicitadas', 'cajas_enviadas',
                  'tipo_caja', 'referencia', 'lleva_contenedor', 'tarifa_comision',
                  'valor_x_caja_usd', 'no_cajas_nc', 'afecta_comision', 'observaciones', 'precio_proforma']

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
        self.fields['tarifa_comision'].disabled = True
        self.fields['valor_x_caja_usd'].disabled = True
        self.fields['no_cajas_nc'].disabled = True
        self.fields['afecta_comision'].disabled = True
        self.fields['observaciones'].disabled = True
        self.fields['precio_proforma'].disabled = True


# -------------------------- Formulario Editar  Detalle  De Pedido ---------------------------------------------

class EditarDetallePedidoForm(forms.ModelForm):
    class Meta:
        model = DetallePedido
        fields = ['pedido', 'fruta', 'presentacion', 'cajas_solicitadas', 'cajas_enviadas',
                  'tipo_caja', 'referencia', 'lleva_contenedor', 'tarifa_comision',
                  'valor_x_caja_usd', 'no_cajas_nc', 'afecta_comision', 'observaciones', 'precio_proforma']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['pedido'].disabled = True
        self.fields['referencia'].disabled = True


class EditarPedidoExportadorForm(forms.ModelForm):
    fecha_pago = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}), required=False
    )

    class Meta:
        model = Pedido
        fields = ['valor_pagado_cliente_usd', 'comision_bancaria_usd', 'fecha_pago', 'trm_monetizacion']


class EditarReferenciaForm(forms.ModelForm):
    class Meta:
        model = Referencias
        fields = ['nombre', 'referencia_nueva', 'precio', 'contenedor', 'cant_contenedor',
                  'exportador']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['nombre'].disabled = True
        self.fields['contenedor'].disabled = True
        self.fields['cant_contenedor'].disabled = True
        self.fields['exportador'].disabled = True
