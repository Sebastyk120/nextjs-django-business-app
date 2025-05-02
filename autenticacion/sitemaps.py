from django.contrib.sitemaps import Sitemap
from django.urls import reverse

class StaticViewSitemap(Sitemap):
    priority = 0.9
    changefreq = 'weekly'

    def items(self):
        # Return a list of named URL patterns for your static pages
        return ['landing_page']

    def location(self, item):
        return reverse(item)
