from .base import BaseProvider
from typing import Any, Optional
from datetime import datetime
import requests, os, random

class WeatherProvider(BaseProvider):
    def __init__(self):
        super().__init__(name='weather', source_type='api_open_meteo')

    def fetch(self, **params) -> dict:
        lat = params.get('lat', 6.25)
        lon = params.get('lon', -75.57)
        r = requests.get('https://api.open-meteo.com/v1/forecast', params={
            'latitude': lat, 'longitude': lon,
            'current': 'temperature_2m,precipitation,weather_code,relative_humidity_2m,wind_speed_10m',
            'daily': 'precipitation_sum',
            'timezone': 'auto',
            'forecast_days': 1
        }, timeout=8)
        r.raise_for_status()
        return r.json()


class WeatherSimulatedProvider(BaseProvider):
    def __init__(self):
        super().__init__(name='weather_simulated', source_type='simulador')

    def fetch(self, **params) -> dict:
        return {
            'current': {
                'temperature_2m': round(random.uniform(18, 30), 1),
                'precipitation': round(random.uniform(0, 15), 1),
                'weather_code': random.choice([0, 1, 2, 3, 45, 51, 61, 80, 95]),
                'relative_humidity_2m': round(random.uniform(40, 95), 1),
                'wind_speed_10m': round(random.uniform(0, 20), 1),
            }
        }


class RouteProvider(BaseProvider):
    def __init__(self):
        super().__init__(name='route', source_type='api_osrm')

    def fetch(self, **params) -> dict:
        origin = params['origin']
        dest = params['dest']
        coords = f"{origin[1]},{origin[0]};{dest[1]},{dest[0]}"
        r = requests.get(
            f'https://router.project-osrm.org/route/v1/driving/{coords}',
            params={'steps': 'true', 'overview': 'full', 'geometries': 'geojson', 'alternatives': 'true'},
            timeout=10
        )
        r.raise_for_status()
        return r.json()


class AccidentProvider(BaseProvider):
    def __init__(self):
        super().__init__(name='accidents', source_type='api_arcgis')
        self.base_url = 'https://www.medellin.gov.co/servidormapas/rest/services/transporte/VC_Gestion_Mov_Seguridad_Vial/MapServer/0/query'

    def fetch(self, **params) -> dict:
        where = params.get('where', '1=1')
        limit = params.get('limit', 100)
        r = requests.get(self.base_url, params={
            'where': where,
            'outFields': '*',
            'returnGeometry': 'true',
            'f': 'geojson',
            'resultRecordCount': limit
        }, timeout=15)
        r.raise_for_status()
        return r.json()


class TrafficProvider(BaseProvider):
    def __init__(self):
        super().__init__(name='traffic', source_type='api_sim')

    def fetch(self, **params) -> Optional[list]:
        try:
            from models import SegmentoVial
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker
            engine = create_engine(os.getenv('DATABASE_URL', 'sqlite:///./movilidata.db'), connect_args={"check_same_thread": False})
            session = sessionmaker(bind=engine)()
            try:
                segments = session.query(SegmentoVial).order_by(SegmentoVial.nombre).all()
                if segments:
                    return segments
            finally:
                session.close()
        except Exception as e:
            pass
        return None


class TrafficSimulatedProvider(BaseProvider):
    def __init__(self):
        super().__init__(name='traffic_estimated', source_type='simulador_estimado')

    def fetch(self, **params) -> list:
        hour = datetime.now().hour
        REAL_VIAS = [
            'Av. El Poblado', 'Av. Las Vegas', 'Av. Oriental', 'Av. Ferrocarril',
            'Av. 33', 'Av. Guayabal', 'Av. San Juan', 'Av. Nutibara',
            'Calle 10', 'Calle 30', 'Calle 50', 'Circular 1',
            'Transversal Inferior', 'Autopista Sur', 'Av. Bolivariana'
        ]
        segments = []
        for idx, name in enumerate(REAL_VIAS):
            if 6 <= hour <= 9:
                speed = round(random.uniform(12, 30), 1)
            elif 16 <= hour <= 19:
                speed = round(random.uniform(14, 32), 1)
            elif 22 <= hour or hour <= 4:
                speed = round(random.uniform(35, 55), 1)
            else:
                speed = round(random.uniform(25, 45), 1)
            segments.append({
                'name': name,
                'speed': speed,
                'color': 'green' if speed > 35 else ('yellow' if speed > 20 else 'red'),
                'density': max(0, int(100 - speed)),
            })
        return segments


provider_registry = {
    'weather': {
        'real': WeatherProvider,
        'simulated': WeatherSimulatedProvider,
    },
    'route': {
        'real': RouteProvider,
    },
    'accidents': {
        'real': AccidentProvider,
    },
    'traffic': {
        'real': TrafficProvider,
        'estimated': TrafficSimulatedProvider,
    }
}


def get_provider(domain: str, mode: Optional[str] = None) -> BaseProvider:
    providers = provider_registry.get(domain, {})
    if mode is None:
        mode = os.getenv(f'{domain.upper()}_PROVIDER', 'real' if domain != 'traffic' else 'estimated')
    if mode not in providers:
        mode = list(providers.keys())[0]
    return providers[mode]()
