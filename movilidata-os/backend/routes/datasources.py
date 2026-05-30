from fastapi import APIRouter
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import DataSource
import os

router = APIRouter()

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./movilidata.db')
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

@router.get('/api/datasources')
def get_datasources():
    session = SessionLocal()
    try:
        sources = session.query(DataSource).order_by(DataSource.nombre).all()
        return {
            'sources': [{
                'id': s.id,
                'nombre': s.nombre,
                'tipo': s.tipo,
                'estado': s.estado,
                'ultima_exitosa': s.ultima_exitosa.isoformat() if s.ultima_exitosa else None,
                'ultimo_error': s.ultimo_error.isoformat() if s.ultimo_error else None,
                'errores_consecutivos': s.errores_consecutivos,
                'total_errores': s.total_errores,
                'tiempo_respuesta_promedio_ms': s.tiempo_respuesta_promedio_ms,
                'ultima_actualizacion': s.ultima_actualizacion.isoformat() if s.ultima_actualizacion else None,
            } for s in sources],
            'total': len(sources)
        }
    finally:
        session.close()

@router.post('/api/datasources/sync')
def sync_datasources():
    from providers.base import ProviderStatus
    from providers.implementations import provider_registry, get_provider
    session = SessionLocal()
    try:
        for domain, providers in provider_registry.items():
            for mode, provider_cls in providers.items():
                existing = session.query(DataSource).filter_by(nombre=domain).first()
                if not existing:
                    session.add(DataSource(
                        nombre=domain,
                        tipo=provider_cls().status.source_type,
                        estado='registered'
                    ))
        session.commit()
        count = session.query(DataSource).count()
        return {'status': 'ok', 'total': count}
    finally:
        session.close()
