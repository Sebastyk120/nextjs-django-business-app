from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from simple_history.models import HistoricalRecords
from comercial.models import Presentacion, Cliente, Pedido, Exportador


class CotizacionEtnico(models.Model):
    presentacion = models.ForeignKey(Presentacion, on_delete=models.CASCADE)
    semana = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(56)], verbose_name="Semana")
    trm_cotizacion = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                         verbose_name="TRM Cotizacion", null=True, blank=True)
    precio_fob = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$FOB")
    comi_fob = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com FOB")
    precio_dxb = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$DXB")
    comi_dxb = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com DXB")
    precio_doh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$DOH")
    comi_doh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com DOH")
    precio_bah = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$BAH")
    comi_bah = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com BAH")
    precio_kwi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$KWI")
    comi_kwi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com KWI")
    precio_ruh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$RUH")
    comi_ruh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com RUH")
    precio_jed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$JED")
    comi_jed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com JED")
    precio_svo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$SVO")
    comi_svo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com SVO")
    precio_lhr = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$LHR")
    comi_lhr = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com LHR")
    precio_ams = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$AMS")
    comi_ams = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com AMS")
    precio_mad = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$MAD")
    comi_mad = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com MAD")
    precio_mxp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$MXP")
    comi_mxp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com MXP")
    precio_vko = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$VKO")
    comi_vko = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com VKO")
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.presentacion} - semana: {self.semana}"


class CotizacionFieldex(models.Model):
    presentacion = models.ForeignKey(Presentacion, on_delete=models.CASCADE)
    semana = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(56)], verbose_name="Semana")
    trm_cotizacion = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                         verbose_name="TRM Cotizacion", null=True, blank=True)
    precio_fob = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$FOB")
    comi_fob = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com FOB")
    precio_dxb = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$DXB")
    comi_dxb = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com DXB")
    precio_doh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$DOH")
    comi_doh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com DOH")
    precio_bah = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$BAH")
    comi_bah = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com BAH")
    precio_kwi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$KWI")
    comi_kwi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com KWI")
    precio_ruh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$RUH")
    comi_ruh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com RUH")
    precio_jed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$JED")
    comi_jed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com JED")
    precio_svo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$SVO")
    comi_svo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com SVO")
    precio_lhr = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$LHR")
    comi_lhr = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com LHR")
    precio_ams = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$AMS")
    comi_ams = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com AMS")
    precio_mad = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$MAD")
    comi_mad = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com MAD")
    precio_mxp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$MXP")
    comi_mxp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com MXP")
    precio_vko = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$VKO")
    comi_vko = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com VKO")
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.presentacion} - semana: {self.semana}"


class CotizacionJuan(models.Model):
    presentacion = models.ForeignKey(Presentacion, on_delete=models.CASCADE)
    semana = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(56)], verbose_name="Semana")
    trm_cotizacion = models.DecimalField(validators=[MinValueValidator(0)], max_digits=10, decimal_places=2,
                                         verbose_name="TRM Cotizacion", null=True, blank=True)
    precio_fob = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$FOB")
    comi_fob = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com FOB")
    precio_dxb = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$DXB")
    comi_dxb = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com DXB")
    precio_doh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$DOH")
    comi_doh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com DOH")
    precio_bah = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$BAH")
    comi_bah = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com BAH")
    precio_kwi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$KWI")
    comi_kwi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com KWI")
    precio_ruh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$RUH")
    comi_ruh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com RUH")
    precio_jed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$JED")
    comi_jed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com JED")
    precio_svo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$SVO")
    comi_svo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com SVO")
    precio_lhr = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$LHR")
    comi_lhr = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com LHR")
    precio_ams = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$AMS")
    comi_ams = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com AMS")
    precio_mad = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$MAD")
    comi_mad = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com MAD")
    precio_mxp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$MXP")
    comi_mxp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com MXP")
    precio_vko = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="$VKO")
    comi_vko = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Com VKO")
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.presentacion} - semana: {self.semana}"
