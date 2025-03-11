import json
import warnings
from datetime import datetime, timedelta
from decimal import Decimal
import numpy as np
import pandas as pd
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render
from comercial.models import Pedido, DetallePedido, Cliente, Fruta, Exportador


def es_miembro_del_grupo(nombre_grupo):
    def es_miembro(user):
        return user.groups.filter(name=nombre_grupo).exists()

    return es_miembro

@login_required
@user_passes_test(user_passes_test(es_miembro_del_grupo('Heavens'), login_url='home'))
def proyeccion_ventas(request):
    """
    View for displaying sales projections using Holt-Winters method.
    Forecasts sales 3 months into the future based on historical data.
    """
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
    portfolio_changes = analyze_customer_portfolio(historical_data)
    
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
    Apply a Seasonal Naive forecasting approach:
    - Use same-month data from previous years when available
    - Fall back to weighted average of previous months when needed
    - Apply growth adjustments to refine forecasts
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
    
    # Suppress warnings
    warnings.filterwarnings('ignore')
    
    # Group by cliente and fruta
    for (cliente, fruta), group in historical_data.groupby(['cliente', 'fruta']):
        # Sort by date
        group = group.sort_values('fecha')
        
        # Get the latest date to start forecasting from
        last_date = group['fecha'].max()
        
        # Create a month and year column for seasonal matching
        group['year'] = group['fecha'].dt.year
        group['month'] = group['fecha'].dt.month
        
        # For each month to forecast
        for i in range(1, forecast_months + 1):
            forecast_date = last_date + pd.DateOffset(months=i)
            forecast_year = forecast_date.year
            forecast_month = forecast_date.month
            
            # Check if we have data from the same month in previous years
            same_month_data = group[group['month'] == forecast_month]
            
            if len(same_month_data) > 0:
                # CASE 1: Use seasonal data (same month from previous years)
                
                # Calculate average with more weight to recent years
                if len(same_month_data) > 1:
                    # Create weights that give more importance to recent years
                    years_diff = same_month_data['year'].max() - same_month_data['year']
                    # Exponential weighting - more recent years have higher weight
                    weights = np.exp(-0.5 * years_diff)
                    weights = weights / weights.sum()  # Normalize
                    
                    forecast_kilos = np.average(same_month_data['kilos_enviados'], weights=weights)
                    forecast_cajas = np.average(same_month_data['cajas_enviadas'], weights=weights)
                    forecast_valor = np.average(same_month_data['valor_x_producto'], weights=weights)
                    
                    # Add growth factor (assume 5% annual growth if not specified)
                    years_ahead = forecast_year - same_month_data['year'].max()
                    growth_factor = 1.05 ** years_ahead  # 5% annual growth
                    
                    forecast_kilos *= growth_factor
                    forecast_cajas *= growth_factor
                    forecast_valor *= growth_factor
                    
                    model_name = "seasonal_naive_with_growth"
                else:
                    # Only one historical point for this month
                    forecast_kilos = same_month_data['kilos_enviados'].iloc[0]
                    forecast_cajas = same_month_data['cajas_enviadas'].iloc[0]
                    forecast_valor = same_month_data['valor_x_producto'].iloc[0]
                    
                    # Add smaller growth factor (more conservative with single data point)
                    years_ahead = forecast_year - same_month_data['year'].iloc[0]
                    growth_factor = 1.03 ** years_ahead  # 3% annual growth
                    
                    forecast_kilos *= growth_factor
                    forecast_cajas *= growth_factor
                    forecast_valor *= growth_factor
                    
                    model_name = "seasonal_naive_single_point"
            else:
                # CASE 2: No seasonal data available, use weighted average of recent months
                
                # Get last 3 months if available, or all data if less than 3 points
                recent_months = min(3, len(group))
                recent_data = group.iloc[-recent_months:]
                
                if len(recent_data) > 0:
                    # Create weights with more importance to recent months
                    weights = np.linspace(0.5, 1.0, recent_months)
                    weights = weights / weights.sum()  # Normalize
                    
                    forecast_kilos = np.average(recent_data['kilos_enviados'], weights=weights)
                    forecast_cajas = np.average(recent_data['cajas_enviadas'], weights=weights)
                    forecast_valor = np.average(recent_data['valor_x_producto'], weights=weights)
                    
                    # Check for trend in recent months and apply adjustment
                    if len(recent_data) >= 2:
                        # Calculate month-to-month trend
                        kilos_trend = np.diff(recent_data['kilos_enviados'].values).mean()
                        cajas_trend = np.diff(recent_data['cajas_enviadas'].values).mean()
                        valor_trend = np.diff(recent_data['valor_x_producto'].values).mean()
                        
                        # Apply dampened trend (less impact for longer forecasts)
                        dampen_factor = 0.8 ** (i-1)
                        forecast_kilos += kilos_trend * dampen_factor
                        forecast_cajas += cajas_trend * dampen_factor
                        forecast_valor += valor_trend * dampen_factor
                    
                    # Apply seasonal adjustment factor if we can detect seasonality
                    # This is a simple adjustment based on month-to-month patterns
                    month_factors = {
                        1: 0.95,  # January typically slower after holidays
                        2: 0.97,
                        3: 1.02,
                        4: 1.03,
                        5: 1.05,
                        6: 1.07,  # Summer often has higher demand
                        7: 1.08,
                        8: 1.06,
                        9: 1.03,
                        10: 1.02,
                        11: 1.04,
                        12: 1.10,  # December holiday season boost
                    }
                    
                    seasonal_factor = month_factors.get(forecast_month, 1.0)
                    forecast_kilos *= seasonal_factor
                    forecast_cajas *= seasonal_factor
                    forecast_valor *= seasonal_factor
                    
                    model_name = "weighted_average_with_trend"
                else:
                    # No data case - highly unlikely given our previous checks
                    forecast_kilos = 0
                    forecast_cajas = 0
                    forecast_valor = 0
                    model_name = "no_data_available"
            
            # Ensure non-negative values
            forecast_kilos = max(0, float(forecast_kilos))
            forecast_cajas = max(0, float(forecast_cajas))
            forecast_valor = max(0, float(forecast_valor))
            
            # Create forecast entry
            forecast = pd.DataFrame({
                'fecha': [forecast_date],
                'cliente': [cliente],
                'fruta': [fruta],
                'kilos_enviados': [forecast_kilos],
                'cajas_enviadas': [forecast_cajas],
                'valor_x_producto': [forecast_valor],
                'tipo': ['forecast'],
                'modelo': [model_name]
            })
            
            all_forecasts.append(forecast)
    
    # Combine all forecasts
    if not all_forecasts:
        return pd.DataFrame()
    
    forecast_df = pd.concat(all_forecasts, ignore_index=True)
    forecast_df['mes_año'] = forecast_df['fecha'].dt.to_period('M')
    
    return forecast_df

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

def analyze_customer_portfolio(historical_data):
    """
    Analyze changes in customer portfolio over time.
    Identifies new customers, lost customers, and changes in purchase patterns.
    """
    if historical_data.empty:
        return {
            'new_customers': [],
            'declining_customers': [],
            'growing_customers': []
        }
    
    # Create a period for comparison (first half vs second half)
    historical_data = historical_data.sort_values('fecha')
    mid_date = historical_data['fecha'].min() + (historical_data['fecha'].max() - historical_data['fecha'].min()) / 2
    
    first_half = historical_data[historical_data['fecha'] < mid_date]
    second_half = historical_data[historical_data['fecha'] >= mid_date]
    
    # Get list of customers in each period
    first_half_customers = set(first_half['cliente'].unique())
    second_half_customers = set(second_half['cliente'].unique())
    
    # Identify new and lost customers
    new_customers = list(second_half_customers - first_half_customers)
    lost_customers = list(first_half_customers - second_half_customers)
    
    # Calculate growth for continuing customers
    continuing_customers = list(first_half_customers.intersection(second_half_customers))
    
    customer_growth = []
    
    for cliente in continuing_customers:
        first_kilos = first_half[first_half['cliente'] == cliente]['kilos_enviados'].sum()
        second_kilos = second_half[second_half['cliente'] == cliente]['kilos_enviados'].sum()
        
        if first_kilos > 0:
            growth = ((second_kilos / first_kilos) - 1) * 100
            customer_growth.append({
                'cliente': cliente,
                'first_kilos': first_kilos,
                'second_kilos': second_kilos,
                'growth': growth
            })
    
    # Sort by growth
    customer_growth.sort(key=lambda x: x['growth'])
    
    # Get top growing and declining customers
    declining_customers = [c for c in customer_growth if c['growth'] < -2][:10]  # More than 10% decline
    growing_customers = [c for c in customer_growth if c['growth'] > 2][-10:]    # More than 10% growth
    growing_customers.reverse()  # Sort from highest to lowest
    
    return {
        'new_customers': new_customers,
        'lost_customers': lost_customers,
        'declining_customers': declining_customers,
        'growing_customers': growing_customers
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
    portfolio = analyze_customer_portfolio(historical_data)
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
        'portfolio_changes': portfolio
    }
    
    # Use dumps and loads to ensure valid JSON
    json_str = json.dumps(response_data, default=str)
    return JsonResponse(json.loads(json_str))