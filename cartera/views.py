from datetime import datetime
from django.contrib.auth.decorators import user_passes_test, login_required
from django.utils.decorators import method_decorator
from django.contrib import messages
from django.shortcuts import render, redirect
from django.views import View
from django.urls import reverse_lazy
from .models import Presentacion, CotizacionEtnico, CotizacionFieldex, CotizacionJuan
from .forms import CotizacionForm, ComparacionPreciosForm


# Funciones para validar el Grupo del usuario y si puede acceder a la vista:

def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro


# --------------------------------- Cotizador Etnico ------------------------------------------------------
@method_decorator(login_required, name='dispatch')
@method_decorator(user_passes_test(es_miembro_del_grupo('Etnico'), login_url=reverse_lazy('home')), name='dispatch')
class ActualizarCotizacionesEtnicoView(View):
    form_class = CotizacionForm
    template_name = 'cotizacion_etnico.html'

    def get(self, request, *args, **kwargs):
        semana = int(request.GET.get('semana', datetime.now().isocalendar()[1]))
        form = self.form_class(initial=self.get_initial(semana))
        presentaciones_data = self.get_presentaciones_data(form)
        field_names = self.get_field_names()
        return render(request, self.template_name, {
            'form': form,
            'presentaciones_data': presentaciones_data,
            'field_names': field_names  # Agregar esto
        })

    def get_field_names(self):
        field_names = []
        for field in CotizacionEtnico._meta.get_fields():
            if hasattr(field, 'max_digits') and field.name != 'trm_cotizacion':  # Excluir trm_cotizacion
                field_names.append(field.verbose_name or field.name)
        return field_names

    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST)
        if form.is_valid():
            semana = int(form.cleaned_data['semana'])
            trm_cotizacion = form.cleaned_data['trm_cotizacion']
            self.save_cotizaciones(form, semana, trm_cotizacion)
            messages.success(request, f'Se han actualizado los precios para la semana {semana} exitosamente.')
            return redirect('cotizacion_etnico')

        presentaciones_data = self.get_presentaciones_data(form)
        return render(request, self.template_name, {'form': form, 'presentaciones_data': presentaciones_data})

    def get_initial(self, semana):
        initial_data = {'trm_cotizacion': CotizacionEtnico.objects.filter(
            semana=semana).first().trm_cotizacion if CotizacionEtnico.objects.filter(semana=semana).exists() else None}
        cotizaciones_semana = CotizacionEtnico.objects.filter(semana=semana)
        for presentacion in Presentacion.objects.all():
            cotizacion = cotizaciones_semana.filter(presentacion=presentacion).first()
            if cotizacion:
                for field in CotizacionEtnico._meta.get_fields():
                    if hasattr(field, 'max_digits'):  # Asumiendo que todos son DecimalFields
                        field_name = f"{field.name}_{presentacion.id}"
                        initial_data[field_name] = getattr(cotizacion, field.name, None)
        return initial_data

    def get_presentaciones_data(self, form):
        presentaciones_data = []
        for presentacion in Presentacion.objects.all():
            campos_presentacion = {}
            for field in CotizacionEtnico._meta.get_fields():
                if hasattr(field, 'max_digits') and field.name != 'trm_cotizacion':  # Excluir trm_cotizacion
                    field_name = f"{field.name}_{presentacion.id}"
                    campos_presentacion[field_name] = form[field_name]

            presentaciones_data.append({
                'objeto': presentacion,
                'campos': campos_presentacion
            })
        return presentaciones_data

    def save_cotizaciones(self, form, semana, trm_cotizacion):
        for presentacion in Presentacion.objects.all():
            cotizacion, _ = CotizacionEtnico.objects.get_or_create(presentacion=presentacion, semana=semana)
            for field in CotizacionEtnico._meta.get_fields():
                if hasattr(field, 'max_digits'):
                    field_name = f"{field.name}_{presentacion.id}"
                    setattr(cotizacion, field.name, form.cleaned_data.get(field_name))
            cotizacion.trm_cotizacion = trm_cotizacion
            cotizacion.save()


# --------------------------------- Cotizador Fieldex ------------------------------------------------------
@method_decorator(login_required, name='dispatch')
@method_decorator(user_passes_test(es_miembro_del_grupo('Fieldex'), login_url=reverse_lazy('home')), name='dispatch')
class ActualizarCotizacionesFieldexView(View):
    form_class = CotizacionForm
    template_name = 'cotizacion_fieldex.html'

    def get(self, request, *args, **kwargs):
        semana = int(request.GET.get('semana', datetime.now().isocalendar()[1]))
        form = self.form_class(initial=self.get_initial(semana))
        presentaciones_data = self.get_presentaciones_data(form)
        field_names = self.get_field_names()
        return render(request, self.template_name, {
            'form': form,
            'presentaciones_data': presentaciones_data,
            'field_names': field_names  # Agregar esto
        })

    def get_field_names(self):
        field_names = []
        for field in CotizacionFieldex._meta.get_fields():
            if hasattr(field, 'max_digits') and field.name != 'trm_cotizacion':  # Excluir trm_cotizacion
                field_names.append(field.verbose_name or field.name)
        return field_names

    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST)
        if form.is_valid():
            semana = int(form.cleaned_data['semana'])
            trm_cotizacion = form.cleaned_data['trm_cotizacion']
            self.save_cotizaciones(form, semana, trm_cotizacion)
            messages.success(request, f'Se han actualizado los precios para la semana {semana} exitosamente.')
            return redirect('cotizacion_fieldex')

        presentaciones_data = self.get_presentaciones_data(form)
        return render(request, self.template_name, {'form': form, 'presentaciones_data': presentaciones_data})

    def get_initial(self, semana):
        initial_data = {'trm_cotizacion': CotizacionFieldex.objects.filter(
            semana=semana).first().trm_cotizacion if CotizacionFieldex.objects.filter(semana=semana).exists() else None}
        cotizaciones_semana = CotizacionFieldex.objects.filter(semana=semana)
        for presentacion in Presentacion.objects.all():
            cotizacion = cotizaciones_semana.filter(presentacion=presentacion).first()
            if cotizacion:
                for field in CotizacionFieldex._meta.get_fields():
                    if hasattr(field, 'max_digits'):  # Asumiendo que todos son DecimalFields
                        field_name = f"{field.name}_{presentacion.id}"
                        initial_data[field_name] = getattr(cotizacion, field.name, None)
        return initial_data

    def get_presentaciones_data(self, form):
        presentaciones_data = []
        for presentacion in Presentacion.objects.all():
            campos_presentacion = {}
            for field in CotizacionFieldex._meta.get_fields():
                if hasattr(field, 'max_digits') and field.name != 'trm_cotizacion':  # Excluir trm_cotizacion
                    field_name = f"{field.name}_{presentacion.id}"
                    campos_presentacion[field_name] = form[field_name]

            presentaciones_data.append({
                'objeto': presentacion,
                'campos': campos_presentacion
            })
        return presentaciones_data

    def save_cotizaciones(self, form, semana, trm_cotizacion):
        for presentacion in Presentacion.objects.all():
            cotizacion, _ = CotizacionFieldex.objects.get_or_create(presentacion=presentacion, semana=semana)
            for field in CotizacionFieldex._meta.get_fields():
                if hasattr(field, 'max_digits'):
                    field_name = f"{field.name}_{presentacion.id}"
                    setattr(cotizacion, field.name, form.cleaned_data.get(field_name))
            cotizacion.trm_cotizacion = trm_cotizacion
            cotizacion.save()


# --------------------------------- Cotizador Juan Matas ------------------------------------------------------
@method_decorator(login_required, name='dispatch')
@method_decorator(user_passes_test(es_miembro_del_grupo('Juan_Matas'), login_url=reverse_lazy('home')), name='dispatch')
class ActualizarCotizacionesJuanView(View):
    form_class = CotizacionForm
    template_name = 'cotizacion_juan.html'

    def get(self, request, *args, **kwargs):
        semana = int(request.GET.get('semana', datetime.now().isocalendar()[1]))
        form = self.form_class(initial=self.get_initial(semana))
        presentaciones_data = self.get_presentaciones_data(form)
        field_names = self.get_field_names()
        return render(request, self.template_name, {
            'form': form,
            'presentaciones_data': presentaciones_data,
            'field_names': field_names  # Agregar esto
        })

    def get_field_names(self):
        field_names = []
        for field in CotizacionJuan._meta.get_fields():
            if hasattr(field, 'max_digits') and field.name != 'trm_cotizacion':  # Excluir trm_cotizacion
                field_names.append(field.verbose_name or field.name)
        return field_names

    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST)
        if form.is_valid():
            semana = int(form.cleaned_data['semana'])
            trm_cotizacion = form.cleaned_data['trm_cotizacion']
            self.save_cotizaciones(form, semana, trm_cotizacion)
            messages.success(request, f'Se han actualizado los precios para la semana {semana} exitosamente.')
            return redirect('cotizacion_juan')

        presentaciones_data = self.get_presentaciones_data(form)
        return render(request, self.template_name, {'form': form, 'presentaciones_data': presentaciones_data})

    def get_initial(self, semana):
        initial_data = {'trm_cotizacion': CotizacionJuan.objects.filter(
            semana=semana).first().trm_cotizacion if CotizacionJuan.objects.filter(semana=semana).exists() else None}
        cotizaciones_semana = CotizacionJuan.objects.filter(semana=semana)
        for presentacion in Presentacion.objects.all():
            cotizacion = cotizaciones_semana.filter(presentacion=presentacion).first()
            if cotizacion:
                for field in CotizacionJuan._meta.get_fields():
                    if hasattr(field, 'max_digits'):  # DecimalFields
                        field_name = f"{field.name}_{presentacion.id}"
                        initial_data[field_name] = getattr(cotizacion, field.name, None)
        return initial_data

    def get_presentaciones_data(self, form):
        presentaciones_data = []
        for presentacion in Presentacion.objects.all():
            campos_presentacion = {}
            for field in CotizacionJuan._meta.get_fields():
                if hasattr(field, 'max_digits') and field.name != 'trm_cotizacion':  # Excluir trm_cotizacion
                    field_name = f"{field.name}_{presentacion.id}"
                    campos_presentacion[field_name] = form[field_name]

            presentaciones_data.append({
                'objeto': presentacion,
                'campos': campos_presentacion
            })
        return presentaciones_data

    def save_cotizaciones(self, form, semana, trm_cotizacion):
        for presentacion in Presentacion.objects.all():
            cotizacion, _ = CotizacionJuan.objects.get_or_create(presentacion=presentacion, semana=semana)
            for field in CotizacionJuan._meta.get_fields():
                if hasattr(field, 'max_digits'):
                    field_name = f"{field.name}_{presentacion.id}"
                    setattr(cotizacion, field.name, form.cleaned_data.get(field_name))
            cotizacion.trm_cotizacion = trm_cotizacion
            cotizacion.save()


# //// -------------------- Comparador De Cotizaciones ---------------------------------------- /////

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def comparar_precios_view(request):
    form = ComparacionPreciosForm(request.GET or None)
    comparaciones = {}
    campo_seleccionado = None

    if form.is_valid():
        presentacion = form.cleaned_data['presentacion']
        semana = form.cleaned_data['semana']
        campo_seleccionado = form.cleaned_data['tipo_comparacion']

        # Obtener los datos de los modelos
        datos = {
            'Etnico': CotizacionEtnico.objects.filter(presentacion=presentacion, semana=semana).first(),
            'Fieldex': CotizacionFieldex.objects.filter(presentacion=presentacion, semana=semana).first(),
            'Juan Matas': CotizacionJuan.objects.filter(presentacion=presentacion, semana=semana).first(),
        }

        for modelo, obj in datos.items():
            if obj:
                comparaciones[modelo] = {
                    'presentacion': obj.presentacion,
                    'semana': obj.semana,
                    'campo_seleccionado': getattr(obj, campo_seleccionado, None)
                }

    return render(request, 'comparador_cotizaciones.html', {
        'form': form,
        'comparaciones': comparaciones,
        'campo_seleccionado': campo_seleccionado
    })
