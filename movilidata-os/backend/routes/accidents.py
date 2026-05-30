from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import Accident
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from pathlib import Path
import csv, json

router = APIRouter()

DB_URL = 'sqlite:///./movilidata.db'
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('/api/accidents')
def get_accidents(fecha_inicio: str = None, fecha_fin: str = None, db: Session = Depends(get_db)):
    q = db.query(Accident)
    if fecha_inicio:
        q = q.filter(Accident.fecha >= fecha_inicio)
    if fecha_fin:
        q = q.filter(Accident.fecha <= fecha_fin)
    rows = q.limit(10000).all()
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
    return {'type': 'FeatureCollection', 'features': features}
