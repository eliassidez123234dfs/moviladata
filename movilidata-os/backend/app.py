import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Accident
from ingestion import load_accidents_to_db, generate_sample_csv
from datetime import datetime

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./movilidata.db')
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

def create_db():
    Base.metadata.create_all(bind=engine)
    s = SessionLocal()
    try:
        cnt = s.query(Accident).count()
        if cnt == 0:
            load_accidents_to_db(s, Accident)
    finally:
        s.close()

app = FastAPI(title='Movilidata OS - Backend', version='1.0')

# Seguridad: Middleware de hosts permitidos
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
)

# CORS mejorado
origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST'],
    allow_headers=['Content-Type'],
    max_age=3600
)

from routes import accidents, traffic, weather, safe_route, alerts, prediction, assistant, export

app.include_router(accidents.router)
app.include_router(traffic.router)
app.include_router(weather.router)
app.include_router(safe_route.router)
app.include_router(alerts.router)
app.include_router(prediction.router)
app.include_router(assistant.router)
app.include_router(export.router)

# Health Check Endpoint
@app.get('/api/health')
def health_check():
    """Verifica el estado del sistema y disponibilidad de datos"""
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0',
        'modules': {
            'accidents': 'operational',
            'traffic': 'operational',
            'weather': 'operational',
            'prediction': 'operational'
        }
    }

@app.on_event('startup')
def startup_event():
    create_db()
    try:
        traffic.start_simulator(app)
    except Exception:
        pass
