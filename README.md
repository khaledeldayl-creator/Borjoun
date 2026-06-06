# Borjoun Full-Stack Platform

A production-ready full-stack reward and offerwall platform built with a Next.js frontend, FastAPI backend, Celery worker, Redis, and PostgreSQL.

This repository is structured for container-free native execution, making it lightweight and easy to deploy on standard virtual machines or run locally on Windows.

---

## Folder Structure

```text
├── backend/                       # FastAPI Backend
│   ├── app/
│   │   ├── api/                   # Router and API Endpoints
│   │   ├── core/                  # Database, Security, and Configs
│   │   ├── models/                # SQLAlchemy Models
│   │   ├── schemas/               # Pydantic Schemas
│   │   ├── services/              # Business Logic (Postback, Fraud detection)
│   │   ├── worker/                # Celery Background Tasks
│   │   └── main.py                # FastAPI Application Entrypoint
│   ├── .env.example               # Backend Environment Template
│   └── requirements.txt           # Python Dependencies
│
├── frontend/                      # Next.js Frontend
│   ├── public/                    # Static Assets
│   ├── src/                       # React Components and Utilities
│   ├── .env.example               # Frontend Environment Template
│   ├── next.config.ts             # Next.js Configurations (with API rewrites)
│   └── package.json               # Node.js Dependencies and Scripts
│
└── DESIGN.md                      # UI and Layout Design Guidelines
```

---

## Prerequisites (External Services)

To run the application, you need instances of **PostgreSQL** and **Redis** running on your system or accessible externally:

1. **PostgreSQL** (v15+ recommended):
   - Database name: `borjoun`
   - User: `postgres`
   - Password: `postgres`
   - Port: `5432`

2. **Redis** (v7+ recommended):
   - Running locally or externally on port `6379`

---

## Environment Variables Setup

Before running the application, configure your environments:

1. **Backend**:
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your custom API keys for anti-fraud systems (IPQualityScore, ProxyCheck) and postback secrets if needed.
   - Adjust `DATABASE_URL` and `REDIS_URL` if they are not running on localhost defaults.

2. **Frontend**:
   - Copy `frontend/.env.example` to `frontend/.env`
   - Ensure `BACKEND_URL` is set to your running FastAPI instance (defaults to `http://localhost:8000/api`).

---

## Run Instructions (Windows)

Follow these steps to run each component in separate PowerShell/CMD windows.

### 1. Run the Backend API

1. Navigate to the `backend` folder:
   ```powershell
   cd backend
   ```
2. Create and activate a Python virtual environment (recommended):
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install the dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the FastAPI server using Uvicorn:
   ```powershell
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *The API will be available at `http://localhost:8000`.*

### 2. Run the Celery Worker

1. Open a new PowerShell terminal and navigate to the `backend` folder:
   ```powershell
   cd backend
   ```
2. Activate your virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
3. Start the Celery worker:
   ```powershell
   celery -A app.core.celery_app worker --loglevel=info --pool=solo
   ```
   > [!NOTE]
   > On Windows, Celery requires the `--pool=solo` flag to run tasks sequentially in a single process without causing compatibility crashes with the default unix `prefork` behavior.

### 3. Run the Frontend (Next.js)

1. Open a new PowerShell terminal and navigate to the `frontend` folder:
   ```powershell
   cd frontend
   ```
2. Install the required Node.js dependencies:
   ```powershell
   npm install
   ```
3. Build the production package or start the development server:
   - **For Development**:
     ```powershell
     npm run dev
     ```
     *The frontend will run at `http://localhost:3000` with hot-reloading.*
   - **For Production Build**:
     ```powershell
     npm run build
     npm run start
     ```

---

## Key Integrations & Features Kept Intact

- **Anti-Fraud System**: Real-time checking and logging using ProxyCheck and IPQualityScore keys.
- **Offerwall Postbacks**: Verifies signatures for ad network integrations (CPX Research, AdGate, Lootably, Torox) secure postbacks.
- **Next.js Client-Side Routing**: Next.js automatically rewrites all `/api` requests to the local backend port `8000` during development, eliminating the need for Nginx.
