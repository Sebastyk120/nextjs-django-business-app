from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import datetime, timedelta
from comercial.models import Pedido, DetallePedido, Cliente, Fruta, Exportador, Presentacion, TipoCaja, Referencias

class ProyeccionVentasAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password')
        self.client.force_authenticate(user=self.user)
        
        # Setup basic data
        self.cliente = Cliente.objects.create(nombre="Test Client", negociaciones_cartera=30)
        self.fruta = Fruta.objects.create(nombre="Test Fruit")
        self.exportador = Exportador.objects.create(nombre="Test Explorer")
        
        self.presentacion = Presentacion.objects.create(nombre="Test Pres", kilos=10.0)
        self.tipo_caja = TipoCaja.objects.create(nombre="Test Caja")
        self.referencia = Referencias.objects.create(
            nombre="Test Ref", 
            exportador=self.exportador, 
            porcentaje_peso_bruto=10.0,
            cantidad_pallet_sin_contenedor=100,
            cantidad_pallet_con_contenedor=100
        )
        
        # Create some historical orders (last year)
        last_year = datetime.now() - timedelta(days=365)
        for i in range(5):
            fecha = last_year + timedelta(days=i*30)
            pedido = Pedido.objects.create(
                cliente=self.cliente,
                exportadora=self.exportador, 
                fecha_entrega=fecha,
                # Add other required fields if any, assume defaults or allow nulls
            )
            DetallePedido.objects.create(
                pedido=pedido,
                fruta=self.fruta,
                presentacion=self.presentacion,
                tipo_caja=self.tipo_caja,
                referencia=self.referencia,
                cajas_solicitadas=100,
                lleva_contenedor=False,
                kilos_enviados=1000 + i*100,
                cajas_enviadas=100 + i*10,
                valor_x_producto=5000 + i*500
            )

    def test_proyeccion_api_structure(self):
        url = reverse('proyeccion_ventas_api_v2')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Check top level keys
        self.assertIn('summary_metrics', data)
        self.assertIn('historical_data', data)
        self.assertIn('forecast_data', data)
        self.assertIn('seasonal_patterns', data)
        self.assertIn('model_metadata', data)
        
        # Check metrics structure
        self.assertIn('historical', data['summary_metrics'])
        self.assertIn('forecast', data['summary_metrics'])
        
        # Check forecast data items
        if data['forecast_data']:
            item = data['forecast_data'][0]
            self.assertIn('fecha', item)
            self.assertIn('kilos', item)
            self.assertIn('cajas', item)
            self.assertIn('valor', item)
            # Verify confidence intervals exist (even if 0)
            self.assertIn('kilos_lower', item)
            self.assertIn('kilos_upper', item)

    def test_with_filters(self):
        url = reverse('proyeccion_ventas_api_v2')
        response = self.client.get(url, {'forecast_months': 6, 'cliente_id': self.cliente.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
