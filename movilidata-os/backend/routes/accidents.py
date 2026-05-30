import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
from models import Accident, ZonaRiesgo, Alerta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pathlib import Path
import csv, json, random
from ingestion import ingest_new_accidents, actualizar_zonas_riesgo

router = APIRouter()

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./movilidata.db')
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class AccidentCreate(BaseModel):
    fecha: str = Field(default_factory=lambda: datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'))
    tipo: str = Field(default='Choque')
    gravedad: int = Field(default=1, ge=1, le=3)
    lat: float = Field(..., ge=6.0, le=6.5)
    lon: float = Field(..., ge=-75.7, le=-75.5)
    comuna: str = Field(default='')
    victimas: int = Field(default=0, ge=0)
    fuente: str = Field(default='API manual')

    @validator('tipo')
    def validate_tipo(cls, v):
        allowed = ['Choque', 'Atropello', 'Caída', 'Volcamiento', 'Colisión', 'Otro']
        if v not in allowed:
            raise ValueError(f'Tipo debe ser uno de: {", ".join(allowed)}')
        return v

@router.get('/api/accidents')
def get_accidents(
    q: str = Query(None, description='Búsqueda textual (comuna, tipo, descripción)'),
    limit: int = Query(None, description='Máximo de resultados', ge=1, le=10000),
    offset: int = Query(0, description='Desplazamiento', ge=0),
    fecha_inicio: str = Query(None, description='Filtro fecha inicio (YYYY-MM-DD)'),
    fecha_fin: str = Query(None, description='Filtro fecha fin (YYYY-MM-DD)'),
    comuna: str = Query(None, description='Filtrar por comuna'),
    tipo: str = Query(None, description='Filtrar por tipo de accidente'),
    db: Session = Depends(get_db)
):
    query = db.query(Accident)

    if q:
        search = f'%{q}%'
        query = query.filter(
            Accident.comuna.ilike(search) |
            Accident.tipo.ilike(search) |
            Accident.fuente.ilike(search)
        )
    if fecha_inicio:
        query = query.filter(Accident.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(Accident.fecha <= fecha_fin)
    if comuna:
        query = query.filter(Accident.comuna.ilike(f'%{comuna}%'))
    if tipo:
        query = query.filter(Accident.tipo.ilike(f'%{tipo}%'))

    total = query.count()

    query = query.order_by(Accident.fecha.desc()).offset(offset)
    if limit:
        query = query.limit(limit)
    else:
        query = query.limit(10000)

    rows = query.all()
    features = []
    for r in rows:
        features.append({
            'type': 'Feature',
            'properties': {
                'id': r.id,
                'fecha': r.fecha,
                'tipo': r.tipo,
                'gravedad': r.gravedad,
                'comuna': r.comuna,
                'victimas': r.victimas,
                'fuente': r.fuente,
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [r.lon, r.lat]
            }
        })
    return {
        'type': 'FeatureCollection',
        'features': features,
        'total': total,
        'offset': offset,
        'returned': len(features)
    }

@router.post('/api/accidents')
def create_accident(req: AccidentCreate, db: Session = Depends(get_db)):
    try:
        accident = Accident(
            fecha=req.fecha,
            tipo=req.tipo,
            gravedad=req.gravedad,
            lat=req.lat,
            lon=req.lon,
            comuna=req.comuna,
            victimas=req.victimas,
            fuente=req.fuente
        )
        db.add(accident)
        comuna_accidents = db.query(Accident).filter(Accident.comuna == req.comuna).count()
        if comuna_accidents % 10 == 0:
            zonas_route = next((r for r in db.query(ZonaRiesgo).filter(ZonaRiesgo.nombre_sector == req.comuna).all()), None)
            if zonas_route:
                db.add(Alerta(
                    timestamp=datetime.utcnow(),
                    tipo='Nuevo accidente',
                    modulo_origen='Accidentalidad',
                    sector=req.comuna,
                    severidad='alta' if req.gravedad >= 2 else 'baja',
                    descripcion=f'Accidente {req.tipo} (gravedad {req.gravedad}) registrado en {req.comuna}',
                    activa=True
                ))
        db.commit()
        db.refresh(accident)
        return {
            'status': 'ok',
            'id': accident.id,
            'message': f'Accidente registrado en {req.comuna}'
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/api/accidents/ingest')
def ingest_accidents(count: int = Body(default=10, embed=True), db: Session = Depends(get_db)):
    try:
        nuevos = ingest_new_accidents(db, Accident, Alerta, batch_size=count)
        if nuevos > 0:
            actualizar_zonas_riesgo(db, Accident, ZonaRiesgo, Alerta)
        return {
            'status': 'ok',
            'nuevos': nuevos,
            'message': f'{nuevos} nuevos accidentes registrados'
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
