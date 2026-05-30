import os, sys, logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from models import Base, Accident, SegmentoVial, ZonaRiesgo, PrediccionCongestion, CondicionClimatica, Alerta
from ingestion import (
    load_accidents_to_db, ingest_trafico, ingest_clima,
    calcular_prediccion, actualizar_zonas_riesgo, desactivar_alertas_antiguas,
    ingest_new_accidents
)
from scraper import run_scraper

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('movilidata')

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./movilidata.db')
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

limiter = Limiter(key_func=get_remote_address, default_limits=["100/hour"])

def datasource_sync():
    from providers.base import ProviderStatus
    try:
        from models import DataSource
        from datetime import datetime
        s = SessionLocal()
        try:
            for p_name, p_type in [
                ('weather', 'api_open_meteo'),
                ('traffic', 'api_sim'),
                ('accidents', 'api_arcgis'),
                ('route', 'api_osrm'),
            ]:
                existing = s.query(DataSource).filter_by(nombre=p_name).first()
                if not existing:
                    ds = DataSource(nombre=p_name, tipo=p_type, estado='registered',
                                    ultima_actualizacion=datetime.utcnow())
                    s.add(ds)
            s.commit()
        finally:
            s.close()
    except Exception as e:
        logger.warning(f"datasource_sync: {e}")

scheduler = BackgroundScheduler(daemon=True)

def create_db():
    Base.metadata.create_all(bind=engine)
    s = SessionLocal()
    try:
        if s.query(Accident).count() == 0:
            logger.info("Base vacía — cargando datos iniciales...")
            load_accidents_to_db(s, Accident)
            logger.info("Datos iniciales cargados correctamente")
    except Exception as e:
        logger.error(f"Error cargando datos iniciales: {e}")
        raise
    finally:
        s.close()

def add_scheduler_jobs():
    interval = int(os.getenv('SCHEDULER_INTERVAL_MINUTES', '5'))
    jobs = [
        (ingest_trafico_wrapper, IntervalTrigger(minutes=interval), 'trafico'),
        (ingest_clima_wrapper, IntervalTrigger(minutes=max(interval, 10)), 'clima'),
        (calcular_prediccion_wrapper, IntervalTrigger(minutes=max(interval, 30)), 'prediccion'),
        (scrape_wrapper, IntervalTrigger(minutes=interval), 'scraper'),
        (desactivar_alertas_wrapper, IntervalTrigger(minutes=60), 'limpiar_alertas'),
        (actualizar_zonas_wrapper, CronTrigger(hour=3, minute=0), 'accidentes_diarios'),
        (ingest_accidentes_wrapper, IntervalTrigger(minutes=30), 'ingesta_accidentes'),
    ]
    for fn, trigger, job_id in jobs:
        try:
            scheduler.add_job(fn, trigger, id=job_id, max_instances=1, replace_existing=True)
            logger.info(f"Job '{job_id}' registrado")
        except Exception as e:
            logger.warning(f"Job '{job_id}' falló: {e}")

def _with_session(fn, *args):
    s = SessionLocal()
    try:
        fn(s, *args)
    except Exception as e:
        logger.error(f"Task error: {e}")
    finally:
        s.close()

def ingest_trafico_wrapper():
    _with_session(ingest_trafico, SegmentoVial, Alerta)

def ingest_clima_wrapper():
    _with_session(ingest_clima, CondicionClimatica, Alerta)

def calcular_prediccion_wrapper():
    _with_session(calcular_prediccion, SegmentoVial, PrediccionCongestion)

def actualizar_zonas_wrapper():
    _with_session(actualizar_zonas_riesgo, Accident, ZonaRiesgo, Alerta)

def desactivar_alertas_wrapper():
    _with_session(desactivar_alertas_antiguas, Alerta)

def ingest_accidentes_wrapper():
    s = SessionLocal()
    try:
        nuevos = ingest_new_accidents(s, Accident, Alerta, batch_size=5)
        if nuevos > 0:
            logger.info(f"{nuevos} nuevos accidentes generados")
            actualizar_zonas_riesgo(s, Accident, ZonaRiesgo, Alerta)
    except Exception as e:
        logger.error(f"Error ingesta accidentes: {e}")
    finally:
        s.close()

def scrape_wrapper():
    logger.info("Ejecutando scrape programado...")
    try:
        data = run_scraper('scraped_data_latest.json')
        logger.info(f"Scrape OK: {len(data.get('accidents', []))} accidentes, "
                    f"{len(data.get('weather', []))} clima, {len(data.get('traffic', []))} tráfico")
    except Exception as e:
        logger.error(f"Scrape falló: {e}")

@asynccontextmanager
async def lifespan(app_fastapi):
    add_scheduler_jobs()
    try:
        scheduler.start()
        logger.info("Scheduler iniciado")
    except Exception as e:
        logger.error(f"Scheduler no inició: {e}")
        logger.warning("Continuando sin scheduler")

    try:
        create_db()
        datasource_sync()
        s = SessionLocal()
        if s.query(ZonaRiesgo).count() == 0:
            logger.info("Calculando zonas de riesgo iniciales...")
            actualizar_zonas_riesgo(s, Accident, ZonaRiesgo, Alerta)
            logger.info("Zonas de riesgo calculadas correctamente")
        s.close()
    except Exception as e:
        logger.error(f"Error BD inicial: {e}")
        raise

    yield

    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler detenido")

app = FastAPI(title='Movilidata OS', version='1.1.0', lifespan=lifespan,
              docs_url='/docs', redoc_url='/redoc')
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
)

origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
    max_age=3600
)

from routes import accidents, traffic, weather, safe_route, alerts, prediction, assistant, export, zonas_riesgo, datasources, geocode

app.include_router(accidents.router)
app.include_router(traffic.router)
app.include_router(weather.router)
app.include_router(safe_route.router)
app.include_router(alerts.router)
app.include_router(prediction.router)
app.include_router(assistant.router)
app.include_router(export.router)
app.include_router(zonas_riesgo.router)
app.include_router(datasources.router)
app.include_router(geocode.router)

@app.post('/api/scrape')
def trigger_scrape():
    try:
        stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        data = run_scraper(f'scraped_data_{stamp}.json')
        return {
            'status': 'ok',
            'accidents': len(data.get('accidents', [])),
            'weather': len(data.get('weather', [])),
            'traffic': len(data.get('traffic', [])),
            'timestamp': data.get('timestamp')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/health')
def health_check():
    db_ok = False
    try:
        s = SessionLocal()
        s.execute(text('SELECT 1'))
        s.close()
        db_ok = True
    except Exception:
        pass
    return {
        'status': 'healthy' if db_ok else 'degraded',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.1.0',
        'database': 'connected' if db_ok else 'error',
        'scheduler': 'running' if scheduler.running else 'stopped',
        'python': sys.version.split()[0],
        'modules': {
            'accidents': 'operational',
            'traffic': 'operational',
            'weather': 'operational',
            'prediction': 'operational',
            'zonas_riesgo': 'operational',
            'scraper': 'operational'
        }
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Error en {request.method} {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={
        'detail': 'Error interno del servidor',
        'path': request.url.path
    })
