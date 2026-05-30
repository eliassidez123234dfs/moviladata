from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .traffic import traffic_state
from .weather import get_weather
from datetime import datetime
import os, requests

router = APIRouter()

class AssistantRequest(BaseModel):
    pregunta: str


def build_context():
    weather = get_weather()
    traffic_summary = traffic_state.get('summary', {})
    active_alerts = traffic_state.get('alerts', [])
    return {
        'tráfico': {
            'velocidad_promedio': traffic_summary.get('velocidad_promedio', 0),
            'vias_congestionadas': traffic_summary.get('vias_congestionadas', 0),
            'peores_vias': traffic_summary.get('peores_vias', [])
        },
        'clima': weather,
        'alertas': [a['descripcion'] for a in active_alerts[:3]]
    }


def build_system_prompt():
    return (
        'Eres un asistente especializado en movilidad urbana de Medellín. Responde en español colombiano, ' 
        'usa datos actuales de tráfico, clima y accidentalidad, cita la fuente cuando sea posible, y ' 
        'si la pregunta no está relacionada con movilidad urbana de Medellín, indica que tu especialidad es ese dominio. '
        'No inventes datos. Mantén el tono claro y profesional.'
    )


def call_openai(question, context):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise RuntimeError('OpenAI API key no configurada')
    endpoint = 'https://api.openai.com/v1/chat/completions'
    messages = [
        {'role': 'system', 'content': build_system_prompt()},
        {'role': 'user', 'content': f'Contexto actual: {context}'},
        {'role': 'user', 'content': question}
    ]
    resp = requests.post(endpoint, json={
        'model': 'gpt-3.5-turbo',
        'messages': messages,
        'temperature': 0.2,
        'max_tokens': 250
    }, headers={
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }, timeout=12)
    resp.raise_for_status()
    data = resp.json()
    return data['choices'][0]['message']['content'].strip()


def call_anthropic(question, context):
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        raise RuntimeError('Anthropic API key no configurada')
    prompt = (
        f"\n\nSystem: {build_system_prompt()}\n\n"
        f"Contexto actual: {context}\n\nHuman: {question}\n\nAssistant:"
    )
    endpoint = 'https://api.anthropic.com/v1/complete'
    resp = requests.post(endpoint, json={
        'model': 'claude-2.1',
        'prompt': prompt,
        'max_tokens_to_generate': 250,
        'temperature': 0.2,
        'stop_sequences': ['\nHuman:']
    }, headers={
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }, timeout=12)
    resp.raise_for_status()
    data = resp.json()
    return data.get('completion', '').strip()


def fallback_answer(question, context):
    traffic = context['tráfico']
    clima = context['clima']
    alerts = context['alertas']
    parts = [
        'Actualmente, la velocidad promedio de tráfico estimada es de',
        f"{traffic.get('velocidad_promedio', 0)} km/h.",
        f"Hay {traffic.get('vias_congestionadas', 0)} vías con congestión alta.",
        f"El clima actual indica {clima.get('intensidad_label', 'sin datos')} con {clima.get('precipitacion_mmh', 0)} mm/h.",
    ]
    if alerts:
        parts.append('Alertas activas: ' + '; '.join(alerts[:2]) + '.')
    parts.append('Para preguntas más complejas, habilita OPENAI_API_KEY o ANTHROPIC_API_KEY.')
    return ' '.join(parts)

@router.post('/api/assistant')
def assistant(req: AssistantRequest):
    question = req.pregunta.strip()
    if not question:
        raise HTTPException(status_code=400, detail='La pregunta no puede estar vacía.')
    context = build_context()
    try:
        if os.getenv('OPENAI_API_KEY'):
            response = call_openai(question, context)
            provider = 'OpenAI'
        elif os.getenv('ANTHROPIC_API_KEY'):
            response = call_anthropic(question, context)
            provider = 'Anthropic'
        else:
            response = fallback_answer(question, context)
            provider = 'fallback'
    except Exception as exc:
        response = fallback_answer(question, context)
        provider = 'fallback'

    return {
        'pregunta': question,
        'respuesta': response,
        'proveedor': provider,
        'contexto': context,
        'timestamp': datetime.utcnow().isoformat()
    }
