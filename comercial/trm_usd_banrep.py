import requests
import pandas as pd

# URL del JSON
url = "https://www.datos.gov.co/resource/mcec-87by.json"

# Hacer la solicitud GET para obtener el contenido
response = requests.get(url)

# Verificar que la solicitud fue exitosa
if response.status_code == 200:
    # Parsear el contenido JSON
    data = response.json()

    # Convertir a DataFrame de pandas
    df = pd.DataFrame(data)

    # Mostrar las primeras filas del DataFrame
    print(df.head())
else:
    print("Error al acceder a la URL")
