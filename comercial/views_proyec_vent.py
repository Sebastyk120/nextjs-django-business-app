import json
from datetime import datetime, timedelta
from decimal import Decimal
import numpy as np
import pandas as pd
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render
from comercial.models import Pedido, DetallePedido, Cliente, Fruta, Exportador
import calendar


def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro

@login_required
@user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home')
def proyeccion_ventas(request):
    # Get filter parameters
    fecha_inicio_str = request.GET.get('fecha_inicio')
    fecha_fin_str = request.GET.get('fecha_fin')
    cliente_id = request.GET.get('cliente')
    fruta_id = request.GET.get('fruta')
    exportador_id = request.GET.get('exportador')
    forecast_months = int(request.GET.get('forecast_months', 3))  # Default to 3 months
    
    # Prepare date parameters
    if not fecha_inicio_str:
        # Default to 12 months of historical data for good forecasting
        fecha_inicio = datetime.now().date() - timedelta(days=365)
        fecha_inicio_str = fecha_inicio.strftime('%Y-%m-%d')
    else:
        fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()

    if not fecha_fin_str:
        fecha_fin = datetime.now().date()
        fecha_fin_str = fecha_fin.strftime('%Y-%m-%d')
    else:
        fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
    
    # Calculate start date for forecast
    forecast_start = fecha_fin + timedelta(days=1)
    
    # Get historical data for forecasting
    historical_data = get_historical_sales_data(
        fecha_inicio, 
        fecha_fin, 
        cliente_id, 
        fruta_id, 
        exportador_id
    )
    
    # Generate forecast
    forecast_data = generate_forecast(historical_data, forecast_months)
    
    # Detect seasonal patterns
    seasonal_patterns = detect_seasonal_patterns(historical_data)
    
    # Get top customers, fruits, and exporters for filtering
    clientes = Cliente.objects.filter(pedido__isnull=False).distinct().order_by('nombre')
    frutas = Fruta.objects.filter(
        id__in=DetallePedido.objects.values_list('fruta', flat=True).distinct()
    ).order_by('nombre')
    exportadores = Exportador.objects.filter(
        id__in=Pedido.objects.values_list('exportadora', flat=True).distinct()
    ).order_by('nombre')
    
    # Prepare summary metrics
    summary_metrics = calculate_summary_metrics(historical_data, forecast_data)
    
    # Prepare customer portfolio analysis
    portfolio_changes = analyze_customer_portfolio(historical_data, seasonal_patterns)
    
    # Convert complex data types for template rendering
    def convert_to_serializable(df):
        if df.empty:
            return []
            
        result = []
        for _, row in df.iterrows():
            record = {}
            for key, value in row.items():
                if pd.isna(value):
                    record[key] = None
                elif hasattr(value, 'strftime'):
                    record[key] = value.strftime('%Y-%m-%d')
                elif str(type(value)).find('Period') >= 0:
                    record[key] = str(value)
                elif isinstance(value, Decimal):
                    record[key] = float(value)
                elif isinstance(value, (int, float)):
                    record[key] = float(value) if isinstance(value, float) else value
                else:
                    record[key] = str(value)
            result.append(record)
        return result

    # Process portfolio changes to ensure JSON serializability
    for key in portfolio_changes:
        if isinstance(portfolio_changes[key], list):
            if key in ['declining_customers', 'growing_customers']:
                for item in portfolio_changes[key]:
                    for k, v in item.items():
                        if isinstance(v, (float, np.float64, Decimal)):
                            item[k] = float(v)
    
    # Process summary metrics to ensure all values are JSON serializeable
    for key, value in summary_metrics.items():
        if isinstance(value, (float, np.float64, Decimal)):
            summary_metrics[key] = float(value)
    
    # Serialize data for JavaScript
    historical_data_json = json.dumps(convert_to_serializable(historical_data))
    forecast_data_json = json.dumps(convert_to_serializable(forecast_data))
    
    context = {
        'fecha_inicio': fecha_inicio_str,
        'fecha_fin': fecha_fin_str,
        'cliente_id': cliente_id,
        'fruta_id': fruta_id,
        'exportador_id': exportador_id,
        'forecast_months': forecast_months,
        'forecast_start': forecast_start.strftime('%Y-%m-%d'),
        'forecast_end': (forecast_start + timedelta(days=30*forecast_months-1)).strftime('%Y-%m-%d'),
        
        'clientes': clientes,
        'frutas': frutas,
        'exportadores': exportadores,
        
        # JSON-serialized data for JavaScript
        'historical_data_json': historical_data_json,
        'forecast_data_json': forecast_data_json,
        
        # Original data for template (only used for table display)
        'historical_data': convert_to_serializable(historical_data),
        'forecast_data': convert_to_serializable(forecast_data),
        'summary_metrics': summary_metrics,
        'portfolio_changes': portfolio_changes,
        'seasonal_patterns': seasonal_patterns,
    }
    
    return render(request, 'proyeccion_ventas.html', context)

def get_historical_sales_data(fecha_inicio, fecha_fin, cliente_id=None, fruta_id=None, exportador_id=None):
    """
    Retrieve historical sales data from the database and format as a pandas DataFrame
    with monthly time series data.
    """
    # Build query filters
    filters = Q(pedido__fecha_entrega__range=[fecha_inicio, fecha_fin])
    
    if cliente_id:
        filters &= Q(pedido__cliente_id=cliente_id)
    if fruta_id:
        filters &= Q(fruta_id=fruta_id)
    if exportador_id:
        filters &= Q(pedido__exportadora_id=exportador_id)
    
    # Query for detailed data
    detalles = DetallePedido.objects.filter(filters).select_related(
        'pedido', 'fruta', 'presentacion'
    ).values(
        'pedido__fecha_entrega', 
        'pedido__cliente__nombre',
        'fruta__nombre',
        'presentacion__nombre',
        'kilos_enviados', 
        'cajas_enviadas',
        'valor_x_producto'
    )
    
    # Convert to DataFrame
    if not detalles:
        return pd.DataFrame()
    
    df = pd.DataFrame(list(detalles))
    
    # Rename columns for clarity
    df = df.rename(columns={
        'pedido__fecha_entrega': 'fecha', 
        'pedido__cliente__nombre': 'cliente',
        'fruta__nombre': 'fruta',
        'presentacion__nombre': 'presentacion'
    })
    
    # Convert to datetime
    df['fecha'] = pd.to_datetime(df['fecha'])
    
    # Add month-year column for aggregation
    df['mes_año'] = df['fecha'].dt.to_period('M')
    
    # Aggregate by month, cliente, fruta
    monthly_data = df.groupby(['mes_año', 'cliente', 'fruta']).agg({
        'kilos_enviados': 'sum',
        'cajas_enviadas': 'sum',
        'valor_x_producto': 'sum'
    }).reset_index()
    
    # Convert Period to datetime for easier processing
    monthly_data['fecha'] = monthly_data['mes_año'].dt.to_timestamp()
    
    # Sort by date
    monthly_data = monthly_data.sort_values(['fecha', 'cliente', 'fruta'])
    
    return monthly_data

def generate_forecast(historical_data, forecast_months=3):
    """
    Apply Simple Seasonal Average forecasting with enhanced seasonal pattern detection.
    """
    if historical_data.empty:
        return pd.DataFrame()
    
    # Create a DataFrame to store the forecasts
    all_forecasts = []
    
    # Ensure all numeric columns are properly converted to float
    for col in ['kilos_enviados', 'cajas_enviadas', 'valor_x_producto']:
        if col in historical_data.columns:
            historical_data[col] = pd.to_numeric(historical_data[col], errors='coerce')
    
    # Replace NaN values with 0
    historical_data = historical_data.fillna(0)
    
    # Add year and month columns
    historical_data['year'] = historical_data['fecha'].dt.year
    historical_data['month'] = historical_data['fecha'].dt.month
    
    # Detect seasonal patterns to enhance forecasting
    seasonal_patterns = detect_seasonal_patterns(historical_data)
    seasonal_clients = {client['cliente']: client for client in seasonal_patterns['seasonal_clients']}
    seasonal_fruits = {fruit['fruta']: fruit for fruit in seasonal_patterns['seasonal_fruits']}
    
    # Calculate overall market growth rate from historical data
    market_growth_rates = calculate_market_growth_rates(historical_data)
    default_growth = market_growth_rates.get('overall', 0.02)  # Fallback to 2% if can't calculate
    
    # Get the latest date to start forecasting from
    if not historical_data.empty:
        last_date = historical_data['fecha'].max()
    else:
        return pd.DataFrame()
    
    # Group by cliente and fruta
    for (cliente, fruta), group in historical_data.groupby(['cliente', 'fruta']):
        # Sort by date
        group = group.sort_values('fecha')
        
        # Check if this is a seasonal client-fruit combination
        is_seasonal_client = cliente in seasonal_clients
        is_seasonal_fruit = fruta in seasonal_fruits
        
        # Calculate client-specific growth rate
        client_growth_rate = calculate_client_growth_rate(group, cliente, fruta)
        
        # Use client's growth rate if available, otherwise use market rate with adjustments
        growth_rate = client_growth_rate if client_growth_rate is not None else default_growth
        
        # For strongly seasonal clients, adjust the growth rate to be more conservative
        if is_seasonal_client:
            # More conservative growth for seasonal clients
            growth_rate = max(-0.05, min(growth_rate, 0.08))
        
        # Limit growth rate to reasonable bounds (-10% to +15%)
        growth_rate = max(-0.10, min(growth_rate, 0.15))
        
        # Get latest date for this group
        group_last_date = group['fecha'].max()
        
        # Prepare data for forecasting
        for i in range(1, forecast_months + 1):
            # Calculate the month to forecast
            forecast_date = group_last_date + pd.DateOffset(months=i)
            forecast_year = forecast_date.year
            forecast_month = forecast_date.month
            
            # Check if this month is part of the client's active season
            is_active_month = True  # Default to active
            if is_seasonal_client:
                client_info = seasonal_clients[cliente]
                month_name = calendar.month_name[forecast_month]
                is_active_month = month_name in client_info['active_months']
            
            # For seasonal clients, if forecasting for inactive months, forecast minimal or zero activity
            if is_seasonal_client and not is_active_month:
                # Minimal forecast for inactive season
                forecast_entry = pd.DataFrame({
                    'fecha': [forecast_date],
                    'cliente': [cliente],
                    'fruta': [fruta],
                    'kilos_enviados': [0],  # Zero or minimal volume
                    'cajas_enviadas': [0],
                    'valor_x_producto': [0],
                    'tipo': ['forecast'],
                    'modelo': ['seasonal_inactive_period']
                })
                all_forecasts.append(forecast_entry)
                continue
            
            # Find data from the same month in the previous year (standard approach)
            previous_year_data = group[
                (group['month'] == forecast_month) & 
                (group['year'] == forecast_year - 1)
            ]
            
            if not previous_year_data.empty:
                # DIRECT SEASONAL COMPARISON: use the same month from previous year
                prev_kilos = previous_year_data['kilos_enviados'].iloc[0]
                prev_cajas = previous_year_data['cajas_enviadas'].iloc[0]
                prev_valor = previous_year_data['valor_x_producto'].iloc[0]
                
                # Apply the calculated growth factor
                growth_factor = 1 + growth_rate  # Convert from percentage to multiplier
                
                # Apply compound growth for multi-month forecasts
                compound_growth = growth_factor ** i
                
                model_name = 'seasonal_trend'
                if is_seasonal_client:
                    model_name = 'strong_seasonal_client'
                elif is_seasonal_fruit:
                    model_name = 'seasonal_fruit_trend'
                
                forecast_entry = pd.DataFrame({
                    'fecha': [forecast_date],
                    'cliente': [cliente],
                    'fruta': [fruta],
                    'kilos_enviados': [prev_kilos * compound_growth],
                    'cajas_enviadas': [prev_cajas * compound_growth],
                    'valor_x_producto': [prev_valor * compound_growth],
                    'tipo': ['forecast'],
                    'modelo': [f'{model_name}_{growth_rate:.2%}']
                })
                
                all_forecasts.append(forecast_entry)
            else:

                avg_kilos = group['kilos_enviados'].mean()
                avg_cajas = group['cajas_enviadas'].mean()
                avg_valor = group['valor_x_producto'].mean()
                
                # Try to derive seasonal factors from overall data
                all_seasonal_data = historical_data[historical_data['month'] == forecast_month]
                
                if not all_seasonal_data.empty:
                    # Calculate seasonal factor using all clients for this month
                    overall_avg_kilos = historical_data['kilos_enviados'].mean()
                    overall_avg_cajas = historical_data['cajas_enviadas'].mean()
                    overall_avg_valor = historical_data['valor_x_producto'].mean()
                    
                    month_avg_kilos = all_seasonal_data['kilos_enviados'].mean()
                    month_avg_cajas = all_seasonal_data['cajas_enviadas'].mean()
                    month_avg_valor = all_seasonal_data['valor_x_producto'].mean()
                    
                    # Compute seasonal factors (avoid division by zero)
                    seasonal_factor_kilos = (month_avg_kilos / overall_avg_kilos) if overall_avg_kilos > 0 else 1.0
                    seasonal_factor_cajas = (month_avg_cajas / overall_avg_cajas) if overall_avg_cajas > 0 else 1.0
                    seasonal_factor_valor = (month_avg_valor / overall_avg_valor) if overall_avg_valor > 0 else 1.0
                    
                    # Limit extreme values
                    seasonal_factor_kilos = max(0.7, min(seasonal_factor_kilos, 1.3))
                    seasonal_factor_cajas = max(0.7, min(seasonal_factor_cajas, 1.3))
                    seasonal_factor_valor = max(0.7, min(seasonal_factor_valor, 1.3))
                else:
                    # No seasonal data at all, use neutral factors
                    seasonal_factor_kilos = seasonal_factor_cajas = seasonal_factor_valor = 1.0
                
                # Apply compound growth for each month ahead using the calculated growth rate
                compound_growth = (1 + growth_rate) ** i
                
                model_name = 'seasonal_avg'
                if is_seasonal_client:
                    model_name = 'seasonal_client_avg'
                    # For seasonal clients in active months but without direct comparison,
                    # we can try to enhance the forecast using their seasonal pattern
                    if is_active_month and cliente in seasonal_clients:
                        client_pattern = seasonal_clients[cliente]
                        month_name = calendar.month_name[forecast_month]
                        if month_name in client_pattern['monthly_percentages']:
                            # Adjust based on typical month percentage
                            month_factor = max(0.5, min(client_pattern['monthly_percentages'][month_name] / 10, 1.5))
                            seasonal_factor_kilos *= month_factor
                            seasonal_factor_cajas *= month_factor
                            seasonal_factor_valor *= month_factor
                            model_name = 'seasonal_pattern_enhanced'
                
                forecast_entry = pd.DataFrame({
                    'fecha': [forecast_date],
                    'cliente': [cliente],
                    'fruta': [fruta],
                    'kilos_enviados': [avg_kilos * compound_growth * seasonal_factor_kilos],
                    'cajas_enviadas': [avg_cajas * compound_growth * seasonal_factor_cajas],
                    'valor_x_producto': [avg_valor * compound_growth * seasonal_factor_valor],
                    'tipo': ['forecast'],
                    'modelo': [f'{model_name}_{growth_rate:.2%}']
                })
                
                all_forecasts.append(forecast_entry)
    
    # Combine all forecasts
    if not all_forecasts:
        return pd.DataFrame()
    
    forecast_df = pd.concat(all_forecasts, ignore_index=True)
    forecast_df['mes_año'] = forecast_df['fecha'].dt.to_period('M')
    
    return forecast_df

def calculate_market_growth_rates(historical_data):
    """
    Calculate market-wide growth rates from historical data.
    Returns a dictionary with overall and monthly growth rates.
    """
    if historical_data.empty:
        return {'overall': 0.02}  # Default 2% if no data
    
    # Group by year and month for monthly comparisons
    monthly_totals = historical_data.groupby(['year', 'month']).agg({
        'kilos_enviados': 'sum',
        'valor_x_producto': 'sum'
    }).reset_index()
    
    # Calculate YoY growth rates for each month
    growth_rates = []
    
    # Get list of years
    years = sorted(monthly_totals['year'].unique())
    
    for i in range(1, len(years)):
        current_year = years[i]
        previous_year = years[i-1]
        
        # For each month, calculate growth rate if data exists for both years
        for month in range(1, 13):
            current_data = monthly_totals[(monthly_totals['year'] == current_year) & 
                                          (monthly_totals['month'] == month)]
            
            previous_data = monthly_totals[(monthly_totals['year'] == previous_year) & 
                                           (monthly_totals['month'] == month)]
            
            if not current_data.empty and not previous_data.empty:
                current_kilos = current_data['kilos_enviados'].iloc[0]
                previous_kilos = previous_data['kilos_enviados'].iloc[0]
                
                if previous_kilos > 0:
                    growth_rate = (current_kilos / previous_kilos) - 1
                    growth_rates.append(growth_rate)
    
    # Calculate overall average growth rate
    if growth_rates:
        overall_growth = sum(growth_rates) / len(growth_rates)
        # Limit to reasonable bounds
        overall_growth = max(-0.10, min(overall_growth, 0.15))
    else:
        overall_growth = 0.02  # Default 2% if can't calculate
    
    return {'overall': overall_growth}

def calculate_client_growth_rate(client_data, cliente, fruta):
    """
    Calculate the historical growth rate for a specific client and fruit.
    Returns None if insufficient data.
    """
    if len(client_data) < 4:  # Need at least a few data points
        return None
    
    # Calculate year-over-year growth rates
    growth_rates = []
    
    # Group by year and month
    monthly_data = client_data.groupby(['year', 'month']).agg({
        'kilos_enviados': 'sum',
        'valor_x_producto': 'sum'
    }).reset_index()
    
    # Get unique years
    years = sorted(monthly_data['year'].unique())
    
    if len(years) < 2:  # Need at least two years to calculate growth
        return None
    
    for i in range(1, len(years)):
        current_year = years[i]
        previous_year = years[i-1]
        
        # For each month, calculate growth rate if data exists for both years
        for month in range(1, 13):
            current_data = monthly_data[(monthly_data['year'] == current_year) & 
                                        (monthly_data['month'] == month)]
            
            previous_data = monthly_data[(monthly_data['year'] == previous_year) & 
                                         (monthly_data['month'] == month)]
            
            if not current_data.empty and not previous_data.empty:
                current_kilos = current_data['kilos_enviados'].iloc[0]
                previous_kilos = previous_data['kilos_enviados'].iloc[0]
                
                if previous_kilos > 0:
                    growth_rate = (current_kilos / previous_kilos) - 1
                    growth_rates.append(growth_rate)
    
    # Calculate average growth rate
    if growth_rates:
        avg_growth = sum(growth_rates) / len(growth_rates)
        return avg_growth
    else:
        return None

def calculate_summary_metrics(historical_data, forecast_data):
    """
    Calculate summary metrics for the historical and forecast periods.
    """
    if historical_data.empty or forecast_data.empty:
        return {
            'total_hist_kilos': 0,
            'total_hist_cajas': 0,
            'total_hist_valor': 0,
            'total_forecast_kilos': 0,
            'total_forecast_cajas': 0,
            'total_forecast_valor': 0,
            'growth_kilos': 0,
            'growth_cajas': 0,
            'growth_valor': 0
        }
    
    # Calculate monthly averages for historical data
    hist_monthly_avg = historical_data.groupby('mes_año').agg({
        'kilos_enviados': 'sum',
        'cajas_enviadas': 'sum',
        'valor_x_producto': 'sum'
    }).mean()
    
    # Calculate monthly totals for forecast data
    forecast_monthly = forecast_data.groupby('mes_año').agg({
        'kilos_enviados': 'sum',
        'cajas_enviadas': 'sum',
        'valor_x_producto': 'sum'
    })
    
    # Calculate forecast averages
    forecast_avg = forecast_monthly.mean()
    
    # Calculate growth percentages
    growth_kilos = ((forecast_avg['kilos_enviados'] / hist_monthly_avg['kilos_enviados']) - 1) * 100 \
        if hist_monthly_avg['kilos_enviados'] > 0 else 0
    growth_cajas = ((forecast_avg['cajas_enviadas'] / hist_monthly_avg['cajas_enviadas']) - 1) * 100 \
        if hist_monthly_avg['cajas_enviadas'] > 0 else 0
    growth_valor = ((forecast_avg['valor_x_producto'] / hist_monthly_avg['valor_x_producto']) - 1) * 100 \
        if hist_monthly_avg['valor_x_producto'] > 0 else 0
    
    return {
        'total_hist_kilos': historical_data['kilos_enviados'].sum(),
        'total_hist_cajas': historical_data['cajas_enviadas'].sum(),
        'total_hist_valor': historical_data['valor_x_producto'].sum(),
        'total_forecast_kilos': forecast_data['kilos_enviados'].sum(),
        'total_forecast_cajas': forecast_data['cajas_enviadas'].sum(),
        'total_forecast_valor': forecast_data['valor_x_producto'].sum(),
        'growth_kilos': growth_kilos,
        'growth_cajas': growth_cajas,
        'growth_valor': growth_valor
    }

def analyze_customer_portfolio(historical_data, seasonal_patterns=None):
    """
    Analyze changes in customer portfolio over time.
    Identifies new customers, lost customers, and changes in purchase patterns.
    Includes seasonal patterns in the analysis when available.
    """
    if historical_data.empty:
        return {
            'new_customers': [],
            'lost_customers': [],
            'declining_customers': [],
            'growing_customers': [],
            'seasonal_customers': []
        }
    
    # Convert to datetime if not already
    if not pd.api.types.is_datetime64_any_dtype(historical_data['fecha']):
        historical_data['fecha'] = pd.to_datetime(historical_data['fecha'])
    
    # Add year and month columns for year-over-year comparison
    historical_data['year'] = historical_data['fecha'].dt.year
    historical_data['month'] = historical_data['fecha'].dt.month
    
    # Get the list of unique years in the data
    years = sorted(historical_data['year'].unique())
    
    if len(years) <= 1:
        # Not enough years for year-over-year comparison
        return {
            'new_customers': [],
            'lost_customers': [],
            'declining_customers': [],
            'growing_customers': [],
            'seasonal_customers': []
        }
    
    # Define the comparison years (latest complete year vs previous year)
    latest_year = years[-1]
    previous_year = years[-2]
    
    # Filter data for these two years
    current_year_data = historical_data[historical_data['year'] == latest_year]
    previous_year_data = historical_data[historical_data['year'] == previous_year]
    
    # Get list of customers in each year
    current_year_customers = set(current_year_data['cliente'].unique())
    previous_year_customers = set(previous_year_data['cliente'].unique())
    
    # Identify new and lost customers
    new_customers = list(current_year_customers - previous_year_customers)
    lost_customers = list(previous_year_customers - current_year_customers)
    
    # Calculate growth for continuing customers
    continuing_customers = list(current_year_customers.intersection(previous_year_customers))
    
    customer_growth = []
    
    for cliente in continuing_customers:
        # Group by month to ensure we compare same months across years
        client_current = current_year_data[current_year_data['cliente'] == cliente].groupby('month').agg({
            'kilos_enviados': 'sum',
            'valor_x_producto': 'sum'
        })
        
        client_previous = previous_year_data[previous_year_data['cliente'] == cliente].groupby('month').agg({
            'kilos_enviados': 'sum',
            'valor_x_producto': 'sum'
        })
        
        # Get common months for proper comparison
        common_months = set(client_current.index).intersection(set(client_previous.index))
        
        if common_months:
            # Calculate year-over-year growth for each month and then average
            monthly_growth = []
            
            for month in common_months:
                current_kilos = client_current.loc[month, 'kilos_enviados']
                previous_kilos = client_previous.loc[month, 'kilos_enviados']
                
                if previous_kilos > 0:
                    growth_pct = ((current_kilos / previous_kilos) - 1) * 100
                    monthly_growth.append(growth_pct)
            
            if monthly_growth:
                # Calculate average year-over-year growth across all months
                avg_growth = sum(monthly_growth) / len(monthly_growth)
                
                # Get total volumes for context
                total_current_kilos = client_current['kilos_enviados'].sum()
                total_previous_kilos = client_previous['kilos_enviados'].sum()
                
                # Check for seasonality in this client
                is_seasonal = False
                seasonal_info = None
                if seasonal_patterns and 'seasonal_clients' in seasonal_patterns:
                    for sc in seasonal_patterns['seasonal_clients']:
                        if sc['cliente'] == cliente:
                            is_seasonal = True
                            seasonal_info = sc
                            break
                
                growth_data = {
                    'cliente': cliente,
                    'previous_year_kilos': float(total_previous_kilos),
                    'current_year_kilos': float(total_current_kilos),
                    'growth': float(avg_growth),
                    'months_compared': len(common_months),
                    'growth_detail': ', '.join([f"{month}: {growth:.1f}%" for month, growth in 
                                               zip(common_months, monthly_growth)]),
                    'is_seasonal': is_seasonal
                }
                
                # Add seasonal details if available
                if seasonal_info:
                    growth_data['seasonal_pattern'] = {
                        'active_months': seasonal_info['active_months'],
                        'concentration': seasonal_info['concentration'],
                        'pattern_strength': seasonal_info['pattern_strength']
                    }
                
                customer_growth.append(growth_data)
    
    # Sort by growth
    customer_growth.sort(key=lambda x: x['growth'])
    
    # Get top growing and declining customers
    declining_customers = [c for c in customer_growth if c['growth'] < -2][:10]
    growing_customers = [c for c in customer_growth if c['growth'] > 2][-10:]
    growing_customers.reverse()  # Sort from highest to lowest
    
    # Extract seasonal customers for specific analysis
    seasonal_customers = [c for c in customer_growth if c.get('is_seasonal', False)]
    
    return {
        'new_customers': new_customers,
        'lost_customers': list(lost_customers),
        'declining_customers': declining_customers,
        'growing_customers': growing_customers,
        'seasonal_customers': seasonal_customers
    }

def detect_seasonal_patterns(historical_data):
    """
    Detect clients with strong seasonal purchasing patterns.
    Identifies seasonal clients (e.g., those who only buy in specific months).
    """
    if historical_data.empty or len(historical_data) < 4:
        return {'seasonal_clients': [], 'seasonal_fruits': []}
    
    # Ensure we have year and month columns
    if 'year' not in historical_data.columns:
        historical_data['year'] = historical_data['fecha'].dt.year
    if 'month' not in historical_data.columns:
        historical_data['month'] = historical_data['fecha'].dt.month
    
    # Get month names for better readability
    month_names = {i: calendar.month_name[i] for i in range(1, 13)}
    
    # Analysis for clients
    seasonal_clients = []
    client_month_data = historical_data.groupby(['cliente', 'month']).agg({
        'kilos_enviados': 'sum'
    }).reset_index()
    
    for client, client_data in client_month_data.groupby('cliente'):
        # Need a reasonable amount of data to detect patterns
        if len(client_data) < 2:
            continue
            
        # Calculate what percentage of annual volume happens in each month
        total_volume = client_data['kilos_enviados'].sum()
        if total_volume == 0:
            continue
            
        # Calculate monthly percentages
        monthly_percentages = []
        active_months = []
        
        for month in range(1, 13):
            month_data = client_data[client_data['month'] == month]
            if not month_data.empty:
                volume = month_data['kilos_enviados'].iloc[0]
                percentage = (volume / total_volume) * 100
                monthly_percentages.append(percentage)
                
                if percentage > 5:  # Considering months with >5% as "active"
                    active_months.append(month)
            else:
                monthly_percentages.append(0)
        
        # Detect seasonality patterns
        if len(active_months) <= 4:  # Client active in 4 or fewer months = strongly seasonal
            # Calculate concentration - how much volume is in the top months
            concentration = sum(sorted(monthly_percentages, reverse=True)[:len(active_months)])
            
            # Format active months for display
            active_month_names = [month_names[m] for m in active_months]
            
            seasonal_clients.append({
                'cliente': client,
                'active_months': active_month_names,
                'concentration': float(concentration),
                'pattern_strength': 'Strong' if concentration > 80 else 'Moderate',
                'monthly_percentages': {month_names[i+1]: float(pct) for i, pct in enumerate(monthly_percentages)}
            })
    
    # Sort by concentration (highest first)
    seasonal_clients.sort(key=lambda x: x['concentration'], reverse=True)
    
    # Analysis for fruits
    seasonal_fruits = []
    fruit_month_data = historical_data.groupby(['fruta', 'month']).agg({
        'kilos_enviados': 'sum'
    }).reset_index()
    
    for fruit, fruit_data in fruit_month_data.groupby('fruta'):
        if len(fruit_data) < 2:
            continue
            
        total_volume = fruit_data['kilos_enviados'].sum()
        if total_volume == 0:
            continue
        
        monthly_percentages = []
        active_months = []
        
        for month in range(1, 13):
            month_data = fruit_data[fruit_data['month'] == month]
            if not month_data.empty:
                volume = month_data['kilos_enviados'].iloc[0]
                percentage = (volume / total_volume) * 100
                monthly_percentages.append(percentage)
                
                if percentage > 5:
                    active_months.append(month)
            else:
                monthly_percentages.append(0)
        
        # Detect seasonality for fruits
        if len(active_months) <= 6:  # Fruits often have wider seasons
            concentration = sum(sorted(monthly_percentages, reverse=True)[:len(active_months)])
            
            active_month_names = [month_names[m] for m in active_months]
            
            seasonal_fruits.append({
                'fruta': fruit,
                'active_months': active_month_names,
                'concentration': float(concentration),
                'pattern_strength': 'Strong' if concentration > 70 else 'Moderate',
                'monthly_percentages': {month_names[i+1]: float(pct) for i, pct in enumerate(monthly_percentages)}
            })
    
    # Sort by concentration (highest first)
    seasonal_fruits.sort(key=lambda x: x['concentration'], reverse=True)
    
    return {
        'seasonal_clients': seasonal_clients,
        'seasonal_fruits': seasonal_fruits
    }

def proyeccion_ventas_api(request):
    """
    API endpoint for fetching sales projection data for AJAX requests
    """
    fecha_inicio_str = request.GET.get('fecha_inicio')
    fecha_fin_str = request.GET.get('fecha_fin')
    cliente_id = request.GET.get('cliente')
    fruta_id = request.GET.get('fruta')
    exportador_id = request.GET.get('exportador')
    forecast_months = int(request.GET.get('forecast_months', 3))
    
    # Parse dates
    if fecha_inicio_str:
        fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
    else:
        fecha_inicio = datetime.now().date() - timedelta(days=365)
    
    if fecha_fin_str:
        fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
    else:
        fecha_fin = datetime.now().date()
    
    # Get data
    historical_data = get_historical_sales_data(
        fecha_inicio, 
        fecha_fin, 
        cliente_id, 
        fruta_id, 
        exportador_id
    )
    
    # Detect seasonal patterns
    seasonal_patterns = detect_seasonal_patterns(historical_data)
    
    forecast_data = generate_forecast(historical_data, forecast_months)
    
    # Enhanced serialization function
    def convert_to_serializable(df):
        if df.empty:
            return []
            
        # Deep copy to avoid modifying original
        result = []
        
        # Process each record individually for better control
        for _, row in df.iterrows():
            record = {}
            for key, value in row.items():
                if pd.isna(value):
                    record[key] = None
                elif hasattr(value, 'strftime'):
                    # DateTime objects
                    record[key] = value.strftime('%Y-%m-%d')
                elif str(type(value)).find('Period') >= 0:
                    # Period objects
                    record[key] = str(value)
                elif isinstance(value, Decimal):
                    # Decimal objects
                    record[key] = float(value)
                elif isinstance(value, (int, float)):
                    # Numeric types
                    record[key] = float(value) if isinstance(value, float) else value
                else:
                    # Strings and other types
                    record[key] = str(value)
            result.append(record)
                    
        return result

    # Process portfolio changes to ensure JSON serializability
    portfolio = analyze_customer_portfolio(historical_data, seasonal_patterns)
    for key in portfolio:
        if isinstance(portfolio[key], list):
            # For numerical fields in dictionaries within lists
            if key in ['declining_customers', 'growing_customers']:
                for item in portfolio[key]:
                    for k, v in item.items():
                        if isinstance(v, (float, np.float64, Decimal)):
                            item[k] = float(v)
    
    # Process summary metrics to ensure all values are JSON serializeable
    metrics = calculate_summary_metrics(historical_data, forecast_data)
    for key, value in metrics.items():
        if isinstance(value, (float, np.float64, Decimal)):
            metrics[key] = float(value)
    
    # Prepare data for JSON response
    response_data = {
        'historical_data': convert_to_serializable(historical_data),
        'forecast_data': convert_to_serializable(forecast_data),
        'summary_metrics': metrics,
        'portfolio_changes': portfolio,
        'seasonal_patterns': seasonal_patterns
    }
    
    # Use dumps and loads to ensure valid JSON
    json_str = json.dumps(response_data, default=str)
    return JsonResponse(json.loads(json_str))