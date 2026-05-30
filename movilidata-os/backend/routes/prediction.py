from fastapi import APIRouter, Query
from datetime import datetime, timedelta
from .traffic import traffic_state
import random

router = APIRouter()

CITY_POINTS = [
    {'name': 'Laureles', 'lat': 6.2517, 'lon': -75.5900},
    {'name': 'El Poblado', 'lat': 6.2200, 'lon': -75.5680},
    {'name': 'Centro', 'lat': 6.2480, 'lon': -75.5735},
    {'name': 'Belén', 'lat': 6.2500, 'lon': -75.6130},
    {'name': 'Robledo', 'lat': 6.2800, 'lon': -75.6200},
    {'name': 'Envigado', 'lat': 6.1740, 'lon': -75.5870}
]


def format_timestamp(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%SZ')


def make_probability(value):
    return min(0.98, max(0.05, round(value, 2)))


def build_heatmap(hour_index, base_prob):
    features = []
    for point in CITY_POINTS:
        prob = make_probability(base_prob + random.uniform(-0.12, 0.12))
        features.append({
            'type': 'Feature',
            'properties': {
                'zona': point['name'],
                'probabilidad': prob,
                'nivel': 'alta' if prob > 0.65 else ('media' if prob > 0.35 else 'baja')
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [point['lon'], point['lat']]
            }
        })
    return {'type': 'FeatureCollection', 'features': features}


def build_series(base_date, base_prob):
    history = []
    forecast = []
    for past in range(6, 0, -1):
        hora = base_date - timedelta(hours=past)
        history.append({
            'hora': hora.strftime('%Y-%m-%d %H:%M'),
            'valor': make_probability(base_prob + random.uniform(-0.20, 0.20))
        })
    for future in range(2, 5):
        hora = base_date + timedelta(hours=future)
        forecast.append({
            'hora': hora.strftime('%Y-%m-%d %H:%M'),
            'probabilidad': make_probability(base_prob + random.uniform(-0.15, 0.15))
        })
    return history, forecast


def estimate_base_probability():
    summary = traffic_state.get('summary', {})
    avg_speed = summary.get('velocidad_promedio', 35)
    base = 0.6 if avg_speed < 25 else (0.4 if avg_speed < 35 else 0.25)
    return base

def generate_prediction(fecha: str = None, hora: int = None):
    now = datetime.utcnow()
    if fecha:
        try:
            now = datetime.strptime(fecha, '%Y-%m-%d')
        except ValueError:
            pass
    if hora is not None and 0 <= hora <= 23:
        now = now.replace(hour=hora, minute=0, second=0, microsecond=0)
    base_prob = estimate_base_probability()
    heatmap = build_heatmap(now.hour, base_prob)
    history, forecast = build_series(now, base_prob)
    return {
        'request': {
            'fecha': now.strftime('%Y-%m-%d'),
            'hora': now.hour,
            'horizonte_horas': [2, 3, 4]
        },
        'model_info': {
            'nombre': 'modelo_estacional_simple',
            'variables': ['hora_del_dia', 'dia_de_la_semana', 'velocidad_promedio_actual'],
            'metrica': 'MAE_simulado',
            'descripcion': 'Pronóstico de congestión basado en patrón horario y velocidad promedio de tráfico.'
        },
        'heatmap': heatmap,
        'series': {
            'historico': history,
            'pronostico': forecast
        },
        'metadata': {
            'fecha_generacion': format_timestamp(datetime.utcnow()),
            'fuente': 'SIM simulado / tráfico interno'
        }
    }

@router.get('/api/prediction')
def get_prediction(fecha: str = Query(None), hora: int = Query(None)):
    return generate_prediction(fecha, hora)
