# Architecture v0.1
React/Vite -> REST/JSON -> FastAPI -> SQLAlchemy -> PostgreSQL.
The catalog item is shared across users; collection entries store user-specific ownership/status/review/visibility.
The public collection endpoint returns only entries with visibility=public.
Local development uses startup create_all; migrations and security hardening are required before public deployment.
