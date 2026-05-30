import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Accident, SegmentoVial, ZonaRiesgo, PrediccionCongestion, CondicionClimatica, Alerta
from ingestion import (
    load_accidents_to_db, generate_sample_csv,
    ingest_trafico, ingest_clima, calcular_prediccion,
    actualizar_zonas_riesgo, desactivar_alertas_antiguas
)
from scraper import DataCollector, run_scraper
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from contextlib import asynccontextmanager

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./movilidata.db')
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

scheduler = BackgroundScheduler()

def create_db():
    Base.metadata.create_all(bind=engine)
    s = SessionLocal()
    try:
        cnt = s.query(Accident).count()
        if cnt == 0:
            load_accidents_to_db(s, Accident)
    finally:
        s.close()

def task_ingest_trafico():
    try:
        s = SessionLocal()
        try:
            ingest_trafico(s, SegmentoVial, Alerta)
        finally:
            s.close()
    except Exception as e:
        print(f"[Scheduler] ingest_trafico error: {e}")

def task_ingest_clima():
    try:
        s = SessionLocal()
        try:
            ingest_clima(s, CondicionClimatica, Alerta)
        finally:
            s.close()
    except Exception as e:
        print(f"[Scheduler] ingest_clima error: {e}")

def task_calcular_prediccion():
    try:
        s = SessionLocal()
        try:
            calcular_prediccion(s, SegmentoVial, PrediccionCongestion)
        finally:
            s.close()
    except Exception as e:
        print(f"[Scheduler] calcular_prediccion error: {e}")

def task_actualizar_accidentes():
    try:
        s = SessionLocal()
        try:
            actualizar_zonas_riesgo(s, Accident, ZonaRiesgo, Alerta)
        finally:
            s.close()
    except Exception as e:
        print(f"[Scheduler] actualizar_accidentes error: {e}")

def task_scrape_all():
    try:
        print("[Scraper] Ejecutando scrape programado...")
        data = run_scraper('scraped_data_latest.json')
        print(f"[Scraper] OK: {len(data.get('accidents', []))} accidentes, "
              f"{len(data.get('weather', []))} clima, {len(data.get('traffic', []))} tráfico")
    except Exception as e:
        print(f"[Scraper] Error programado: {e}")

def task_desactivar_alertas():
    try:
        s = SessionLocal()
        try:
            desactivar_alertas_antiguas(s, Alerta)
        finally:
            s.close()
    except Exception as e:
        print(f"[Scheduler] desactivar_alertas error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    interval = int(os.getenv('SCHEDULER_INTERVAL_MINUTES', '5'))
    scheduler.add_job(task_ingest_trafico, IntervalTrigger(minutes=interval), id='trafico')
    scheduler.add_job(task_ingest_clima, IntervalTrigger(minutes=max(interval, 10)), id='clima')
    scheduler.add_job(task_calcular_prediccion, IntervalTrigger(minutes=max(interval, 30)), id='prediccion')
    scheduler.add_job(task_scrape_all, IntervalTrigger(minutes=interval), id='scraper', max_instances=1)
    scheduler.add_job(task_desactivar_alertas, IntervalTrigger(minutes=60), id='limpiar_alertas')
    scheduler.add_job(task_actualizar_accidentes, CronTrigger(hour=3, minute=0), id='accidentes_diarios')
    scheduler.start()
    create_db()
    yield
    scheduler.shutdown()

app = FastAPI(title='Movilidata OS - Backend', version='1.0', lifespan=lifespan)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
)

origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST'],
    allow_headers=['Content-Type'],
    max_age=3600
)

from routes import accidents, traffic, weather, safe_route, alerts, prediction, assistant, export, zonas_riesgo

app.include_router(accidents.router)
app.include_router(traffic.router)
app.include_router(weather.router)
app.include_router(safe_route.router)
app.include_router(alerts.router)
app.include_router(prediction.router)
app.include_router(assistant.router)
app.include_router(export.router)
app.include_router(zonas_riesgo.router)

@app.post('/api/scrape')
def trigger_scrape():
    from datetime import datetime
    try:
        data = run_scraper(f'scraped_data_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json')
        return {
            'status': 'ok',
            'accidents': len(data.get('accidents', [])),
            'weather': len(data.get('weather', [])),
            'traffic': len(data.get('traffic', [])),
            'timestamp': data.get('timestamp')
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/health')
def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0',
        'scheduler_running': scheduler.running,
        'modules': {
            'accidents': 'operational',
            'traffic': 'operational',
            'weather': 'operational',
            'prediction': 'operational',
            'zonas_riesgo': 'operational',
            'scraper': 'operational'
        }
    }
