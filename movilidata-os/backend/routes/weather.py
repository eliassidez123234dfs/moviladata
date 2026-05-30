from fastapi import APIRouter
from datetime import datetime
import os, requests, random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

router = APIRouter()

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./movilidata.db')
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'
MEDELLIN_LAT, MEDELLIN_LON = 6.25, -75.57

ESTACIONES = [
    {'nombre': 'Museo de Agua', 'lat': 6.2486, 'lon': -75.5715},
    {'nombre': 'Politécnico', 'lat': 6.2617, 'lon': -75.5897},
    {'nombre': 'UdeA', 'lat': 6.2679, 'lon': -75.5672},
    {'nombre': 'ITM', 'lat': 6.2121, 'lon': -75.5870},
]

def _classify_rain(mmh):
    if mmh < 0.5: return 'baja'
    if mmh < 4: return 'ligera'
    if mmh < 8: return 'moderada'
    return 'fuerte'

def _weather_code_to_label(code):
    codes = {
        0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado',
        3: 'Nublado', 45: 'Niebla', 48: 'Niebla helada',
        51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna densa',
        61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia fuerte',
        71: 'Nevada ligera', 73: 'Nevada moderada', 75: 'Nevada fuerte',
        80: 'Chubascos ligeros', 81: 'Chubascos moderados', 82: 'Chubascos violentos',
        95: 'Tormenta', 96: 'Tormenta con granizo', 99: 'Tormenta con granizo fuerte'
    }
    return codes.get(code, f'Código {code}')

@router.get('/api/weather')
def get_weather():
    now = datetime.utcnow().isoformat()

    try:
        r = requests.get(OPEN_METEO_URL, params={
            'latitude': MEDELLIN_LAT,
            'longitude': MEDELLIN_LON,
            'current': 'temperature_2m,precipitation,weather_code,relative_humidity_2m,wind_speed_10m',
            'daily': 'precipitation_sum',
            'timezone': 'auto',
            'forecast_days': 1
        }, timeout=8)
        if r.ok:
            data = r.json()
            current = data.get('current', {})
            daily = data.get('daily', {})
            mmh = current.get('precipitation', 0) or 0
            temp = current.get('temperature_2m', 0) or 0
            humidity = current.get('relative_humidity_2m', 0) or 0
            wind = current.get('wind_speed_10m', 0) or 0
            weather_code = current.get('weather_code', 0) or 0
            label = _weather_code_to_label(weather_code)
            intensidad = _classify_rain(mmh)

            return {
                'timestamp': now,
                'estaciones': [{
                    'nombre': 'Medellín Centro',
                    'precipitacion_mmh': mmh,
                    'intensidad': intensidad,
                    'temperatura': temp,
                    'humedad': humidity,
                    'viento_kmh': wind,
                    'latitud': MEDELLIN_LAT,
                    'longitud': MEDELLIN_LON,
                }],
                'precipitacion_mmh': mmh,
                'intensidad_label': intensidad,
                'temperatura': temp,
                'humedad': humidity,
                'viento_kmh': wind,
                'condicion': label,
                'weather_code': weather_code,
                'fuente': 'Open-Meteo / DWD',
                'source_status': 'ok',
                'actualizacion': datetime.utcnow().isoformat()
            }
    except Exception as e:
        print(f"[Weather] Open-Meteo error: {e}")

    try:
        from models import CondicionClimatica
        session = SessionLocal()
        try:
            latest = session.query(CondicionClimatica).order_by(CondicionClimatica.timestamp.desc()).first()
            if latest:
                return {
                    'timestamp': now,
                    'precipitacion_mmh': latest.precipitacion_mmh,
                    'intensidad_label': latest.intensidad_label or 'sin datos',
                    'temperatura': latest.temperature or 0,
                    'estacion': latest.estacion_siata,
                    'fuente': f'SIATA (caché: {latest.timestamp})',
                    'source_status': 'degraded',
                    'actualizacion': latest.timestamp.isoformat() if hasattr(latest.timestamp, 'isoformat') else str(latest.timestamp)
                }
        finally:
            session.close()
    except Exception:
        pass

    return {
        'timestamp': now,
        'precipitacion_mmh': None,
        'intensidad_label': None,
        'temperatura': None,
        'fuente': 'No disponible',
        'source_status': 'unavailable',
        'mensaje': 'Datos climáticos no disponibles. Sin conexión a Open-Meteo ni caché local.',
        'actualizacion': None
    }
