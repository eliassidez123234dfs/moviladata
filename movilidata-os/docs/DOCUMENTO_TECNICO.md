# Documento Técnico — Movilidata OS

## Medellín — Plataforma Unificada de Movilidad Inteligente

**Versión:** 1.1  
**Fecha:** Mayo 2026  
**Evento:** HackData CTGI SENA 2026  

---

## 1. Arquitectura del Sistema

### 1.1 Visión General

Movilidata OS sigue una arquitectura de **tres capas desacopladas** (Three-Tier Architecture) con una capa transversal de inteligencia artificial:

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                  │
│              PWA (React 18 + Vite + Tailwind)            │
│  ┌──────────┬──────────┬──────────┬──────────┬─────────┐ │
│  │Dashboard │Accidentes│ Tráfico  │Predicción│Asistente│ │
│  │   KPIs   │ Heatmap  │TiempoReal│Congestión│   IA    │ │
│  └──────────┴──────────┴──────────┴──────────┴─────────┘ │
├─────────────────────────────────────────────────────────┤
│                  CAPA DE PROCESAMIENTO                    │
│              FastAPI + SQLAlchemy + APScheduler           │
│  ┌──────────┬──────────┬──────────┬─────────────────────┐ │
│  │Ingesta   │ Modelos  │ Agente   │ Gestor Resiliencia  │ │
│  │Datos     │   ML     │   IA     │ Cache + Degradación │ │
│  └──────────┴──────────┴──────────┴─────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                    CAPA DE DATOS                          │
│     SQLite + CSVs + APIs Externas + Cache Local          │
│  ┌──────────┬──────────┬──────────┬─────────────────────┐ │
│  │Medata    │ SIATA    │   SIM    │  Google Maps / OSM  │ │
│  │Accidentes│  Clima   │  Tráfico │       Mapas         │ │
│  └──────────┴──────────┴──────────┴─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Principios de Diseño

| Principio | Descripción |
|-----------|-------------|
| **Degradación Elegante** | Ningún fallo de API externa bloquea la plataforma. Cada módulo opera con datos cacheados |
| **Separación de Responsabilidades** | Cada capa es independiente y desplegable por separado |
| **Resiliencia** | Cache local + reintentos automáticos + modo offline |
| **Rendimiento** | Datos procesados en backend, visualización en frontend con memoización |
| **Accesibilidad** | WCAG 2.1 AA, navegación por teclado, contraste 4.5:1 |

---

## 2. Tecnologías Utilizadas

### 2.1 Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.2.0 | Framework de UI, componentes reutilizables |
| Vite | 4.3.9 | Bundler con HMR, build optimizado con code splitting |
| Redux Toolkit | 1.9.7 | Manejo de estado global (7 slices) |
| Tailwind CSS | 3.4.7 | Estilos utilitarios, diseño responsivo |
| React Leaflet | 4.2.1 | Mapas interactivos con OpenStreetMap |
| Leaflet.heat | 0.2.0 | Mapas de calor para densidad de accidentes |
| Recharts | 2.10.0 | Gráficos estadísticos (barras, líneas, áreas) |
| Axios | 1.6.0 | Cliente HTTP con interceptores |
| DOMPurify | 3.0.6 | Sanitización de inputs de usuario |
| VitePWA | 0.15.1 | Service worker, manifest, soporte offline |

### 2.2 Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.10+ | Lenguaje de programación principal |
| FastAPI | 0.95+ | Framework REST con validación Pydantic |
| SQLAlchemy | 2.0+ | ORM con migración SQLite ↔ PostgreSQL |
| APScheduler | 3.10+ | Tareas periódicas (ingesta cada 5 min) |
| Pandas | 2.0+ | Procesamiento de datasets CSV |
| SQLite | 3.x | Base de datos embebida (hackatón) |

### 2.3 Infraestructura

| Componente | Tecnología |
|------------|------------|
| Contenedores | Docker + Docker Compose |
| Despliegue | GitHub Pages / Netlify / Vercel (frontend) + Railway / Render (backend) |
| Mapas | OpenStreetMap + CARTO (modo oscuro) |
| Fuentes | Inter (Google Fonts) |

---

## 3. APIs y Datasets Consumidos

### 3.1 Fuentes de Datos

| Fuente | URL | Datos | Módulo | Estado |
|--------|-----|-------|--------|--------|
| Medata (Alcaldía Medellín) | https://medata.gov.co | Accidentes viales históricos | M1, M4 | Simulado (CSV local) |
| Observatorio de Movilidad | https://medellin.gov.co/es/secretaria-de-movilidad/observatorio-de-movilidad | Incidentes, víctimas, estadísticas | M1, M2 | Simulado |
| SIM Medellín | https://medellin.gov.co/es/secretaria-de-movilidad/sistema-inteligente-de-movilidad | Flujo vehicular, tráfico | M2, M3 | Simulado |
| SIATA | https://siata.gov.co | Lluvia, temperatura, clima | M4 | Simulado |
| Google Maps Platform | https://cloud.google.com/maps-platform | Mapas base, geocodificación | M2, M4 | Integración pendiente |
| OpenStreetMap | https://tile.openstreetmap.org | Mapas base (capa gratuita) | Todos | ✅ Activo |
| CARTO (modo oscuro) | https://basemaps.cartocdn.com | Mapas base modo oscuro | Todos | ✅ Activo |
| Datos Abiertos Colombia | https://datos.gov.co | Datasets complementarios | M1, M3 | Simulado |

> **Nota:** Las APIs oficiales de Medellín no estaban disponibles en tiempo real durante el hackatón. Los datos se simulan con generación procedural basada en patrones reales de movilidad, documentando claramente el estado "simulado" en la interfaz.

### 3.2 Endpoints de la API Interna

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/accidents` | GET | GeoJSON con accidentes (filtros: fecha, tipo, comuna, gravedad) |
| `/api/traffic` | GET | Estado del tráfico por segmento vial (velocidad, densidad, color) |
| `/api/weather` | GET | Condiciones climáticas actuales (precipitación, temperatura, intensidad) |
| `/api/prediction` | GET | Predicción de congestión para fecha/hora objetivo |
| `/api/safe-route` | POST | Ruta segura evitando zonas de alto riesgo |
| `/api/alerts` | GET | Alertas activas del sistema |
| `/api/alerts/history` | GET | Historial de alertas (últimas 24h) |
| `/api/assistant` | POST | Consulta al asistente IA con contexto de movilidad |
| `/api/export/{modulo}` | GET | Exportación CSV del módulo indicado |
| `/api/zonas-riesgo` | GET | Ranking de zonas críticas con índice de riesgo |
| `/api/health` | GET | Health check del sistema |
| `/api/scrape` | POST | Trigger manual de scraping |

---

## 4. Estructura de Base de Datos

### 4.1 Modelo Entidad-Relación

```
┌───────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Accident    │     │   SegmentoVial   │     │ CondicionClimatica│
├───────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)       │     │ id (PK)          │     │ id (PK)          │
│ fecha         │     │ nombre           │     │ timestamp        │
│ tipo          │     │ lat_ini, lon_ini │     │ estacion_siata   │
│ gravedad      │     │ lat_fin, lon_fin │     │ precipitacion_mmh│
│ lat, lon      │     │ velocidad_actual │     │ intensidad_label │
│ comuna        │     │ velocidad_hist   │     │ latitud          │
│ victimas      │────▶│ densidad         │────▶│ longitud         │
│ fuente        │     │ color_congestion │     │ temperature      │
└───────┬───────┘     │ ultima_actualiz  │     └──────────────────┘
        │             └──────────────────┘
        │             ┌──────────────────┐     ┌──────────────────┐
        │             │  ZonaRiesgo      │     │PrediccionCongest │
        │             ├──────────────────┤     ├──────────────────┤
        │             │ id (PK)          │     │ id (PK)          │
        │             │ nombre_sector    │     │ fecha_objetivo   │
        │             │ comuna           │     │ hora_objetivo    │
        │             │ indice_riesgo    │     │ segmento_id (FK) │
        │             │ n_accidentes     │     │ probabilidad     │
        │             │ n_victimas       │     │ nivel            │
        │             │ n_fotomultas     │     │ timestamp_calculo│
        │             │ centroide_lat    │     └──────────────────┘
        │             │ centroide_lon    │
        │             │ fecha_calculo    │
        └────────────▶└──────────────────┘

┌──────────────────┐
│     Alerta       │
├──────────────────┤
│ id (PK)          │
│ timestamp        │
│ tipo             │
│ modulo_origen    │
│ sector           │
│ severidad        │
│ descripcion      │
│ activa (bool)    │
└──────────────────┘
```

### 4.2 Diccionario de Datos

**Accident**: Almacena incidentes viales históricos cargados desde Medata/CSV.
- `gravedad`: 1 (leve), 2 (moderado), 3 (grave)
- `comuna`: Nombre de la comuna de Medellín
- `fuente`: Origen del dato (Medata, Observatorio, DatosAbiertos)

**SegmentoVial**: Representa un segmento de vía monitoreado.
- `color_congestion`: 'green' (>35 km/h), 'yellow' (20-35 km/h), 'red' (<20 km/h)
- `velocidad_historica`: Línea base para detección de anomalías

**ZonaRiesgo**: Zonas geográficas con índice de riesgo calculado.
- `indice_riesgo`: 0-1 calculado como: IR = (n_accidentes_norm * 0.5) + (n_victimas_norm * 0.3) + (n_fotomultas_norm * 0.2)

**PrediccionCongestion**: Predicciones del modelo para cada segmento.
- `nivel`: 'baja' (<0.35), 'media' (0.35-0.65), 'alta' (>0.65)

**CondicionClimatica**: Observaciones meteorológicas por estación SIATA.

**Alerta**: Alertas generadas por los módulos (tráfico, clima, accidentalidad).

---

## 5. Patrones de Diseño Implementados

### 5.1 Patrones Arquitectónicos

| Patrón | Aplicación | Ubicación |
|--------|-----------|-----------|
| **Three-Tier Architecture** | Separación en presentación, lógica y datos | Todo el sistema |
| **Proxy Pattern** | Vite proxy para comunicación frontend-backend | `vite.config.js` |
| **Repository Pattern** | SQLAlchemy ORM para abstracción de BD | `models.py`, `ingestion.py` |
| **Observer Pattern** | Redux store notifica cambios a componentes | Redux slices |
| **Singleton** | Agente IA reutilizado entre requests | `agent.py` |
| **Factory Pattern** | `createAsyncThunk` para acciones asíncronas | Redux slices |
| **Strategy Pattern** | Múltiples proveedores LLM (OpenAI, Anthropic, agente local) | `routes/assistant.py` |

### 5.2 Patrones de Frontend

| Patrón | Aplicación |
|--------|-----------|
| **Container/Presentational** | Componentes conectados a Redux separados de presentación |
| **Higher-Order Components** | ErrorBoundary wrapping de módulos |
| **Custom Hooks** | `useMemo`, `useCallback` para optimización |
| **Lazy Loading** | Code splitting con Vite (vendor, charts, maps) |

### 5.3 Patrones de Resiliencia

| Patrón | Aplicación |
|--------|-----------|
| **Circuit Breaker** | Reintentos automáticos en ingesta de datos |
| **Cache-Aside** | Cache en memoria + SQLite para datos de APIs |
| **Graceful Degradation** | Datos simulados cuando APIs no responden |
| **Retry Pattern** | APScheduler reintenta en cada ciclo |

---

## 6. Flujo General del Sistema

### 6.1 Flujo de Inicio

```
Usuario abre PWA
       │
       ▼
Service Worker sirve recursos estáticos (Cache First)
       │
       ▼
React monta aplicación, Redux inicializa estado
       │
       ▼
Dashboard solicita KPIs a /api/dashboard
       │
       ▼
Backend consulta BD local (actualizada por scheduler)
       │
       ▼
Frontend renderiza mapa Leaflet + gráficos Recharts
       │
       ▼
Service Worker cachea respuesta para modo offline
```

### 6.2 Flujo de Ingesta de Datos

```
APScheduler (cada 5 min)
       │
       ▼
┌──────────────────┐
│ ingest_trafico() │──▶ ¿API responde? ──Sí──▶ Parsear JSON ──▶ Upsert SegmentoVial
└──────────────────┘       │
                           No
                            ▼
                    Generar datos simulados
                    (patrones por hora/día)
                            │
                            ▼
                    Guardar en BD + marcar como "degradado"
```

### 6.3 Flujo del Asistente IA

```
Usuario envía pregunta
       │
       ▼
Agente IA recibe consulta
       │
       ▼
¿API Key configurada? ──Sí──▶ OpenAI / Anthropic
       │                           │
       No                           ▼
       │                    Respuesta con contexto
       ▼
       │
Agente Local (intent matching)
       │
       ▼
1. Refrescar knowledge_base desde BD
2. Detectar intent por regex
3. Consultar datos específicos
4. Construir respuesta contextual
       │
       ▼
Respuesta al usuario con citas de fuente
```

### 6.4 Flujo de Degradación Elegante

```
API externa falla (timeout, 4xx, 5xx)
       │
       ▼
1. Registrar error en log
2. Marcar fuente como 'degraded'
3. Servir último dato en caché (BD local)
4. Incluir data_freshness en respuesta
       │
       ▼
Frontend muestra banner:
"Datos no disponibles — mostrando última versión del [fecha]"
       │
       ▼
Siguiente ciclo: reintento automático
```

---

## 7. Seguridad y Ética

### 7.1 Seguridad

- **API Keys**: Almacenadas en variables de entorno (`.env`), nunca en el repositorio
- **Sanitización**: Inputs sanitizados con DOMPurify (frontend) y regex (backend)
- **Inyección SQL**: Prevenida mediante SQLAlchemy ORM (no queries raw)
- **Inyección Prompt**: System prompt restrictivo para el LLM
- **CORS**: Lista blanca de orígenes configurable
- **HTTPS**: Todas las comunicaciones con APIs externas por HTTPS
- **TrustedHost**: Middleware que valida el host

### 7.2 Ética y Privacidad

- **Datos anonimizados**: No se almacenan placas, nombres ni identificadores personales
- **Geolocalización**: Procesada solo en cliente, nunca enviada al backend
- **Transparencia**: Cada visualización muestra la fuente del dato (RF-06)
- **Uso ético**: Datos de fuentes públicas gubernamentales
- **LLM restringido**: System prompt limita respuestas a dominio de movilidad

---

## 8. Instalación y Despliegue

### 8.1 Requisitos

- Python 3.10+
- Node.js 18+
- Git

### 8.2 Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/[equipo]/movilidata-os.git
cd movilidata-os

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Editar .env con API keys si están disponibles

# Frontend
cd ../frontend
npm install
```

### 8.3 Ejecución

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Abre http://localhost:3000
```

### 8.4 Despliegue con Docker

```bash
docker-compose up --build
```

---

## 9. Métricas y Evaluación

### 9.1 Métricas de Modelos

| Modelo | MAE | RMSE | Variables |
|--------|-----|------|-----------|
| Predicción congestión | 0.12 | 0.15 | hora, día_semana, mes, festivo, clima |
| Índice de riesgo | N/A | N/A | n_accidentes, n_víctimas, n_fotomultas |

### 9.2 Métricas de Rendimiento

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| First Contentful Paint | < 3s (4G) | Lighthouse |
| Time to Interactive | < 5s | Lighthouse |
| Carga de dataset | < 5s | Backend |
| Respuesta del asistente | < 5s | Test directo |

---

## 10. Estructura del Repositorio

```
movilidata-os/
├── README.md                    # Documentación principal
├── docker-compose.yml           # Orquestación Docker
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   ├── public/
│   │   └── icons/               # Iconos PWA
│   └── src/
│       ├── main.jsx             # Entry point React
│       ├── App.jsx              # Componente principal
│       ├── index.css            # Estilos globales + Tailwind
│       ├── components/          # 15 componentes React
│       ├── redux/
│       │   ├── store.js         # Configuración Redux
│       │   └── slices/          # 7 slices (dashboard, accidents, etc.)
│       ├── services/            # API client, PWA, seguridad
│       └── constants/           # Colores, tokens de diseño
├── backend/
│   ├── Dockerfile
│   ├── app.py                   # FastAPI principal
│   ├── models.py                # Modelos SQLAlchemy
│   ├── ingestion.py             # Ingesta de datos + scheduler
│   ├── agent.py                 # Agente IA local
│   ├── scraper.py               # Web scraping (fallback simulado)
│   ├── schemas.py               # Esquemas Pydantic
│   ├── routes/                  # Endpoints por módulo
│   │   ├── accidents.py
│   │   ├── traffic.py
│   │   ├── weather.py
│   │   ├── safe_route.py
│   │   ├── prediction.py
│   │   ├── alerts.py
│   │   ├── assistant.py
│   │   ├── export.py
│   │   └── zonas_riesgo.py
│   ├── data/                    # Datasets y GeoJSON
│   └── requirements.txt
└── docs/
    ├── manual_tecnico.md
    ├── manual_usuario.md
    └── arquitectura.md
```
