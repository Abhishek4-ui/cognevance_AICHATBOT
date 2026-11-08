#!/usr/bin/env bash

# ==============================================================================
# NeuroChat AI — Single Command Startup Script (macOS / Linux)
# Starts Flask Backend (Port 5000) & React Vite Frontend (Port 5173)
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "        🧠 Starting NeuroChat AI Platform v2.0            "
echo "=========================================================="

# Check Python environment
if [ ! -d "venv" ]; then
    echo "==> Creating Python virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install --upgrade pip
    ./venv/bin/pip install -r requirements.txt
    ./venv/bin/python -m spacy download en_core_web_sm
fi

# Check model artifacts
if [ ! -f "models/intent_linear_svm.joblib" ]; then
    echo "==> Model artifacts not detected. Running training pipeline..."
    PYTHONPATH=. ./venv/bin/python training/train_models.py
fi

# Check frontend node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "==> Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "==> Starting Flask Backend on http://localhost:5001 ..."
PYTHONPATH=. ./venv/bin/python backend/app.py &
BACKEND_PID=$!

echo "==> Starting Vite Frontend on http://localhost:5173 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "echo '==> Shutting down NeuroChat AI...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

echo ""
echo "=========================================================="
echo "  🚀 NeuroChat AI is running and ready!                  "
echo "  ------------------------------------------------------  "
echo "  🌐 Frontend Application: http://localhost:5173         "
echo "  ⚙️ Backend REST API:     http://localhost:5001/api     "
echo "  🩺 Health Diagnostics:   http://localhost:5001/api/health"
echo "  ------------------------------------------------------  "
echo "  🔑 Default Super Admin Credentials:                    "
echo "     Email:    admin@neurochat.ai                         "
echo "     Password: admin123                                   "
echo "=========================================================="
echo "Press Ctrl+C to stop both servers."
echo ""

wait
