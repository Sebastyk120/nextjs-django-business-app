from django.contrib import admin
from django.urls import path
from . import views, views2, views_report_prov, views_api

urlpatterns = [
    path("admin/", admin.site.urls),
    path('nacionales_list_general', views.nacionales_list_general, name='nacionales_list_general'),
    path('autocomplete_guia/', views2.autocomplete_guia, name='autocomplete_guia'),
    path('nacionales_list_detallada', views.nacionales_list_detallada, name='nacionales_list_detallada'),
    path('compra/create/', views.compra_nacional_create, name='compra_nacional_create'),
    path('venta/create/<int:compra_id>/', views.venta_nacional_create, name='venta_nacional_create'),
    path('reporte-exp/create/<int:venta_id>/', views.reporte_exportador_create, name='reporte_exportador_create'),
    path('reporte-prov/create/<int:reporte_exp_id>/', views.reporte_proveedor_create, name='reporte_proveedor_create'),
    # Nuevas URLs para edición
    path('compra_nacional/edit/<int:pk>/', views.compra_nacional_edit, name='compra_nacional_edit'),
    path('venta_nacional/edit/<int:pk>/', views.venta_nacional_edit, name='venta_nacional_edit'),
    path('reporte_exportador/edit/<int:pk>/', views.reporte_exportador_edit, name='reporte_exportador_edit'),
    path('reporte_proveedor/edit/<int:pk>/', views.reporte_proveedor_edit, name='reporte_proveedor_edit'),

    path('transferencias/', views.TransferenciasListView.as_view(), name='transferencias_list'),
    path('transferencia/create/', views.transferencia_nacional_create, name='transferencia_nacional_create'),
    path('transferencia/edit/<int:pk>/', views.transferencia_nacional_edit, name='transferencia_nacional_edit'),
    path('dashboard_nacionales/', views2.dashboard_nacionales, name='dashboard_nacionales'),
    path('export_data/', views.export_data, name='export_data'),
    path('estado-cuenta/<int:proveedor_id>/', views.estado_cuenta_proveedor, name='estado_cuenta_proveedor'),
    path('relacion_facturas_vencidas/', views2.relacion_facturas_vencidas, name='relacion_facturas_vencidas'),
    path('relacion_reportes_vencidos/', views2.relacion_reportes_vencidos, name='relacion_reportes_vencidos'),
    path('reporte_estado_cuenta_proveedor/<int:proveedor_id>/', views_report_prov.reporte_cuenta_proveedor, name='reporte_estado_cuenta_proveedor'),
    path('reporte-individual/', views2.reporte_individual_proveedor, name='reporte_individual_proveedor'),  # Nueva URL sin parámetro de ID
    # Mantener la antigua URL por compatibilidad
    path('reporte-individual/<int:reporte_id>/', views2.reporte_individual_proveedor, name='reporte_individual_proveedor_legacy'),

    # API endpoints
    path('api/balance-proveedores/', views_api.api_balance_proveedores, name='api_balance_proveedores'),
]