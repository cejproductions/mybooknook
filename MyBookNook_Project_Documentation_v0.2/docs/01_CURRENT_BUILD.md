# Current Build

## Technology Stack

- Frontend: React + TypeScript + Vite
- Backend: Python + FastAPI
- ORM: SQLAlchemy
- Database: PostgreSQL
- Authentication: JWT
- Current environment: local Windows development
- Current API documentation: FastAPI Swagger/OpenAPI interface

## Working End-to-End Flow

The application currently follows:

```text
React frontend
      |
      | HTTP / JSON REST requests
      v
FastAPI backend
      |
      | SQLAlchemy
      v
PostgreSQL
```

The development environment has been verified end to end: a user can create an account, sign in, add an item, refresh the application, and retrieve persisted data from PostgreSQL.

## Authentication

Currently available:

- Account registration
- Login
- JWT-based authentication
- Password hashing
- Authenticated collection operations
- Browser-session token storage

Production authentication and token/session hardening remain pre-launch work.

## Collection Management

Currently available:

- Books and vinyl as catalog item types
- Manual item entry
- Add an item to a user's collection
- View collection entries
- Edit collection information
- Delete collection entries
- Book and vinyl views
- Basic search/browsing
- Ownership/wishlist-style status support
- Public/private visibility foundation

## Existing Data Model

The current core model is:

```text
User
 |
 +-- CollectionEntry
       |
       +-- CatalogItem
```

`CatalogItem` describes the item itself.

`CollectionEntry` represents a particular user's relationship to that item.

This separation will remain central to the v1 architecture.

## Duplicate Handling

When an identifier is supplied, the backend attempts to reuse an existing catalog item and prevents the same user from adding the same item twice.

Known limitation: identifier-less items need stronger duplicate detection and database-level uniqueness rules.

## Public Collection Foundation

The application already contains a basic public/discovery concept for items users choose to expose. This is not yet the complete friends/privacy/profile system planned for v1.0.

## Interface

- Responsive desktop/tablet/mobile-oriented React interface
- Separate Books and Vinyl areas
- Collection overview
- Add-item workflow
- Item detail/edit/delete flows
- MyBookNook visual branding
- CSS/HTML-created book/vinyl hero artwork
- User-authored site wording/copy

## Development-Only Elements To Replace

- `Base.metadata.create_all()` is being used for schema creation.
- Alembic migrations are not yet established.
- Production object storage is not configured.
- Push notifications are not implemented.
- Barcode scanning and external metadata retrieval are not implemented.
- Full PWA support is not implemented.
- Social friendship relationships are not implemented.
- Production hosting is not configured.
