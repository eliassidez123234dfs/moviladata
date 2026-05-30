from fastapi import APIRouter
from datetime import datetime, timedelta
import os, random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

router = APIRouter()

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./movilidata.db')
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

alert_history = []

REAL_VIAS = [
    'Av. El Poblado', 'Av. Las Vegas', 'Av. Oriental', 'Av. Ferrocarril',
    'Av. 33', 'Av. Guayabal', 'Av. San Juan', 'Av. Nutibara',
    'Calle 10', 'Calle 30', 'Calle 50', 'Circular 1',
    'Transversal Inferior', 'Autopista Sur', 'Av. Bolivariana'
]

def via_speed(hour, base_speed=None):
    if base_speed is None:
        base_speed = random.uniform(28, 48)
    if 6 <= hour <= 9:
        factor = random.uniform(0.45, 0.70)
    elif 16 <= hour <= 19:
        factor = random.uniform(0.50, 0.75)
    elif 22 <= hour or hour <= 4:
        factor = random.uniform(1.0, 1.3)
    else:
        factor = random.uniform(0.75, 0.95)
    return max(8, round(base_speed * factor, 1))

def build_summary(segments):
    if not segments: return {'velocidad_promedio': 0, 'vias_congestionadas': 0, 'peores_vias': []}
    speeds = [s['velocidad'] for s in segments]
    worst = sorted(segments, key=lambda s: s['velocidad'])[:3]
    return {
        'velocidad_promedio': round(sum(speeds) / len(speeds), 1),
        'vias_congestionadas': sum(1 for s in segments if s['color'] == 'red'),
        'peores_vias': [s['name'] for s in worst]
    }

def build_alerts(segments):
    alerts = []
    for s in segments:
        if s['color'] == 'red':
            alerts.append({
                'id': f'traffic_alert_{s["id"]}',
                'timestamp': datetime.utcnow().isoformat(),
                'tipo': 'Congestión',
                'modulo_origen': 'Tráfico',
                'sector': s['name'],
                'severidad': 'alta',
                'descripcion': f'Velocidad reducida: {s["velocidad"]} km/h en {s["name"]} — hora pico',
                'activa': True
            })
    return alerts

def get_traffic_from_db():
    try:
        from models import SegmentoVial
        session = SessionLocal()
        try:
            segments_db = session.query(SegmentoVial).order_by(SegmentoVial.nombre).all()
            if segments_db:
                segments = []
                for seg in segments_db:
                    speed = seg.velocidad_actual or via_speed(datetime.now().hour, random.uniform(25, 45))
                    color = 'green' if speed > 35 else ('yellow' if speed > 20 else 'red')
                    segments.append({
                        'id': f'vial_{seg.id}',
                        'name': seg.nombre,
                        'velocidad': speed,
                        'densidad': seg.densidad or max(0, int(100 - speed)),
                        'color': color
                    })
                return segments
        finally:
            session.close()
    except Exception as e:
        print(f"[Traffic] DB error: {e}")
    return None

def generate_estimated_traffic():
    hour = datetime.now().hour
    segments = []
    for idx, name in enumerate(REAL_VIAS):
        speed = via_speed(hour)
        density = max(0, int(100 - speed))
        color = 'green' if speed > 35 else ('yellow' if speed > 20 else 'red')
        segments.append({
            'id': f'est_{idx}',
            'name': name,
            'velocidad': speed,
            'densidad': density,
            'color': color
        })
    return segments

@router.get('/api/traffic')
def get_traffic():
    now = datetime.utcnow().isoformat()
    segments = get_traffic_from_db()
    source = 'SIM (caché DB)'
    source_status = 'ok'

    if not segments:
        segments = generate_estimated_traffic()
        source = 'Estimado por hora/día — SIM no disponible'
        source_status = 'estimado'

    summary = build_summary(segments)
    alerts = build_alerts(segments)
    update_alert_history(alerts)

    city_state = 'flujo normal'
    if summary['vias_congestionadas'] > 5:
        city_state = 'congestión crítica'
    elif summary['vias_congestionadas'] > 2:
        city_state = 'congestión moderada'

    return {
        'last_update': now,
        'source': source,
        'source_status': source_status,
        'segments': segments,
        'summary': summary,
        'alerts': alerts,
        'city_state': city_state,
        'total_vias': len(segments)
    }

def get_active_alerts():
    data = get_traffic()
    return data.get('alerts', [])

def get_alert_history():
    cutoff = datetime.utcnow() - timedelta(hours=24)
    return [item for item in alert_history if datetime.fromisoformat(item['timestamp']) >= cutoff]

def update_alert_history(alerts):
    for a in alerts:
        alert_history.append(a)
    cutoff = datetime.utcnow() - timedelta(hours=24)
    alert_history[:] = [a for a in alert_history if datetime.fromisoformat(a['timestamp']) >= cutoff]
