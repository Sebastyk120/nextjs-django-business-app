from django.contrib import admin
from django.urls import path
from . import views, views2, views_proyec_vent, views4_dash_comer, views_export

urlpatterns = [
    path("admin/", admin.site.urls),
    path('redirect_based_on_group', views.redirect_based_on_group_pedidos, name='redirect_based_on_group'),
    path('redirect_based_on_group_cartera', views.redirect_based_on_group_cartera, name='redirect_based_on_group_cartera'),

    path('pedido_detalles/<int:pedido_id>', views.DetallePedidoListView.as_view(), name='pedido_detalle_list'),
    path('pedido_list_general', views.PedidoListView.as_view(), name='pedido_list_general'),
    path('seguimiento_pedido_list_general', views.SeguimientosPedidosListView.as_view(), name='seguimiento_pedido_list_general'),
    path('pedido_crear', views.PedidoCreateView.as_view(), name='pedido_crear'),
    path('pedido_editar', views.PedidoUpdateView.as_view(), name='pedido_editar'),
    path('pedido_editar2', views.PedidoUpdateViewDos.as_view(), name='pedido_editar2'),
    path('pedido_editar_cartera', views.PedidoUpdateViewCartera.as_view(), name='pedido_editar_cartera'),
    path('pedido_editar_utilidades', views.PedidoUpdateViewUtilidades.as_view(), name='pedido_editar_utilidades'),
    path('pedido_eliminar', views.PedidoDeleteView.as_view(), name='pedido_eliminar'),
    path('detalle_pedido_crear/<int:pedido_id>', views.DetallePedidoCreateView.as_view(), name='detalle_pedido_crear'),
    path('detalle_pedido_editar', views.DetallePedidoUpdateView.as_view(), name='detalle_pedido_editar'),
    path('detalle_pedido_editar2', views.DetallePedidoUpdateDosView.as_view(), name='detalle_pedido_editar2'),
    path('detalle_pedido_editar3', views.DetallePedidoUpdateTresView.as_view(), name='detalle_pedido_editar3'),
    path('detalle_pedido_eliminar', views.DetallePedidoDeleteiew.as_view(), name='detalle_pedido_eliminar'),
    path('pedido_list_etnico', views.PedidoEtnicoListView.as_view(), name='pedido_list_etnico'),
    path('pedido_list_fieldex', views.PedidoFieldexListView.as_view(), name='pedido_list_fieldex'),
    path('pedido_list_juan', views.PedidoJuanListView.as_view(), name='pedido_list_juan'),

    path('pedido_list_ci_dorado', views.PedidoCiDoradoListView.as_view(), name='pedido_list_ci_dorado'),

    path('pedido_editar_exportador', views.PedidoExportadorUpdateView.as_view(), name='pedido_editar_exportador'),
    path('pedido_editar_seguimiento', views.PedidoUpdateSebguimientoView.as_view(), name='pedido_editar_seguimiento'),
    path('cartera_list_heavens', views.CarteraHeavensListView.as_view(), name='cartera_list_heavens'),
    path('resumen_seguimiento_list_heavens', views.ResumenSeguimientosPedidosListView.as_view(), name='resumen_seguimiento_list_heavens'),
    path('cartera_list_etnico', views.CarteraEtnicoListView.as_view(), name='cartera_list_etnico'),
    path('cartera_list_fieldex', views.CarteraFieldexListView.as_view(), name='cartera_list_fieldex'),
    path('cartera_list_juan', views.CarteraJuanListView.as_view(), name='cartera_list_juan'),
    path('cartera_list_ci_dorado', views.CarteraCiDoradoListView.as_view(), name='cartera_list_ci_dorado'),
    path('exportar_cartera_cliente', views.ExportarCarteraClienteView.as_view(), name='exportar_cartera_cliente'),
    path('exportar_cartera_cliente_antigua', views.ExportarCarteraClienteVistaAntiguaView.as_view(), name='exportar_cartera_cliente_antigua'),
    path('exportar_cartera_cliente_enviar', views.ExportarCarteraClienteEnviarView.as_view(), name='exportar_cartera_cliente_enviar'),
    path('exportar_pedidos_excel_general', views_export.exportar_pedidos_excel_general, name='exportar_pedidos_excel_general'),

    path('exportar_excel_seguimiento_tracking', views.exportar_excel_seguimiento_tracking, name='exportar_excel_seguimiento_tracking'),

    path('utilidad_list_heavens', views.UtilidadHeavensListView.as_view(), name='utilidad_list_heavens'),
    path('utilidad_list_etnico', views.UtilidadEtnicoListView.as_view(), name='utilidad_list_etnico'),
    path('utilidad_list_fieldex', views.UtilidadFiedexListView.as_view(), name='utilidad_list_fieldex'),
    path('utilidad_list_juan', views.UtilidadJuanListView.as_view(), name='utilidad_list_juan'),
    path('utilidad_list_ci_dorado', views.UtilidadCiDoradoListView.as_view(), name='utilidad_list_ci_dorado'),
    path('exportar_utilidades_general', views_export.exportar_utilidades_excel, name='exportar_utilidades_general'),



    path('exportar_detalles_p_heavens', views.exportar_detalles_pedidos_excel, name='exportar_detalles_p_heavens'),
    path('pedido_resumen/<int:pedido_id>', views.ResumenPedidoListView.as_view(), name='pedido_resumen'),
    path('referencia_list_etnico', views.ReferenciasEtnicoListView.as_view(), name='referencia_list_etnico'),
    path('referencia_list_fieldex', views.ReferenciasFieldexListView.as_view(), name='referencia_list_fieldex'),
    path('referencia_list_juan', views.ReferenciasjuanListView.as_view(), name='referencia_list_juan'),
    path('referencia_list_ci_dorado', views.ReferenciasCiDoradoListView.as_view(), name='referencia_list_ci_dorado'),
    path('referencia_editar_general', views.ReferenciaUpdateView.as_view(), name='referencia_editar_general'),
    path('exportar_referencias_excel', views.exportar_referencias_excel, name='exportar_referencias_excel'),

    path('actualizar_vencimiento_general/', views.actualizar_dias_de_vencimiento_todos, name='actualizar_dias_de_vencimiento_todos'),
    path('actualizar_tasas_general/', views.actualizar_tasas, name='actualizar_tasas'),

    path('actualizar_vencimiento_etnico/', views.actualizar_dias_de_vencimiento_etnico, name='actualizar_vencimiento_etnico'),
    path('actualizar_tasas_etnico/', views.actualizar_tasas_etnico, name='actualizar_tasas_etnico'),
    path('actualizar_vencimiento_fieldex/', views.actualizar_dias_de_vencimiento_fieldex, name='actualizar_vencimiento_fieldex'),
    path('actualizar_vencimiento_ci_dorado/', views.actualizar_dias_de_vencimiento_ci_dorado, name='actualizar_vencimiento_ci_dorado'),

    path('actualizar_tasas_fieldex/', views.actualizar_tasas_fieldex, name='actualizar_tasas_fieldex'),
    path('actualizar_vencimiento_juan/', views.actualizar_dias_de_vencimiento_juan, name='actualizar_vencimiento_juan'),
    path('actualizar_tasas_juan/', views.actualizar_tasas_juan, name='actualizar_tasas_juan'),
    path('actualizar_tasas_ci_dorado/', views.actualizar_tasas_ci_dorado, name='actualizar_tasas_ci_dorado'),
    path('pedido/<int:pedido_id>/cancelacion/', views.solicitar_cancelacion, name='solicitar_cancelacion'),
    path('autorizacion/<int:autorizacion_id>/autorizar/', views.autorizar_cancelacion, name='autorizar_cancelacion'),
    path('filtrar_presentaciones/', views.filtrar_presentaciones, name='filtrar_presentaciones'),
    path('ajax/load-referencias/', views.load_referencias, name='ajax_load_referencias'),

    path('exportar_resumen_semana_pdf/', views.export_pdf_resumen_semana, name='exportar_resumen_semana_pdf'),
    path('pedido_resumen_pdf/<int:pedido_id>', views.exportar_pdf_resumen_pedido, name='pedido_resumen_pdf'),
    path('exportar_excel_seguimientos_resumen/', views.exportar_excel_seguimiento_resumen, name='exportar_excel_seguimientos_resumen'),
    path('dashboard_comercial/', views4_dash_comer.dashboard_comercial, name='dashboard_comercial'),
    path('dashboard_cliente/', views2.dashboard_cliente, name='dashboard_cliente'),
    path('dashboard_cliente/exportar/', views2.exportar_cartera_cliente_dashboard, name='exportar_cartera_cliente_dashboard'),
    path('exportar-dashboard-comercial/', views4_dash_comer.exportar_dashboard_comercial, name='exportar_dashboard_comercial'),
    
    # Dashboard y proyección de ventas
    path('proyeccion-ventas/', views_proyec_vent.proyeccion_ventas, name='proyeccion_ventas'),
    path('api/proyeccion-ventas/', views_proyec_vent.proyeccion_ventas_api, name='proyeccion_ventas_api'),
]
