

<div align="center">

# Movilidata OS — Medellín

**Plataforma Unificada de Movilidad Inteligente**

[![HackData](https://img.shields.io/badge/event-HackData%20CTGI%20SENA%202026-2563EB?style=flat-square)](https://github.com)
[![Status](https://img.shields.io/badge/status-Producci%C3%B3n-brightgreen?style=flat-square)]()
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.95-009688?style=flat-square&logo=fastapi)]()
[![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=flat-square&logo=python)]()
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwindcss)]()
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)]()
[![PWA](https://img.shields.io/badge/PWA-Instalable-5A0FC8?style=flat-square&logo=pwa)]()

Monitoreo en tiempo real + predicción de congestión + detección de zonas críticas + rutas seguras + asistente conversacional IA

</div>

---

## Arquitectura

```
┌────────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN                        │
│              React 18 + Vite 4 + Redux Toolkit + Tailwind 3        │
│  ┌──────────┬──────────┬──────────┬──────────┬───────────────────┐ │
│  │Dashboard │Accidentes│  Tráfico │Predicción│  Asistente IA     │ │
│  │  KPIs    │ Heatmap  │TiempoReal│Congestión│  (3 proveedores)  │ │
│  └──────────┴──────────┴──────────┴──────────┴───────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│                         CAPA DE PROCESAMIENTO                      │
│          FastAPI + SQLAlchemy 2.0 + APScheduler + Pydantic         │
│  ┌──────────┬──────────┬──────────┬──────────────────────────────┐ │
│  │  Ingesta │  Modelos │  Agente  │   Gestor de Resiliencia     │ │
│  │  Periód. │  Analít. │  IA Local│   Cache + Degradación       │ │
│  └──────────┴──────────┴──────────┴──────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│                          CAPA DE DATOS                             │
│         SQLite + CSVs + APIs Externas + Caché en Memoria          │
│  ┌──────────┬──────────┬──────────┬──────────────────────────────┐ │
│  │  Medata  │  SIATA   │   SIM    │  OpenStreetMap / Google     │ │
│  │Accidentes│  Clima   │  Tráfico │        Mapas                │ │
│  └──────────┴──────────┴──────────┴──────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Principios de Diseño

| Principio | Implementación |
|-----------|---------------|
| **Degradación Elegante** | Datos simulados cuando APIs no responden, banners informativos |
| **Resiliencia** | Cache local + APScheduler reintenta cada ciclo |
| **Rendimiento** | Procesamiento en backend, memoización en frontend |
| **Accesibilidad** | WCAG 2.1 AA, navegación teclado, contraste 4.5:1 |
| **Modo Offline** | Service Worker con estrategia Cache First |

---

## Módulos Funcionales

| # | Módulo | Descripción | SRS |
|---|--------|-------------|-----|
| M1 | **Dashboard** | KPIs unificados: total accidentes, tráfico, clima, alertas activas | RF-23 |
| M2 | **Zonas Críticas** | Mapa de calor con filtros por comuna, tipo y gravedad | RF-01 a RF-06 |
| M3 | **Tráfico** | Monitoreo por segmento vial con colores, tablas y CSV | RF-07 a RF-11 |
| M4 | **Predicción** | Modelo de riesgo + congestión con horizonte 2-4h | RF-12 a RF-16 |
| M5 | **Rutas Seguras** | Cálculo evitando zonas de alto riesgo + clima actual | RF-17 a RF-21 |
| M6 | **Asistente IA** | Chat con contexto de movilidad (local/OpenAI/Claude) | RF-26 a RF-29 |
| M7 | **Alertas** | Historial 24h, filtros, exportación CSV | RF-30 a RF-32 |

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18.2 | UI con componentes reutilizables |
| Vite | 4.3 | Bundler, HMR, code splitting |
| Redux Toolkit | 1.9 | Estado global (7 slices) |
| Tailwind CSS | 3.4 | Estilos utilitarios responsivos |
| React Leaflet | 4.2 | Mapas interactivos OSM |
| Leaflet.heat | 0.2 | Mapas de calor |
| Recharts | 2.10 | Gráficos (barras, línea, área) |
| VitePWA | 0.15 | Service Worker + Manifest |

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Python | 3.10+ | Lenguaje principal |
| FastAPI | 0.95+ | REST API con validación |
| SQLAlchemy | 2.0+ | ORM multicapa |
| APScheduler | 3.10+ | Tareas periódicas (c/5 min) |
| Pandas | 2.0+ | Procesamiento de datasets |
| SQLite | 3.x | Base de datos embebida |

---

## Instalación

### Requisitos
- Python 3.10+
- Node.js 18+
- Git

### Local

```bash
git clone <repo-url>
cd movilidata-os

# Backend
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --host 0.0.0.0 --port 8000

# Frontend (nueva terminal)
cd frontend
npm install
npm run dev
# Abre http://localhost:3000
```

### Docker

```bash
docker-compose up --build
```

---

## Variables de Entorno (`.env`)

```
DATABASE_URL=sqlite:///./movilidata.db
OPENAI_API_KEY=sk-...              # opcional
ANTHROPIC_API_KEY=sk-ant-...       # opcional
SIATA_API_KEY=                     # opcional
GOOGLE_MAPS_API_KEY=               # opcional
SCHEDULER_INTERVAL_MINUTES=5
```

> Sin API keys, el sistema opera completamente funcional con agente IA local entrenado en +5000 registros de accidentes.

---

## API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/accidents` | GET | GeoJSON accidentes (filtros: fecha, tipo, comuna, gravedad, q) |
| `/api/traffic` | GET | Estado tráfico por segmento vial |
| `/api/weather` | GET | Condiciones climáticas actuales |
| `/api/prediction` | GET | Predicción congestión para fecha/hora |
| `/api/safe-route` | POST | Ruta segura (origen, destino, prioridad) |
| `/api/alerts` | GET | Alertas activas del sistema |
| `/api/alerts/history` | GET | Historial últimas 24h |
| `/api/assistant` | POST | Consulta al asistente IA |
| `/api/export/{modulo}` | GET | Exportación CSV |
| `/api/zonas-riesgo` | GET | Ranking zonas críticas |
| `/api/health` | GET | Health check |

---

## Datasets

| Dataset | Registros | Fuente | Estado |
|---------|-----------|--------|--------|
| Accidentes viales | 5.000 | Medata (simulado) | ✅ Cargado |
| Segmentos viales | 15 | SIM (simulado) | ✅ Monitoreado |
| Condiciones climáticas | 12 estaciones | SIATA (simulado) | ✅ Actualizado |
| Zonas de riesgo | 10 comunas | Cálculo propio | ✅ Calculado |

---

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [Documento Técnico](docs/DOCUMENTO_TECNICO.md) | Arquitectura detallada, patrones, BD, APIs, flujos |
| [Manual Técnico](docs/manual_tecnico.md) | Instalación, configuración, despliegue |
| [Manual de Usuario](docs/manual_usuario.md) | Guía de uso de cada módulo |
| [Arquitectura](docs/arquitectura.md) | Diagramas y decisiones arquitectónicas |

---

## Licencia

Proyecto académico — HackData CTGI SENA 2026.

---

<div align="center">
  <sub>Hecho con ❤️ para la movilidad de Medellín</sub>
</div>
