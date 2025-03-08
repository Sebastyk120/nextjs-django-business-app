from django.db import models
from choices import origen_nacional

# Create your models here.
class CompraNacional(models.Model):
    origen_compra = models.CharField(max_length=20 , choices=origen_nacional, verbose_name="Origen")
    numero_guia = models.CharField(max_length=20, verbose_name="Numero Guia", unique=True)
    