from datetime import datetime

import requests
from django.test import TestCase


# Create your tests here.

def actualizar_tasa_representativa(pedido):
    # Realizar la solicitud HTTP
    response = requests.get("https://www.datos.gov.co/resource/mcec-87by.json")
    data = response.json()

    # Encontrar el valor correcto
    fecha_entrega = pedido.fecha_entrega
    valor_trm = None
    for item in data:
        vigencia_desde = datetime.strptime(item["vigenciadesde"].split("T")[0], "%Y-%m-%d").date()
        if vigencia_desde <= fecha_entrega:
            valor_trm = item["valor"]
            break

    # Actualizar el modelo Pedido
    if valor_trm:
        pedido.tasa_representativa_usd_diaria = valor_trm
        pedido.save()


actualizar_tasa_representativa(1)
