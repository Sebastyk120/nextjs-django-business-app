def actualizar_tasa_representativa(self):
    # Si fecha_monetizacion es None, establecer tasa_representativa_usd_diaria a 0 y salir
    if self.fecha_monetizacion is None:
        self.tasa_representativa_usd_diaria = 0
        self.save()
        return

    url = "https://www.datos.gov.co/resource/mcec-87by.json"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        df = pd.DataFrame(data)

        # Convertir las columnas de fecha a datetime
        df['vigenciadesde'] = pd.to_datetime(df['vigenciadesde'])

        # Ordenar los datos por la fecha de inicio de vigencia
        df = df.sort_values('vigenciadesde')

        # Encontrar la tasa correcta
        fecha_monetizacion = pd.to_datetime(self.fecha_monetizacion)
        df_filtrado = df[df['vigenciadesde'] <= fecha_monetizacion]
        if not df_filtrado.empty:
            tasa_valor = df_filtrado.iloc[-1]['valor']
            self.tasa_representativa_usd_diaria = tasa_valor
            self.save()
    else:
        print("Error al acceder a la URL")