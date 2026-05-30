from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import List
import os, requests
from pathlib import Path
import math
import csv
from datetime import datetime

router = APIRouter()

class Coordinates(BaseModel):
    lat: float = Field(..., ge=4.5, le=6.5)
    lon: float = Field(..., ge=-76, le=-75)

    @validator('lat', 'lon')
    def validate_coordinates(cls, v):
        if not isinstance(v, (int, float)):
            raise ValueError('Coordenada debe ser numérica')
        return float(v)


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


def distance(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def compute_risk_centroids(n=5):
    datafile = Path(__file__).parent.parent / 'data' / 'accidents_sample.csv'
    if not datafile.exists():
        return []
    stats = {}
    try:
        with open(datafile, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for r in reader:
                c = r.get('comuna') or 'NA'
                lat = float(r.get('lat', 0))
                lon = float(r.get('lon', 0))
                if lat == 0 or lon == 0:
                    continue
                if c not in stats:
                    stats[c] = {'count': 0, 'lat_sum': 0, 'lon_sum': 0}
                stats[c]['count'] += 1
                stats[c]['lat_sum'] += lat
                stats[c]['lon_sum'] += lon
        items = []
        for k, v in stats.items():
            items.append({
                'name': k,
                'count': v['count'],
                'lat': v['lat_sum'] / v['count'],
                'lon': v['lon_sum'] / v['count'],
                'risk_level': 'alta' if v['count'] > 50 else 'media'
            })
        items.sort(key=lambda x: x['count'], reverse=True)
        return items[:n]
    except Exception as e:
        return []


@router.post('/api/safe-route')
def safe_route(req: RouteRequest):
    """Calcula una ruta segura evitando zonas de alta accidentalidad"""
    try:
        origin = req.origen
        dest = req.destino
        gkey = os.getenv('GOOGLE_MAPS_API_KEY')
        
        if gkey:
            try:
                params = {
                    'origin': f"{origin[0]},{origin[1]}",
                    'destination': f"{dest[0]},{dest[1]}",
                    'key': gkey,
                    'alternatives': 'true'
                }
                r = requests.get('https://maps.googleapis.com/maps/api/directions/json', 
                               params=params, timeout=8)
                if r.ok and r.json().get('routes'):
                    return r.json()
            except Exception:
                pass
        
        # Fallback: ruta simulada evitando zonas de riesgo
        centroids = compute_risk_centroids(5)
        route = [[origin[1], origin[0]]]
        mid = [(origin[0] + dest[0]) / 2, (origin[1] + dest[1]) / 2]
        
        offset = 0.0
        for c in centroids:
            c_lat, c_lon = c['lat'], c['lon']
            if distance([c_lat, c_lon], mid) < 0.02:
                offset = 0.02
        
        if offset:
            mid = [mid[0] + offset, mid[1] - offset]
        
        route.append([mid[1], mid[0]])
        route.append([dest[1], dest[0]])
        
        return {
            'status': 'OK',
            'routes': [{
                'geometry': {
                    'coordinates': route
                },
                'legs': [{
                    'distance': {'value': 0},
                    'duration': {'value': 0}
                }]
            }],
            'metadata': {
                'avoid_zones': [c['name'] for c in centroids],
                'risk_levels': {c['name']: c['risk_level'] for c in centroids},
                'fuente': 'simulado',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
