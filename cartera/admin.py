from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import CotizacionEtnico, CotizacionJuan, CotizacionFieldex
from django.urls import reverse
from django.utils.html import format_html
from simple_history.admin import SimpleHistoryAdmin
from .resources import CotizacionFieldexResource, CotizacionJuanResource, CotizacionEtnicoResource
from django.contrib import admin

admin.site.site_header = "Administración Heavens Fruits"
admin.site.site_title = "Administración Heavens"
admin.site.index_title = "Bienvenido al Portal de Administración Heavens"


class CotizacionEtnicoAdmin(ImportExportModelAdmin, SimpleHistoryAdmin):
    resource_class = CotizacionEtnicoResource
    list_display = ['presentacion', 'semana'] + ['view_history']

    def view_history(self, obj):
        url = reverse('admin:%s_%s_history' % (obj._meta.app_label, obj._meta.model_name), args=[obj.pk])
        return format_html('<a href="{}">Historial</a>', url)

    view_history.short_description = "Ver Historial"


class CotizacionJuanAdmin(ImportExportModelAdmin, SimpleHistoryAdmin):
    resource_class = CotizacionJuanResource
    list_display = ['presentacion', 'semana'] + ['view_history']

    def view_history(self, obj):
        url = reverse('admin:%s_%s_history' % (obj._meta.app_label, obj._meta.model_name), args=[obj.pk])
        return format_html('<a href="{}">Historial</a>', url)

    view_history.short_description = "Ver Historial"


class CotizacionFieldexAdmin(ImportExportModelAdmin, SimpleHistoryAdmin):
    resource_class = CotizacionFieldexResource
    list_display = ['presentacion', 'semana'] + ['view_history']

    def view_history(self, obj):
        url = reverse('admin:%s_%s_history' % (obj._meta.app_label, obj._meta.model_name), args=[obj.pk])
        return format_html('<a href="{}">Historial</a>', url)

    view_history.short_description = "Ver Historial"


admin.site.register(CotizacionEtnico, CotizacionEtnicoAdmin)
admin.site.register(CotizacionFieldex, CotizacionFieldexAdmin)
admin.site.register(CotizacionJuan, CotizacionJuanAdmin)
