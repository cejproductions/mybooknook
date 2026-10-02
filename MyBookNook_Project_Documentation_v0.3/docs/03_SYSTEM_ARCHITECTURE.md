# System Architecture

## Architecture Style

MyBookNook is currently a modular monolith deployed as separate
frontend, backend, and database components.

It is not a microservice architecture.

``` text
Browser / Installed PWA
        |
        | HTTPS / JSON REST
        v
React + TypeScript frontend
        |
        v
FastAPI application
        |
        +---- SQLAlchemy ----> PostgreSQL
        |
        +---- Metadata provider services (planned)
        |
        +---- Profile-photo storage service
        |         +---- Local filesystem (development)
        |         +---- Object storage (production planned)
        |
        +---- Notification/push services (planned)
```

## Development Environment

Current local flow:

``` text
Vite frontend:  http://localhost:5173
FastAPI API:    http://localhost:8000
PostgreSQL:     local PostgreSQL service
```

FastAPI exposes Swagger/OpenAPI documentation at `/docs`.

## Frontend

Technology:

-   React
-   TypeScript
-   Vite
-   CSS
-   Fetch-based REST client

Responsibilities:

-   Authentication UI
-   Collection presentation
-   Book/vinyl workflows
-   Form validation/interaction
-   Public collection presentation
-   Profile settings and profile-photo UI
-   Future friend/notification/PWA UI

The frontend must not be relied upon as the security boundary for
private information.

## Backend

Technology:

-   Python
-   FastAPI
-   SQLAlchemy
-   Pydantic
-   JWT authentication
-   Alembic

Responsibilities:

-   Authentication/authorization
-   Request validation
-   Collection/catalog business logic
-   Privacy enforcement
-   Ratings/reviews
-   Profile-photo validation/storage orchestration
-   Database transactions
-   Future metadata-provider abstraction
-   Future notification/lending/friendship services

## Database

PostgreSQL is the authoritative persistent datastore.

Current major entities:

``` text
User
 |
 +-- UserProfile
 |
 +-- CollectionEntry ----> CatalogItem
 |
 +-- Rating -------------> CatalogItem
 |
 +-- Review -------------> CatalogItem
```

Alembic owns schema evolution. Runtime `create_all()` is not used for
migration management.

Current migration head:

``` text
85be510e9b8c
```

## Catalog vs Collection Boundary

`CatalogItem` stores shared descriptive information.

`CollectionEntry` stores user-specific copy/relationship information.

This distinction enables:

-   Multiple users referencing the same item.
-   Multiple copies for one user.
-   Catalog-level ratings/reviews.
-   Per-copy privacy.
-   Per-copy notes/acquisition/lending.
-   Distinct edition/release records when appropriate.

## Ratings

The API uses star values while PostgreSQL stores integer half-star
units:

``` text
0.5 -> 1
1.0 -> 2
...
4.5 -> 9
5.0 -> 10
```

A database check constraint restricts values to the supported range.

## Privacy Boundary

Public collection endpoints use a reduced response model that excludes
private fields such as:

-   Personal notes
-   Acquired date

Future Friends-only access must be authorized server-side based on
accepted friendship state.

## Planned Production Deployment

Preferred v1 deployment direction:

``` text
GitHub
  |
  +--> Frontend static/PWA hosting
  |
  +--> FastAPI web service
            |
            +--> Managed PostgreSQL
            +--> Object storage
            +--> External metadata APIs
            +--> Push/notification provider
```

Render is the current preferred PaaS candidate for initial deployment.
Railway is a reasonable alternative. AWS remains a possible later
migration/scaling target rather than a launch requirement.

## Profile Photo Storage

The development build implements profile photos through a dedicated storage
service. Current flow:

``` text
React multipart upload
        |
        v
FastAPI /users/me/profile-photo
        |
        v
Profile Photo Storage Service
        |
        +--> backend/uploads/profile_photos/  (development)
        |
        +--> object storage                    (production planned)
```

The backend validates image content, enforces a 5 MB limit, accepts JPEG/PNG/WebP,
normalizes and resizes images, re-encodes them as WebP, and generates server-side
filenames. Replacing/removing a locally managed photo cleans up the prior object.
`backend/uploads/` is excluded from Git.

PostgreSQL stores only the profile-photo URL/reference, not image binary data.
Production deployment should swap the local storage implementation for managed
object storage without changing the frontend upload workflow or profile domain
model.

## Metadata Service Boundary

Planned backend abstraction:

``` text
React
  |
FastAPI
  |
Metadata Service Interface
  |--------------------|
Book Provider       Vinyl Provider
```

This prevents provider-specific API behavior from leaking throughout the
frontend and domain model.

## Notification Architecture

Planned flow:

``` text
Domain event
    |
Notification service
    |
Preference + privacy checks
    |
    +--> In-app notification
    |
    +--> Web push (opt-in)
```

## PWA Architecture

Planned:

-   Manifest
-   App icons
-   Service worker
-   HTTPS
-   Camera permissions for barcode scanning
-   Push subscription support

v1 is online-first. Full offline database synchronization is deferred.

## Security Principles

Production architecture should enforce:

-   Password hashing
-   Server-side authorization
-   No secrets in frontend code
-   Environment-based configuration
-   HTTPS
-   Input validation
-   Upload validation
-   Privacy-specific API tests
-   Rate limiting where appropriate
-   Managed backups
-   Logging/monitoring
