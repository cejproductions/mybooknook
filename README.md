# MyBookNook — full-stack starter

A responsive social collection tracker for books and vinyl records. Built with React + TypeScript + Vite, FastAPI + SQLAlchemy, and PostgreSQL.

## What works in this starter
- Register, sign in, sign out; hashed passwords and expiring bearer tokens.
- Personal book/vinyl collection: add manually, search, update status, rating, review, visibility; remove items.
- Public collection lookup by username (only entries marked public).
- Responsive dashboard, book/vinyl sections, and item detail dialogs.
- PostgreSQL-backed catalog shared by users; duplicate detection for identified items.

## Not implemented yet
- Camera/barcode scanning; ISBN/UPC metadata APIs; actual PWA install/service worker.
- Following/feed, password reset, email verification, cover uploads, migrations, pagination.
- Production-grade auth (refresh/revocation, rate limiting, secure cookie strategy), moderation, privacy/legal flows.
- Vinyl pressing disambiguation, multi-copy ownership, richer catalog normalization.

**This is a development scaffold, not a production-ready social service. Do not deploy publicly as-is.**

## Prerequisites
- Python 3.12+ (3.10 may work with compatible dependencies)
- Node.js 20.19+ or 22.12+ (Vite 6 supports earlier Node 20 versions, but use a current LTS)
- PostgreSQL 16 or Docker Desktop
- Windows PowerShell or VS Code terminal

## 1. Database
From the repository root, if you use Docker:
```powershell
docker compose up -d db
```
If you use a local PostgreSQL install instead, create database `mybooknook`, user `booknook`, and set its password; update `backend/.env` accordingly.

## 2. Backend (PowerShell)
```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```
Edit `.env` and replace `JWT_SECRET` with a long random secret. You can generate one using:
```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```
Then start:
```powershell
uvicorn app.main:app --reload
```
API: http://localhost:8000/docs and health: http://localhost:8000/health

## 3. Frontend (second terminal)
```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```
Open http://localhost:5173

If PowerShell blocks activation, use `.venv\Scripts\python.exe -m uvicorn app.main:app --reload` from `backend` instead.

## Development notes
- Database tables are created on backend startup **for local development only**. Add Alembic migrations before deployment.
- Auth tokens are kept in `sessionStorage` for this starter. This is not a complete production session architecture.
- External cover URLs are displayed directly; do not assume arbitrary external images will always load.
- Frontend requests require the backend to be running and the `FRONTEND_ORIGIN` setting to match the frontend URL.
- The sample Docker credentials are for **local development only**. Use managed secrets and a restricted database user in production.
- The project uses network-loaded Google Fonts; system fonts are used as fallback.

## Suggested next milestones
1. Run and debug the starter end-to-end; add backend tests.
2. Add Alembic and a proper item/edition model.
3. Implement book ISBN lookup + confirmation screen.
4. Prototype camera barcode scanning on actual Android and iPhone browsers.
5. Add PWA manifest/service worker, then vinyl release lookup.
6. Harden auth/privacy and add social features before inviting external testers.
