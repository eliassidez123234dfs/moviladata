from fastapi import APIRouter
import threading, time, random
from datetime import datetime, timedelta

router = APIRouter()

traffic_state = {
    'last_update': None,
    'source': 'simulado',
    'source_status': 'degraded',
    'segments': [],
    'summary': {},
    'alerts': []
}

alert_history = []


def build_summary(segments):
    if not segments:
        return {
            'velocidad_promedio': 0,
            'vias_congestionadas': 0,
            'peores_vias': []
        }
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
                'id': f'alert_{s["id"]}_{datetime.utcnow().isoformat()}',
                'timestamp': datetime.utcnow().isoformat(),
                'tipo': 'Congestión',
                'modulo_origen': 'Tráfico',
                'sector': s['name'],
                'severidad': 'alta',
                'descripcion': f'Velocidad crítica de {s["velocidad"]} km/h',
                'activa': True
            })
    return alerts


def clean_alert_history():
    cutoff = datetime.utcnow() - timedelta(hours=24)
    alert_history[:] = [item for item in alert_history if datetime.fromisoformat(item['timestamp']) >= cutoff]


def update_alert_history(alerts):
    for alert in alerts:
        alert_history.append(alert)
    clean_alert_history()


def simulate_once():
    segments = []
    for i in range(1, 9):
        base_speed = random.uniform(20, 50)
        hour = datetime.now().hour
        if 6 <= hour <= 9 or 16 <= hour <= 19:
            base_speed *= random.uniform(0.5, 0.9)
        density = max(0, int(100 - base_speed))
        color = 'green' if base_speed > 35 else ('yellow' if base_speed > 20 else 'red')
        segments.append({
            'id': f'segment_{i}',
            'name': f'Vía {i}',
            'velocidad': round(base_speed, 1),
            'densidad': density,
            'color': color
        })
    traffic_state['segments'] = segments
    traffic_state['summary'] = build_summary(segments)
    traffic_state['alerts'] = build_alerts(segments)
    traffic_state['last_update'] = datetime.utcnow().isoformat()
    traffic_state['source'] = 'simulado'
    traffic_state['source_status'] = 'degraded'
    update_alert_history(traffic_state['alerts'])


def traffic_thread(loop_seconds=300):
    while True:
        try:
            simulate_once()
        except Exception:
            pass
        time.sleep(loop_seconds)


@router.get('/api/traffic')
def get_traffic():
    if traffic_state['last_update'] is None:
        simulate_once()
    return traffic_state


def get_active_alerts():
    if traffic_state['last_update'] is None:
        simulate_once()
    return traffic_state.get('alerts', [])


def get_alert_history():
    clean_alert_history()
    return list(alert_history)


def start_simulator(app):
    t = threading.Thread(target=traffic_thread, args=(300,), daemon=True)
    t.start()
