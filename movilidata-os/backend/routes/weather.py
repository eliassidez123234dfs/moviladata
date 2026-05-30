from fastapi import APIRouter
from datetime import datetime
import os, random
import requests

router = APIRouter()

@router.get('/api/weather')
def get_weather():
    # Try SIATA if configured
    siata_url = os.getenv('SIATA_API_URL')
    siata_key = os.getenv('SIATA_API_KEY')
    if siata_url and siata_key:
        try:
            r = requests.get(siata_url, params={'api_key': siata_key}, timeout=5)
            if r.ok:
                data = r.json()
                if 'fuente' not in data:
                    data['fuente'] = 'SIATA'
                data['source_status'] = 'ok'
                return data
        except Exception:
            pass
    # fallback mock
    now = datetime.utcnow().isoformat()
    precip = round(random.uniform(0, 20),1)
    intensity = 'baja' if precip<2 else ('moderada' if precip<8 else 'alta')
    return {
        'timestamp': now,
        'precipitacion_mmh': precip,
        'intensidad_label': intensity,
        'fuente': 'SIATA (mock)',
        'source_status': 'degraded'
    }
