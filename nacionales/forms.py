from decimal import Decimal
from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Field, Row, Column, Div, HTML
from .models import CompraNacional, VentaNacional, ReporteCalidadExportador, ReporteCalidadProveedor, TransferenciasProveedor

# forms.py
class CompraNacionalForm(forms.ModelForm):
    precio_compra_exp = forms.DecimalField(
        widget=forms.TextInput(attrs={
            'class': 'form-control currency-input',
            'data-type': 'currency',
        })
    )
    fecha_compra = forms.DateField(
        widget=forms.DateInput(attrs={
            'type': 'date',
            'class': 'form-control',
            'placeholder': 'YYYY-MM-DD'
        })
    )

    class Meta:
        model = CompraNacional
        fields = '__all__'
        widgets = {
            'observaciones': forms.Textarea(attrs={
                'rows': 3,
                'class': 'form-control',
                'placeholder': 'Ingrese observaciones...'
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_tag = False
        self.helper.label_class = 'form-label'
        self.helper.field_class = 'mb-3'
        self.helper.layout = Layout(
            Div(
                HTML('<h5 class="text-primary mb-4">Detalles de la Compra</h5>'),
                Row(
                    Column('proveedor', css_class='col-md-4'),
                    Column('fruta', css_class='col-md-4'),
                    Column('peso_compra', css_class='col-md-4'),
                    css_class='g-3'
                ),
                Row(
                    Column('origen_compra', css_class='col-md-4'),
                    Column('fecha_compra', css_class='col-md-4'),
                    Column('precio_compra_exp', css_class='col-md-4'),
                    css_class='g-3'
                ),
                HTML('<hr class="my-4">'),
                HTML('<h5 class="text-primary mb-4">Empaque y Documentación</h5>'),
                Row(
                    Column('tipo_empaque', css_class='col-md-6'),
                    Column('cantidad_empaque', css_class='col-md-6'),
                    css_class='g-3'
                ),
                Row(
                    Column('numero_guia', css_class='col-md-6'),
                    Column('remision', css_class='col-md-6'),
                    css_class='g-3'
                ),
                'observaciones',
                css_class='p-4 bg-white rounded shadow-sm'
            )
        )


class VentaNacionalForm(forms.ModelForm):
    fecha_llegada = forms.DateField(widget=forms.DateInput(format='%Y-%m-%d',
                                                          attrs={'type': 'date', 'class': 'form-control'}), )

    class Meta:
        model = VentaNacional
        exclude = ['compra_nacional']

    def __init__(self, *args, **kwargs):
        self.compra_nacional = kwargs.pop('compra_nacional', None)
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_tag = False
        self.helper.label_class = 'form-label'
        self.helper.field_class = 'mb-3'
        self.helper.layout = Layout(
            Div(
                HTML('<h5 class="text-primary mb-4">Detalles de la Venta</h5>'),
                Row(
                    Column('exportador', css_class='col-md-6'),
                    Column('fecha_llegada', css_class='col-md-6'),
                    css_class='g-3'
                ),
                Row(
                    Column('peso_bruto_recibido', css_class='col-md-6'),
                    Column('cantidad_empaque_recibida', css_class='col-md-6'),
                    css_class='g-3'
                ),
                HTML('<hr class="my-4">'),
                HTML('<h5 class="text-primary mb-4">Observaciones</h5>'),
                'observaciones',
                css_class='p-4 bg-white rounded shadow-sm'
            )
        )

    def clean(self):
        cleaned_data = super().clean()
        cantidad_empaque = self.compra_nacional.cantidad_empaque
        cantidad_empaque_recibida = cleaned_data.get('cantidad_empaque_recibida')

        if cantidad_empaque_recibida and cantidad_empaque_recibida > cantidad_empaque:
            self.add_error(
                'cantidad_empaque_recibida',
                f"El valor no puede ser mayor que la cantidad de empaque de compra ({cantidad_empaque})."
            )

        return cleaned_data


class ReporteCalidadExportadorForm(forms.ModelForm):
    precio_venta_kg_exp = forms.DecimalField(
        widget=forms.TextInput(attrs={
            'class': 'form-control currency-input',
            'data-type': 'currency'
        })
    )
    precio_venta_kg_nal = forms.DecimalField(
        widget=forms.TextInput(attrs={
            'class': 'form-control currency-input',
            'data-type': 'currency'
        })
    )
    fecha_reporte = forms.DateField(widget=forms.DateInput(format='%Y-%m-%d',
                                                          attrs={'type': 'date', 'class': 'form-control'}), )
    fecha_factura = forms.DateField(widget=forms.DateInput(format='%Y-%m-%d',
                                                          attrs={'type': 'date', 'class': 'form-control'}), required=False)

    class Meta:
        model = ReporteCalidadExportador
        exclude = ['venta_nacional']

    def __init__(self, *args, **kwargs):
        self.venta_nacional = kwargs.pop('venta_nacional', None)
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_tag = False
        self.helper.label_class = 'form-label'
        self.helper.field_class = 'mb-3'
        self.helper.layout = Layout(
            Div(
                HTML('<h5 class="text-primary mb-4">Información General</h5>'),
                Row(
                    Column('remision_exp', css_class='col-md-6'),
                    Column('fecha_reporte', css_class='col-md-6'),
                    css_class='g-3'
                ),
                HTML('<hr class="my-4">'),
                HTML('<h5 class="text-primary mb-4">Detalles de Venta</h5>'),
                Row(
                    Column('kg_exportacion', css_class='col-md-6'),
                    Column('kg_nacional', css_class='col-md-6'),
                    css_class='g-3'
                ),
                Row(
                    Column('precio_venta_kg_exp', css_class='col-md-6'),
                    Column('precio_venta_kg_nal', css_class='col-md-6'),
                    css_class='g-3'
                ),
                HTML('<hr class="my-4">'),
                HTML('<h5 class="text-primary mb-4">Facturación</h5>'),
                Row(
                    Column('pagado', css_class='col-md-4'),
                    Column('factura', css_class='col-md-4'),
                    Column('fecha_factura', css_class='col-md-4'),
                    css_class='g-3'
                ),
                css_class='p-4 bg-white rounded shadow-sm'
            )
        )

    def clean(self):
        cleaned_data = super().clean()

        # Validaciones solo si existe venta_nacional
        if self.venta_nacional and self.venta_nacional.peso_neto_recibido:
            total = self.venta_nacional.peso_neto_recibido
            kg_exportacion = cleaned_data.get('kg_exportacion')
            kg_nacional = cleaned_data.get('kg_nacional')
            fecha_factura = cleaned_data.get('fecha_factura')
            factura = cleaned_data.get('factura')
            pagado = cleaned_data.get('pagado')

            # Validación kg_exportacion
            if kg_exportacion and kg_exportacion > total:
                self.add_error('kg_exportacion', f"El valor no puede ser mayor que el peso neto recibido. ({total})")

            # Validación kg_nacional
            if kg_nacional and kg_nacional > total:
                self.add_error('kg_nacional', f"El valor no puede ser mayor que el peso neto recibido. ({total})")

            # Validación suma total
            if kg_exportacion and kg_nacional:
                computed_kg_merma = total - kg_exportacion - kg_nacional
                if computed_kg_merma < Decimal('0.00'):
                    raise forms.ValidationError(
                        f"La suma de Kg exportación y Kg nacional no puede superar el peso neto recibido. ({total})")

            if pagado and (factura is None or fecha_factura is None):
                self.add_error('fecha_factura', 'Este campo es obligatorio si se ha ingresado una factura.')
                self.add_error('factura', 'Este campo es obligatorio si se ha ingresado una factura.')

        return cleaned_data


class ReporteCalidadProveedorForm(forms.ModelForm):
    class Meta:
        model = ReporteCalidadProveedor
        exclude = ['rep_cal_exp']

    def __init__(self, *args, **kwargs):
        self.rep_cal_exp = kwargs.pop('rep_cal_exp', None)
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_tag = False
        self.helper.label_class = 'form-label'
        self.helper.field_class = 'mb-3'
        self.helper.layout = Layout(
            Div(
                HTML('<h5 class="text-primary mb-4">Detalles del Reporte</h5>'),
                Row(
                    Column('p_kg_exportacion', css_class='col-md-4'),
                    Column('p_kg_nacional', css_class='col-md-4'),
                    Column('factura_prov', css_class='col-md-4'),
                    css_class='g-3'
                ),
                HTML('<hr class="my-4">'),
                HTML('<h5 class="text-primary mb-4">Estado del Reporte</h5>'),
                Row(
                    Column('reporte_enviado', css_class='col-md-4'),
                    Column('reporte_pago', css_class='col-md-4'),
                    Column('completado', css_class='col-md-4'),
                    css_class='g-3'
                ),
                css_class='p-4 bg-white rounded shadow-sm'
            )
        )

    def clean(self):
        cleaned_data = super().clean()

        if self.rep_cal_exp and self.rep_cal_exp.venta_nacional.peso_neto_recibido:
            total = self.rep_cal_exp.venta_nacional.peso_neto_recibido
            p_kg_exportacion = cleaned_data.get('p_kg_exportacion')
            p_kg_nacional = cleaned_data.get('p_kg_nacional')
            completado = cleaned_data.get('completado')
            pagado = cleaned_data.get('reporte_pago')
            reporte_enviado = cleaned_data.get('reporte_enviado')
            factura_prov = cleaned_data.get('factura_prov')

            if completado and not (pagado or reporte_enviado) and factura_prov is None:
                self.add_error('reporte_pago', 'Este campo es obligatorio si el reporte está completado.')

            if (p_kg_exportacion is None and p_kg_nacional is not None) or (
                    p_kg_exportacion is not None and p_kg_nacional is None):
                self.add_error('p_kg_nacional',
                               "Ambos campos (Kg exportación y Kg nacional) deben estar completos o vacíos.")

            # Validación kg_exportacion
            if p_kg_exportacion and p_kg_exportacion > total:
                self.add_error('p_kg_exportacion', f"El valor no puede ser mayor que el peso neto recibido. ({total})")

            # Validación kg_nacional
            if p_kg_nacional and p_kg_nacional > total:
                self.add_error('p_kg_nacional', f"El valor no puede ser mayor que el peso neto recibido. ({total})")

            # Validación suma total
            if p_kg_exportacion and p_kg_nacional:
                computed_p_kg_merma = total - p_kg_exportacion - p_kg_nacional
                if computed_p_kg_merma < Decimal('0.00'):
                    raise forms.ValidationError(
                        f"La suma de Kg exportación y Kg nacional no puede superar el peso neto recibido. ({total})"
                    )

        return cleaned_data

class TransferenciasProveedorForm(forms.ModelForm):
    valor_transferencia = forms.DecimalField(
        widget=forms.TextInput(attrs={
            'class': 'form-control currency-input',
            'data-type': 'currency'
        })
    )
    fecha_transferencia = forms.DateField(widget=forms.DateInput(format='%Y-%m-%d',
                                                          attrs={'type': 'date', 'class': 'form-control'}))

    class Meta:
        model = TransferenciasProveedor
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_tag = False
        self.helper.label_class = 'form-label'
        self.helper.field_class = 'mb-3'
        self.helper.layout = Layout(
            Div(
                HTML('<h5 class="text-primary mb-4">Información de Transferencia</h5>'),
                Row(
                    Column('proveedor', css_class='col-md-4'),
                    Column('referencia', css_class='col-md-4'),
                    Column('origen_transferencia', css_class='col-md-4'),
                    css_class='g-3'
                ),
                Row(
                    Column('fecha_transferencia', css_class='col-md-6'),
                    Column('valor_transferencia', css_class='col-md-6'),
                    css_class='g-3'
                ),
                HTML('<hr class="my-4">'),
                HTML('<h5 class="text-primary mb-4">Observaciones</h5>'),
                'observaciones',
                css_class='p-4 bg-white rounded shadow-sm'
            )
        )