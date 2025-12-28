from django.contrib import admin
from django.shortcuts import render
from django.urls import path, include
from django.contrib.sitemaps.views import sitemap
from autenticacion.sitemaps import LandingPageSitemap # Adjust import if sitemaps.py is elsewhere
from django.conf import settings
from django.conf.urls.static import static
from autenticacion.views import LandingPageView, EnglishLandingPageView
from django.contrib.sitemaps.views import sitemap # Import sitemap view
from django.views.generic.base import TemplateView # Import TemplateView

sitemaps = {
    'landing': LandingPageSitemap,
    # Add other sitemaps here if you have them
}

urlpatterns = [
    path('admin/', admin.site.urls),
    path('autenticacion/', include('autenticacion.urls')),
    path('comercial/', include('comercial.urls')),
    path('inventarios/', include('inventarios.urls')),
    path('nacionales/', include('nacionales.urls')),
    path('', LandingPageView.as_view(), name='landing_page'),
    path('en/', EnglishLandingPageView.as_view(), name='english_landing_page'),  # Add English version URL
    path('captcha/', include('captcha.urls')),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'), # Sitemap URL
    path("robots.txt", TemplateView.as_view(template_name="robots.txt", content_type="text/plain")), # robots.txt URL
]

# Agregar estas líneas para servir archivos de medios tanto en desarrollo como en producción
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # En producción, Whitenoise servirá los archivos estáticos y de medios
    # pero necesitamos agregar un patrón para la URL de medios
    from django.views.static import serve
    urlpatterns += [
        path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
    ]

def custom_404(request, exception):
    return render(request, '404.html', status=404)


# Asignar el handler para 404
handler404 = 'mysite.urls.custom_404'
