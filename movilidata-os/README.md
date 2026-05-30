# Movilidata OS — MVP

Proyecto MVP para el HackData CTGI SENA 2026. Incluye backend en FastAPI y frontend en React + Vite.

Instalación rápida (backend):

```bash
cd movilidata-os/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

Front-end rápido (desarrollo):

```bash
cd movilidata-os/frontend
npm install
npm run dev
```

El backend genera `accidents_sample.csv` con 5000 registros sintéticos si no existe.
