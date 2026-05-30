from fastapi import APIRouter, Query
from .traffic import get_active_alerts, get_alert_history, get_traffic

router = APIRouter()

@router.get('/api/alerts')
def get_alerts():
    active = get_active_alerts()
    return {
        'alerts': active,
        'count': len(active),
        'timestamp': active[0]['timestamp'] if active else None
    }

@router.get('/api/alerts/history')
def get_history(modulo: str = Query(None, description='Filtrar por módulo de origen')):
    history = get_alert_history()
    if modulo:
        history = [item for item in history if item.get('modulo_origen') == modulo]
    return {
        'history': history,
        'count': len(history)
    }
