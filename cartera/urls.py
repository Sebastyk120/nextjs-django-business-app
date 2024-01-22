from django.urls import path
from . import views

urlpatterns = [
    path('cotizacion_etnico', views.ActualizarCotizacionesEtnicoView.as_view(), name='cotizacion_etnico'),
    path('cotizacion_fieldex', views.ActualizarCotizacionesFieldexView.as_view(), name='cotizacion_fieldex'),
    path('cotizacion_juan', views.ActualizarCotizacionesJuanView.as_view(), name='cotizacion_juan'),
    path('comparador_cotizaciones', views.comparar_precios_view, name='comparador_cotizaciones')
]
