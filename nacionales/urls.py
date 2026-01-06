from django.urls import path, include
from . import views, views2, views_report_prov, views_api, views_estado_cuenta_proveedor, views_analisis_calidad, api_nacionales
from .api_nacionales import DashboardNacionalesAPIView
from rest_framework.routers import DefaultRouter

# DRF Router for API endpoints
router = DefaultRouter()
router.register(r'api/compra', api_nacionales.CompraNacionalViewSet, basename='api_compra_nacional')
router.register(r'api/venta', api_nacionales.VentaNacionalViewSet, basename='api_venta_nacional')
router.register(r'api/reporte-exp', api_nacionales.ReporteCalidadExportadorViewSet, basename='api_reporte_exportador')
router.register(r'api/reporte-prov', api_nacionales.ReporteCalidadProveedorViewSet, basename='api_reporte_proveedor')
router.register(r'api/proveedores', api_nacionales.ProveedorNacionalViewSet, basename='api_proveedor_nacional')
router.register(r'api/empaques', api_nacionales.EmpaqueViewSet, basename='api_empaque_nacional')
router.register(r'api/transferencias', api_nacionales.TransferenciasProveedorViewSet, basename='api_transferencias')

urlpatterns = [
    # Include DRF router URLs
    path('', include(router.urls)),
    
    path('nacionales_list_general', views.nacionales_list_general, name='nacionales_list_general'),
    path('autocomplete_guia/', views2.autocomplete_guia, name='autocomplete_guia'),
    path('autocomplete_factura/', views2.autocomplete_factura, name='autocomplete_factura'),
    path('autocomplete_remision/', views2.autocomplete_remision, name='autocomplete_remision'),
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
    path('estado-cuenta/<int:proveedor_id>/', views_estado_cuenta_proveedor.estado_cuenta_proveedor, name='estado_cuenta_proveedor'),
    path('relacion_facturas_vencidas/', views2.relacion_facturas_vencidas, name='relacion_facturas_vencidas'),
    path('relacion_reportes_vencidos/', views2.relacion_reportes_vencidos, name='relacion_reportes_vencidos'),
    path('reporte_estado_cuenta_proveedor/<int:proveedor_id>/', views_report_prov.reporte_cuenta_proveedor, name='reporte_estado_cuenta_proveedor'),
    path('reporte-individual/', views2.reporte_individual_proveedor, name='reporte_individual_proveedor'),  # Nueva URL sin parámetro de ID
    # Mantener la antigua URL por compatibilidad
    path('reporte-individual/<int:reporte_id>/', views2.reporte_individual_proveedor, name='reporte_individual_proveedor_legacy'),

    # Nueva URL para Análisis de Calidad
    path('analisis-calidad/', views_analisis_calidad.analisis_calidad_view, name='analisis_calidad'),
    path('exportar-excel-analisis-calidad/', views_analisis_calidad.exportar_excel_analisis_calidad, name='exportar_excel_analisis_calidad'),

    # API endpoints
    path('api/dashboard/', DashboardNacionalesAPIView.as_view(), name='api_dashboard_nacionales'),
    path('api/balance-proveedores/', views_api.api_balance_proveedores, name='api_balance_proveedores'),
    path('api/get-reporte-detalle/', views_analisis_calidad.get_reporte_detalle, name='get_reporte_detalle'),
    path('api/reporte-individual/', api_nacionales.reporte_individual_api, name='api_reporte_individual'),
    path('api/guias/autocomplete/', api_nacionales.guias_autocomplete_api, name='api_guias_autocomplete'),
    path('api/reportes-vencidos/', api_nacionales.reportes_vencidos_api, name='api_reportes_vencidos'),
]
