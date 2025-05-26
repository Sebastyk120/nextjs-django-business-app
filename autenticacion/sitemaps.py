from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.conf import settings # Import settings

class LandingPageSitemap(Sitemap):
    priority = 0.9
    changefreq = 'weekly'
    protocol = 'https' # Or 'http' if you are not using HTTPS

    def items(self):
        # Return a list of tuples: (name_of_url, language_code)
        return [
            ('landing_page', 'es'),
            ('landing_page_en', 'en'),
        ]

    def location(self, item):
        # item will be ('landing_page', 'es') or ('landing_page_en', 'en')
        return reverse(item[0])

    def alternates(self, item):
        # item will be ('landing_page', 'es') or ('landing_page_en', 'en')
        # For the Spanish page, the alternate is the English page
        # For the English page, the alternate is the Spanish page
        alternates = []
        if item[0] == 'landing_page': # Current item is Spanish page
            alternates.append({
                'location': reverse('landing_page_en'),
                'lang_code': 'en',
            })
        elif item[0] == 'landing_page_en': # Current item is English page
            alternates.append({
                'location': reverse('landing_page'),
                'lang_code': 'es',
            })
        return alternates

    # If you need to get the domain from settings (e.g. if request is not available)
    # you might need to adjust how you build the full URL if reverse() doesn't include the domain.
    # However, Django's sitemap framework usually handles this if SITE_ID is set
    # and the Sites framework is configured with the correct domain for SITE_ID = 1.

# You would then register this sitemap in your project's main urls.py
