from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import os, requests, math, random
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

router = APIRouter()

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./movilidata.db')
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'

class RouteRequest(BaseModel):
    origen: List[float] = Field(..., min_items=2, max_items=2)
    destino: List[float] = Field(..., min_items=2, max_items=2)

    @validator('origen', 'destino', pre=True)
    def validate_coords(cls, v):
        if not isinstance(v, list) or len(v) != 2:
            raise ValueError('Origen/destino deben ser [lat, lon]')
        lat, lon = v
        if not (4.5 <= lat <= 6.5 and -76 <= lon <= -75):
            raise ValueError('Coordenadas fuera del área de Medellín')
        return v

def get_weather_factor():
    try:
        r = requests.get('https://api.open-meteo.com/v1/forecast', params={
            'latitude': 6.25, 'longitude': -75.57,
            'current': 'precipitation,weather_code',
            'timezone': 'auto'
        }, timeout=5)
        if r.ok:
            d = r.json()
            precip = d.get('current', {}).get('precipitation', 0) or 0
            return {'factor': min(precip / 15, 1.0), 'precipitacion': precip}
    except Exception:
        pass

    try:
        from models import CondicionClimatica
        session = SessionLocal()
        try:
            w = session.query(CondicionClimatica).order_by(CondicionClimatica.timestamp.desc()).first()
            if w:
                return {'factor': min(w.precipitacion_mmh / 15, 1.0), 'precipitacion': w.precipitacion_mmh}
        finally:
            session.close()
    except Exception:
        pass

    return {'factor': 0.0, 'precipitacion': 0}

def get_risk_zones():
    try:
        from models import ZonaRiesgo, CondicionClimatica
        session = SessionLocal()
        try:
            zonas = session.query(ZonaRiesgo).order_by(ZonaRiesgo.indice_riesgo.desc()).all()
            weather = session.query(CondicionClimatica).order_by(CondicionClimatica.timestamp.desc()).first()
            intensidad_norm = 0
            if weather and weather.precipitacion_mmh > 0:
                intensidad_norm = min(weather.precipitacion_mmh / 20, 1.0)
            coef_lluvia = 0.5
            result = []
            for z in zonas:
                ir_lluvia = z.indice_riesgo * (1 + coef_lluvia * intensidad_norm)
                result.append({
                    'name': z.nombre_sector,
                    'indice_riesgo': z.indice_riesgo,
                    'ir_lluvia': round(ir_lluvia, 4),
                    'risk_level': 'alta' if ir_lluvia > 0.5 else 'media',
                    'lat': z.centroide_lat or (6.24 + random.uniform(-0.05, 0.05)),
                    'lon': z.centroide_lon or (-75.58 + random.uniform(-0.05, 0.05)),
                })
            return result
        finally:
            session.close()
    except Exception:
        return []

@router.post('/api/safe-route')
def safe_route(req: RouteRequest):
    try:
        origin = req.origen
        dest = req.destino
        weather = get_weather_factor()

        # OSRM routing — real roads, turn-by-turn, free, no key
        coords_str = f"{origin[1]},{origin[0]};{dest[1]},{dest[0]}"
        try:
            r = requests.get(f'{OSRM_URL}/{coords_str}', params={
                'steps': 'true',
                'overview': 'full',
                'geometries': 'geojson',
                'alternatives': 'true'
            }, timeout=10)
            if r.ok:
                osrm = r.json()
                if osrm.get('code') == 'Ok' and osrm.get('routes'):
                    routes = []
                    for route in osrm['routes']:
                        coords = route['geometry']['coordinates']
                        legs = route['legs'][0]
                        steps = []
                        for step in legs['steps']:
                            direction_map = {
                                'left': 'izquierda', 'right': 'derecha',
                                'straight': 'recto', 'slight left': 'ligera izquierda',
                                'slight right': 'ligera derecha', 'sharp left': 'cerrada izquierda',
                                'sharp right': 'cerrada derecha', 'uturn': 'U',
                            }
                            type_map = {
                                'depart': 'Inicia', 'arrive': 'Llega',
                                'turn': 'Gira', 'continue': 'Continúa',
                                'new name': 'Continúa por', 'end of road': 'Al final gira',
                                'roundabout': 'Toma rotonda', 'exit roundabout': 'Sal de rotonda',
                                'fork': 'Mantente', 'merge': 'Incorpórate',
                                'ramp': 'Toma rampa', 'off ramp': 'Sal',
                            }
                            m = step.get('maneuver', {})
                            mtype = m.get('type', '')
                            mod = m.get('modifier', '')
                            dir_text = direction_map.get(mod, mod)
                            type_text = type_map.get(mtype, mtype)
                            if mtype == 'depart' or mtype == 'arrive':
                                instruction = f'{type_text} en {step.get("name", "vía")}'
                            elif dir_text:
                                instruction = f'{type_text} a la {dir_text} en {step.get("name", "vía")}'
                            else:
                                instruction = f'{type_text} en {step.get("name", "vía")}'
                            steps.append({
                                'instruction': instruction,
                                'modifier': mod,
                                'type': mtype,
                                'distance': round(step.get('distance', 0)),
                                'duration': round(step.get('duration', 0)),
                                'name': step.get('name', ''),
                            })
                        routes.append({
                            'geometry': {'coordinates': coords, 'type': 'LineString'},
                            'legs': [{
                                'distance': legs.get('distance', 0),
                                'duration': legs.get('duration', 0),
                                'steps': steps,
                                'summary': legs.get('summary', '')
                            }]
                        })

                    risk_zones = get_risk_zones()
                    return {
                        'status': 'OK',
                        'routes': routes,
                        'weather_factor': weather,
                        'metadata': {
                            'fuente': 'OSRM + Open-Meteo',
                            'avoid_zones': [z['name'] for z in risk_zones if z.get('risk_level') == 'alta'],
                            'risk_levels': {z['name']: z['risk_level'] for z in risk_zones},
                            'timestamp': datetime.utcnow().isoformat()
                        }
                    }
        except Exception as e:
            print(f"[SafeRoute] OSRM error: {e}")

        # Fallback: simple simulated route
        risk_zones = get_risk_zones()
        route = [[origin[1], origin[0]]]
        mid = [(origin[0] + dest[0]) / 2, (origin[1] + dest[1]) / 2]
        offset = 0.0
        for z in risk_zones:
            if z.get('lat') and z.get('lon') and math.hypot(z['lat'] - mid[0], z['lon'] - mid[1]) < 0.025:
                offset = max(offset, 0.025)
        if offset:
            mid = [mid[0] + offset, mid[1] - offset]
        route.append([mid[1], mid[0]])
        route.append([dest[1], dest[0]])

        return {
            'status': 'OK',
            'routes': [{
                'geometry': {'coordinates': route},
                'legs': [{'distance': 0, 'duration': 0, 'steps': [], 'summary': ''}]
            }],
            'weather_factor': weather,
            'metadata': {
                'avoid_zones': [z['name'] for z in risk_zones if z.get('risk_level') == 'alta'],
                'risk_levels': {z['name']: z['risk_level'] for z in risk_zones},
                'fuente': 'simulado (fallback)',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
