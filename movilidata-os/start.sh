#!/usr/bin/env bash
set -e

echo "=== Iniciando Movilidata OS ==="

# Backend
echo "[Backend] Instalando dependencias..."
cd "$(dirname "$0")/backend"
[ ! -d venv ] && python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
echo "[Backend] Iniciando servidor en puerto 8000..."
uvicorn app:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Esperar a que el backend esté listo
echo "[Backend] Esperando conexión..."
for i in $(seq 1 30); do
  if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "[Backend] Listo!"
    break
  fi
  sleep 1
done

# Frontend
echo "[Frontend] Instalando dependencias..."
cd ../frontend
npm install --silent 2>/dev/null
echo "[Frontend] Iniciando servidor en puerto 3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== Movilidata OS iniciado ==="
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
