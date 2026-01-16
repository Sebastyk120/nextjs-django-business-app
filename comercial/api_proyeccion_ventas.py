from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from decimal import Decimal
import calendar
import io
from django.db.models import Q, Sum, F
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from comercial.models import Pedido, DetallePedido, Cliente, Fruta, Exportador

class ProyeccionVentasAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # 1. Parse Parameters
            params = self._parse_parameters(request)
            
            # 2. Fetch Historical Data
            historical_df = self._get_historical_data(params)
            
            # 3. Detect Seasonality (Detailed for frontend tables)
            seasonal_patterns = self._detect_seasonal_patterns(historical_df)
            
            # 4. Generate Forecast (Lightweight Pandas Engine)
            forecast_df, model_metadata = self._generate_forecast(historical_df, params['forecast_months'], seasonal_patterns)
            
            # Check if Excel export is requested
            if request.GET.get('export') == 'excel':
                return self._export_to_excel(historical_df, forecast_df, params)

            # 5. Analyze Customer Portfolio (Detailed lists)
            portfolio_analysis = self._analyze_portfolio(historical_df, seasonal_patterns)
            
            # 6. Calculate Summary Metrics
            metrics = self._calculate_metrics(historical_df, forecast_df)
            
            # 7. Prepare Response
            response_data = {
                'filters': {
                    'fecha_inicio': params['fecha_inicio'].strftime('%Y-%m-%d'),
                    'fecha_fin': params['fecha_fin'].strftime('%Y-%m-%d'),
                    'forecast_months': params['forecast_months'],
                    'cliente_id': params.get('cliente_id'),
                    'fruta_id': params.get('fruta_id'),
                    'exportador_id': params.get('exportador_id'),
                },
                'summary_metrics': metrics,
                'historical_data': self._serialize_dataframe(historical_df),
                'forecast_data': self._serialize_dataframe(forecast_df),
                'seasonal_patterns': seasonal_patterns,
                'portfolio_analysis': portfolio_analysis,
                'model_metadata': model_metadata
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e), 'detail': 'Error generating projection'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _parse_parameters(self, request):
        today = datetime.now().date()
        
        # Default lookback 1 year unless specified
        default_start = today - timedelta(days=365)
        
        fecha_inicio_str = request.GET.get('fecha_inicio')
        fecha_fin_str = request.GET.get('fecha_fin')
        
        return {
            'fecha_inicio': datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date() if fecha_inicio_str else default_start,
            'fecha_fin': datetime.strptime(fecha_fin_str, '%Y-%m-%d').date() if fecha_fin_str else today,
            'cliente_id': request.GET.get('cliente_id') or request.GET.get('cliente'),
            'fruta_id': request.GET.get('fruta_id') or request.GET.get('fruta'),
            'exportador_id': request.GET.get('exportador_id') or request.GET.get('exportador'),
            'forecast_months': int(request.GET.get('forecast_months', 3)),
            'user': request.user  # Pass user for group filtering
        }

    def _get_user_exportadora_filter(self, user):
        """
        Determine the exportadora filter based on user's group membership.
        Returns a Q filter or None if user can see all data (Heavens/Autorizadores).
        """
        # Heavens and Autorizadores see all data
        if user.groups.filter(name__in=['Heavens', 'Autorizadores']).exists():
            return None
        
        # Map group names to exportadora names
        group_to_exportadora = {
            'Fieldex': 'Fieldex',
            'Etnico': 'Etnico',
            'Juan_Matas': 'Juan Matas',
            'Juan Matas': 'Juan Matas',
            'CI_Dorado': 'CI_Dorado',
            'CI Dorado': 'CI_Dorado'
        }
        
        user_group_names = user.groups.values_list('name', flat=True)
        
        for group_name in user_group_names:
            if group_name in group_to_exportadora:
                exportadora_name = group_to_exportadora[group_name]
                return Q(pedido__exportadora__nombre=exportadora_name)
        
        # User has no recognized group - return empty filter (will result in no data)
        return Q(pk__in=[])  # Always false, returns no results

    def _get_historical_data(self, params):
        analysis_start_date = params['fecha_fin'] - timedelta(days=365 * 2)
        if params['fecha_inicio'] < analysis_start_date:
            analysis_start_date = params['fecha_inicio']

        filters = Q(pedido__fecha_entrega__range=[analysis_start_date, params['fecha_fin']])
        
        # Apply group-based exportadora filter FIRST (security enforcement)
        user = params.get('user')
        if user:
            group_filter = self._get_user_exportadora_filter(user)
            if group_filter is not None:
                filters &= group_filter
        
        if params['cliente_id'] and params['cliente_id'] != 'undefined':
            filters &= Q(pedido__cliente_id=params['cliente_id'])
        if params['fruta_id'] and params['fruta_id'] != 'undefined':
            filters &= Q(fruta_id=params['fruta_id'])
        if params['exportador_id'] and params['exportador_id'] != 'undefined':
            filters &= Q(pedido__exportadora_id=params['exportador_id'])
            
        detalles = DetallePedido.objects.filter(filters).select_related(
            'pedido', 'pedido__cliente', 'fruta'
        ).values(
            'pedido__fecha_entrega',
            'pedido__cliente__nombre',
            'fruta__nombre',
            'kilos_enviados',
            'cajas_enviadas',
            'valor_x_producto'
        )
        
        if not detalles:
            return pd.DataFrame(columns=['ds', 'fecha', 'cliente', 'fruta', 'kilos', 'cajas', 'valor'])
            
        df = pd.DataFrame(list(detalles))
        
        df = df.rename(columns={
            'pedido__fecha_entrega': 'ds',
            'pedido__cliente__nombre': 'cliente',
            'fruta__nombre': 'fruta',
            'kilos_enviados': 'kilos',
            'cajas_enviadas': 'cajas',
            'valor_x_producto': 'valor'
        })
        
        df['ds'] = pd.to_datetime(df['ds'])
        
        for col in ['kilos', 'cajas', 'valor']:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            
        df['fecha'] = df['ds'].dt.strftime('%Y-%m-%d')
        
        return df.sort_values('ds')

    def _generate_forecast(self, df, months, seasonal_patterns):
        if df.empty:
            return pd.DataFrame(), {'algorithm': 'none', 'reason': 'no_data'}
            
        monthly_df = df.copy()
        monthly_df['ds'] = monthly_df['ds'].apply(lambda x: x.replace(day=1))
        
        monthly_agg = monthly_df.groupby('ds').agg({
            'kilos': 'sum', 'cajas': 'sum', 'valor': 'sum'
        }).reset_index().sort_values('ds')
        
        last_date = monthly_agg['ds'].max()
        start_trend_window = last_date - pd.DateOffset(months=3)
        
        recent_data = monthly_agg[monthly_agg['ds'] > start_trend_window]
        
        growth_factors = {'kilos': 1.0, 'cajas': 1.0, 'valor': 1.0}
        
        if len(monthly_agg) >= 15:
            for metric in ['kilos', 'cajas', 'valor']:
                recent_sum = recent_data[metric].sum()
                prev_year_start = start_trend_window - pd.DateOffset(years=1)
                prev_year_end = last_date - pd.DateOffset(years=1)
                
                prev_data = monthly_agg[
                    (monthly_agg['ds'] > prev_year_start) & 
                    (monthly_agg['ds'] <= prev_year_end)
                ]
                
                prev_sum = prev_data[metric].sum()
                
                if prev_sum > 0:
                    growth = recent_sum / prev_sum
                    growth = max(0.5, min(1.5, growth))
                    growth_factors[metric] = growth
        
        forecast_results = []
        last_known_date = monthly_agg['ds'].max()
        
        for i in range(1, months + 1):
            future_date = last_known_date + pd.DateOffset(months=i)
            target_month = future_date.month
            prev_year_date = future_date - pd.DateOffset(years=1)
            
            prev_val_row = monthly_agg[monthly_agg['ds'] == prev_year_date]
            
            step_res = {
                'ds': future_date,
                'cliente': 'Proyección Global',
                'fruta': 'Todas',
                'is_forecast': True
            }
            
            for metric in ['kilos', 'cajas', 'valor']:
                base_val = 0
                if not prev_val_row.empty:
                    base_val = prev_val_row.iloc[0][metric]
                else:
                    month_avgs = monthly_agg[monthly_agg['ds'].dt.month == target_month]
                    if not month_avgs.empty:
                        base_val = month_avgs[metric].mean()
                
                forecast_val = base_val * growth_factors[metric]
                step_res[metric] = forecast_val
                step_res[f'{metric}_lower'] = forecast_val * 0.85
                step_res[f'{metric}_upper'] = forecast_val * 1.15
            
            forecast_results.append(step_res)
            
        return pd.DataFrame(forecast_results), {
            'algorithm': 'weighted_seasonal_growth',
            'growth_factors': growth_factors
        }

    def _detect_seasonal_patterns(self, df):
        if df.empty:
            return {'seasonal_clients': [], 'seasonal_fruits': []}
            
        df = df.copy()
        df['month'] = df['ds'].dt.month
        month_names = {i: calendar.month_name[i] for i in range(1, 13)}
        
        seasonal_clients = []
        client_totals = df.groupby('cliente')['kilos'].sum()
        client_monthly = df.groupby(['cliente', 'month'])['kilos'].sum().reset_index()
        
        for client, total in client_totals.items():
            if total < 1000: continue
            
            c_data = client_monthly[client_monthly['cliente'] == client]
            active_months = c_data[c_data['kilos'] > 0]['month'].unique()
            c_data_sorted = c_data.sort_values('kilos', ascending=False)
            top_3_sum = c_data_sorted.head(3)['kilos'].sum()
            concentration = (top_3_sum / total) * 100
            
            is_seasonal = len(active_months) <= 6 or concentration > 70
            
            if is_seasonal:
                active_month_names = [month_names[m] for m in sorted(active_months)]
                seasonal_clients.append({
                    'cliente': client,
                    'active_months': active_month_names[:6],
                    'concentration': concentration,
                    'pattern_strength': 'Alta' if concentration > 85 else 'Media',
                    'monthly_percentages': {month_names[r.month]: (r.kilos/total*100) for _, r in c_data.iterrows()}
                })

        seasonal_fruits = []
        fruit_totals = df.groupby('fruta')['kilos'].sum()
        fruit_monthly = df.groupby(['fruta', 'month'])['kilos'].sum().reset_index()
        
        for fruit, total in fruit_totals.items():
            if total < 100: continue
            
            f_data = fruit_monthly[fruit_monthly['fruta'] == fruit]
            f_data_sorted = f_data.sort_values('kilos', ascending=False)
            top_3_sum = f_data_sorted.head(3)['kilos'].sum()
            concentration = (top_3_sum / total) * 100
            
            active_months = f_data[f_data['kilos'] > 0]['month'].unique()
            
            if concentration > 50:
                 active_month_names = [month_names[m] for m in sorted(active_months)]
                 seasonal_fruits.append({
                    'fruta': fruit,
                    'active_months': active_month_names[:6],
                    'concentration': concentration,
                    'pattern_strength': 'Alta' if concentration > 80 else 'Media'
                })

        return {
            'seasonal_clients': sorted(seasonal_clients, key=lambda x: x['concentration'], reverse=True),
            'seasonal_fruits': sorted(seasonal_fruits, key=lambda x: x['concentration'], reverse=True)
        }

    def _analyze_portfolio(self, df, seasonal_patterns):
        if df.empty:
            return {'new_customers': [], 'lost_customers': [], 'growing_customers': [], 'declining_customers': []}
            
        last_date = df['ds'].max()
        cutoff_current = last_date - pd.DateOffset(years=1)
        cutoff_previous = last_date - pd.DateOffset(years=2)
        
        current_period = df[df['ds'] > cutoff_current]
        previous_period = df[(df['ds'] > cutoff_previous) & (df['ds'] <= cutoff_current)]
        
        curr_clients = set(current_period['cliente'].unique())
        prev_clients = set(previous_period['cliente'].unique())
        
        new_customers = list(curr_clients - prev_clients)
        lost_customers = list(prev_clients - curr_clients)
        
        common_clients = curr_clients.intersection(prev_clients)
        growing = []
        declining = []
        
        curr_sums = current_period.groupby('cliente')['kilos'].sum()
        prev_sums = previous_period.groupby('cliente')['kilos'].sum()
        
        seasonal_client_names = [sc['cliente'] for sc in seasonal_patterns['seasonal_clients']]
        
        for client in common_clients:
            curr_kilos = curr_sums.get(client, 0)
            prev_kilos = prev_sums.get(client, 0)
            
            if prev_kilos > 0:
                growth_pct = ((curr_kilos - prev_kilos) / prev_kilos) * 100
                info = {
                    'cliente': client,
                    'growth': growth_pct,
                    'current_year_kilos': curr_kilos,
                    'previous_year_kilos': prev_kilos,
                    'is_seasonal': client in seasonal_client_names
                }
                if growth_pct > 5:
                    growing.append(info)
                elif growth_pct < -5:
                    declining.append(info)
                    
        return {
            'new_customers': sorted(new_customers),
            'lost_customers': sorted(lost_customers),
            'growing_customers': sorted(growing, key=lambda x: x['growth'], reverse=True),
            'declining_customers': sorted(declining, key=lambda x: x['growth'])
        }

    def _calculate_metrics(self, hist_df, forecast_df):
        hist_total = hist_df[['kilos', 'cajas', 'valor']].sum().to_dict()
        forecast_total = forecast_df[['kilos', 'cajas', 'valor']].sum().to_dict() if not forecast_df.empty else {'kilos':0, 'cajas':0, 'valor':0}
        
        def growth(curr, prev):
            return ((curr - prev) / prev * 100) if prev > 0 else 0
            
        metrics = {
            'historical': hist_total,
            'forecast': forecast_total,
            'growth_percent': {
                'kilos': 0, 'cajas': 0, 'valor': 0
            }
        }
        
        if not hist_df.empty and not forecast_df.empty:
            hist_months = (hist_df['ds'].max() - hist_df['ds'].min()).days / 30.5
            fore_months = (forecast_df['ds'].max() - forecast_df['ds'].min()).days / 30.5
            
            if hist_months > 0 and fore_months > 0:
                metrics['growth_percent']['kilos'] = growth(forecast_total['kilos']/fore_months, hist_total['kilos']/hist_months)
                metrics['growth_percent']['cajas'] = growth(forecast_total['cajas']/fore_months, hist_total['cajas']/hist_months)
                metrics['growth_percent']['valor'] = growth(forecast_total['valor']/fore_months, hist_total['valor']/hist_months)

        return metrics

    def _serialize_dataframe(self, df):
        if df.empty: return []
        result = []
        for _, row in df.iterrows():
            item = row.to_dict()
            if 'ds' in item:
                if hasattr(item['ds'], 'strftime'):
                    item['fecha'] = item['ds'].strftime('%Y-%m-%d')
                else:
                     item['fecha'] = str(item['ds'])
                del item['ds']
            
            for k, v in item.items():
                if isinstance(v, (np.integer, np.floating)):
                    item[k] = float(v)
                elif pd.isna(v):
                    item[k] = None
            result.append(item)
        return result

    def _export_to_excel(self, historical_df, forecast_df, params):
        output = io.BytesIO()
        
        # Prepare DataFrames for Excel
        h_df = historical_df.copy()
        h_df['Tipo'] = 'Histórico'
        
        f_df = forecast_df.copy()
        f_df['Tipo'] = 'Proyección'
        f_df['fecha'] = f_df['ds'].dt.strftime('%Y-%m-%d')
        
        # Combine
        export_df = pd.concat([f_df, h_df], ignore_index=True)
        
        # Select and format columns
        columns = ['fecha', 'Tipo', 'kilos', 'cajas', 'valor', 'cliente', 'fruta']
        final_df = export_df[columns].sort_values(['fecha', 'Tipo'], ascending=[False, True])
        
        final_df = final_df.rename(columns={
            'fecha': 'Fecha',
            'kilos': 'Kilos',
            'cajas': 'Cajas',
            'valor': 'Ventas USD',
            'cliente': 'Cliente',
            'fruta': 'Fruta'
        })

        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            final_df.to_excel(writer, sheet_name='Proyección de Ventas', index=False)
            
            # Add a summary or info sheet
            info_df = pd.DataFrame([
                ['Fecha Reporte', datetime.now().strftime('%Y-%m-%d %H:%M')],
                ['Rango Inicial Histórico', params['fecha_inicio'].strftime('%Y-%m-%d')],
                ['Meses Proyectados', params['forecast_months']],
                ['Algoritmo', 'Lightweight Weighted Seasonal Growth']
            ], columns=['Propiedad', 'Valor'])
            info_df.to_excel(writer, sheet_name='Info', index=False)

        output.seek(0)
        
        filename = f"Proyeccion_Ventas_{datetime.now().strftime('%Y%m%d')}.xlsx"
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename={filename}'
        return response
