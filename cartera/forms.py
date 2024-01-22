from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Submit, Row, Column
from django.core.validators import MinValueValidator
from .models import Presentacion, CotizacionEtnico


class CotizacionForm(forms.Form):
    SEMANAS_DEL_ANO = [(i, f'Semana {i}') for i in range(1, 53)]
    semana = forms.ChoiceField(choices=SEMANAS_DEL_ANO, required=True)
    trm_cotizacion = forms.DecimalField(validators=[MinValueValidator(0)],
                                        max_digits=10, decimal_places=2,
                                        required=True)

    def __init__(self, *args, **kwargs):
        super(CotizacionForm, self).__init__(*args, **kwargs)

        # Crear campos para cada presentación basado en los campos del modelo Cotizacion
        for presentacion in Presentacion.objects.all():
            for field in CotizacionEtnico._meta.get_fields():
                if hasattr(field, 'max_digits'):  # Verificar si es un campo DecimalField
                    field_name = f"{field.name}_{presentacion.id}"
                    self.fields[field_name] = forms.DecimalField(
                        label=f"{field.verbose_name} - {presentacion.nombre}",
                        max_digits=field.max_digits,
                        decimal_places=field.decimal_places,
                        required=False
                    )


class ComparacionPreciosForm(forms.Form):
    # Filtra los campos que quieras incluir en las opciones
    OPCIONES_COMPARACION = [('', 'Seleccione una opción')] + [
        (field.name, field.name) for field in CotizacionEtnico._meta.get_fields()
        if hasattr(field, 'max_digits')  # Por ejemplo, para filtrar solo campos decimales
    ]

    presentacion = forms.ModelChoiceField(queryset=Presentacion.objects.all(), required=True)
    SEMANAS_DEL_ANO = [(i, f'Semana {i}') for i in range(1, 53)]
    semana = forms.ChoiceField(choices=SEMANAS_DEL_ANO, required=True)
    tipo_comparacion = forms.ChoiceField(choices=OPCIONES_COMPARACION, required=True)

    def __init__(self, *args, **kwargs):
        super(ComparacionPreciosForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.layout = Layout(
            Row(
                Column('presentacion', css_class='form-group col-md-4 mb-0'),
                Column('semana', css_class='form-group col-md-4 mb-0'),
                Column('tipo_comparacion', css_class='form-group col-md-4 mb-0'),
                css_class='form-row'
            ),
            Row(
                Column(Submit('submit', 'Comparar', css_class='btn-warning'), css_class='text-center',),
                css_class='form-row'
            )
        )
