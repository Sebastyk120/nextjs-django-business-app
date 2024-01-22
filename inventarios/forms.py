from django import forms
from django.forms import DateInput
from .models import Item
from comercial.models import Referencias


# Boton (Buscar Item, todos los modulos.)
class SearchForm(forms.Form):
    item_busqueda = forms.CharField(max_length=256, required=False)


# Formulario para dar ingreso al inventario Item ---------------------------------------------------
class ItemForm(forms.ModelForm):
    referencias_excluidas = ["Fieldex", "Juan_Matas"]
    numero_item = forms.ModelChoiceField(
        queryset=Referencias.objects.all(),
        empty_label="Seleccione una referencia",
        to_field_name="nombre",
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    # Utiliza DateInput para el campo fecha_movimiento
    fecha_movimiento = forms.DateField(
        widget=DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    class Meta:
        model = Item
        fields = ['bodega', 'numero_item', 'cantidad_cajas', 'tipo_documento', 'documento', 'proveedor',
                  'fecha_movimiento', 'propiedad', 'observaciones']


# Formulario para editar un Item General ----------------------------------------------------------------
class EditarItemForm(forms.ModelForm):
    class Meta:
        model = Item
        fields = ['numero_item', 'cantidad_cajas', 'tipo_documento', 'documento', 'proveedor', 'fecha_movimiento',
                  'propiedad', 'observaciones']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['numero_item'].disabled = True
        self.fields['fecha_movimiento'].widget = DateInput(attrs={'type': 'date', 'class': 'form-control'})


# Formulario para Eliminar un Item General----------------------------------------------------------------

class EliminarItemForm(forms.ModelForm):
    class Meta:
        model = Item
        fields = ['numero_item', 'cantidad_cajas', 'tipo_documento', 'documento', 'proveedor', 'fecha_movimiento',
                  'propiedad', 'observaciones']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['numero_item'].disabled = True
        self.fields['cantidad_cajas'].disabled = True
        self.fields['tipo_documento'].disabled = True
        self.fields['documento'].disabled = True
        self.fields['proveedor'].disabled = True
        self.fields['fecha_movimiento'].disabled = True
        self.fields['propiedad'].disabled = True
        self.fields['observaciones'].disabled = True
