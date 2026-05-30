import time, logging
from fastapi import APIRouter, HTTPException, Query
import requests

logger = logging.getLogger('movilidata')
router = APIRouter()

geocode_cache = {}
reverse_cache = {}
last_request = [0.0]
NOMINATIM_URL = "https://nominatim.openstreetmap.org"

def _rate_limited_get(url, params):
    now = time.time()
    since_last = now - last_request[0]
    if since_last < 1.1:
        time.sleep(1.1 - since_last)
    last_request[0] = time.time()
    params['format'] = 'json'
    resp = requests.get(url, params=params, timeout=8,
                        headers={'User-Agent': 'MovilidataOS/1.0 (hackaton sena; elias@movilidata.co)'})
    return resp

@router.get('/api/geocode')
def geocode(q: str = Query(..., min_length=3)):
    key = q.lower().strip()
    if key in geocode_cache:
        return geocode_cache[key]

    try:
        resp = _rate_limited_get(f"{NOMINATIM_URL}/search",
                                  {'q': q, 'limit': 6, 'countrycodes': 'co', 'addressdetails': 1})
        if resp.status_code != 200:
            raise HTTPException(503, 'Servicio de geocodificación no disponible')
        data = resp.json()
        geocode_cache[key] = data
        return data
    except requests.RequestException as e:
        raise HTTPException(503, f'Error de conexión con Nominatim: {e}')

@router.get('/api/geocode/reverse')
def reverse_geocode(lat: float = Query(...), lon: float = Query(...)):
    key = f"{lat:.4f},{lon:.4f}"
    if key in reverse_cache:
        return reverse_cache[key]

    try:
        resp = _rate_limited_get(f"{NOMINATIM_URL}/reverse",
                                  {'lat': lat, 'lon': lon, 'addressdetails': 1})
        if resp.status_code != 200:
            raise HTTPException(503, 'Geocodificación inversa no disponible')
        data = resp.json()
        reverse_cache[key] = data
        return data
    except requests.RequestException as e:
        raise HTTPException(503, f'Error de conexión con Nominatim: {e}')
