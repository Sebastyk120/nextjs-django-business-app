from import_export import resources
from .models import CotizacionEtnico, CotizacionFieldex, CotizacionJuan


class CotizacionEtnicoResource(resources.ModelResource):
    class Meta:
        model = CotizacionEtnico


class CotizacionFieldexResource(resources.ModelResource):
    class Meta:
        model = CotizacionFieldex


class CotizacionJuanResource(resources.ModelResource):
    class Meta:
        model = CotizacionJuan
