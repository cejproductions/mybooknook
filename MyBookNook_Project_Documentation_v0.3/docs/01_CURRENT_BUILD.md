# Current Build

## Technology Stack

-   Frontend: React + TypeScript + Vite
-   Backend: Python + FastAPI
-   ORM: SQLAlchemy
-   Database: PostgreSQL
-   Database migrations: Alembic
-   Authentication: JWT
-   Current environment: local Windows development
-   API documentation: FastAPI Swagger/OpenAPI

## Current Architecture

``` text
React / TypeScript / Vite
          |
          | HTTP / JSON REST API
          v
       FastAPI
          |
          | SQLAlchemy
          v
      PostgreSQL
```

The application has been tested end to end through the browser, API,
ORM, and PostgreSQL persistence layer.

## Authentication

Implemented:

-   Registration
-   Login
-   Password hashing
-   JWT authentication
-   Authenticated collection operations
-   Current-user endpoint
-   Browser-session token storage for the development build

Production authentication/session hardening remains pre-launch work.

## User Profiles

The backend now has a dedicated `UserProfile` model separate from
account credentials.

Current profile foundation includes:

-   Display name
-   Bio
-   Profile photo URL field
-   Profile visibility
-   Books visibility default
-   Vinyl visibility default
-   Profile update API

The complete Profile Settings frontend is the next major feature phase.

## Catalog and Collection

Implemented catalog item types:

-   Book
-   Vinyl

`CatalogItem` stores shared descriptive metadata, including:

-   Kind
-   Title
-   Creator
-   Identifier
-   Cover URL
-   Year
-   Description
-   Edition
-   Publisher/label
-   Catalog number
-   Special-edition flag

`CollectionEntry` stores a user's relationship to a catalog item,
including:

-   Owned or wishlist status
-   Public/Friends/Private visibility
-   Book reading status
-   Private personal notes
-   Acquired date
-   Date added/updated

Multiple collection entries may reference the same catalog item. This
intentionally supports multiple physical copies or editions.

## Multiple Copies and Editions

The previous `UNIQUE(user_id, item_id)` restriction has been removed.

Verified behavior:

-   A user can add a second copy of the same catalog item.
-   The frontend warns before adding a detected duplicate.
-   Each copy has its own collection metadata and visibility.
-   Shared catalog-level information remains common to all copies.
-   Different vinyl editions can be represented and edition metadata
    appears in public collection views.

## Ratings and Reviews

Ratings and reviews are now separate catalog-level entities rather than
fields on `CollectionEntry`.

Rules:

-   One rating per user per catalog item.
-   One review per user per catalog item.
-   Ratings are public.
-   Reviews are public.
-   Ratings support half-star increments from 0.5 through 5.0.
-   PostgreSQL stores rating units as integers from 1 through 10.
-   API/frontend values are expressed as stars.

Example:

``` text
Frontend/API: 4.5 stars
Database:     9 units
```

This design avoids using floating-point values as the authoritative
rating representation.

A rating and review therefore remain associated with the same
book/record even when the user owns multiple physical copies.

## Privacy

Supported visibility values:

-   `public`
-   `friends`
-   `private`

Per-entry visibility is implemented.

The public collection API uses a dedicated public response schema that
excludes owner-only information.

Verified:

-   Private copies do not appear in public collections.
-   Public copies do appear.
-   Two public copies can independently appear.
-   Personal notes are not exposed publicly.
-   Acquired dates are not exposed publicly.

`friends` exists in the data model, but friendship authorization is not
yet implemented. Friends-only content must not be exposed until that
phase is complete.

## Current Interface

Implemented:

-   Responsive React interface
-   Overview
-   Books view
-   Vinyl view
-   Public collection search/view
-   Add-item modal
-   Detail/edit/delete workflow
-   Duplicate-copy warning
-   Book reading-status controls
-   Vinyl-specific behavior
-   Edition and release metadata
-   Rating/review editing
-   Existing MyBookNook branding and user-authored site copy

## Database Migration State

Alembic is established and `Base.metadata.create_all()` is no longer
used for application schema management.

Migration chain:

``` text
657d9e32a191
    |
9993b88fad9a  - user profile foundation
    |
5f12e20685d2  - catalog/collection overhaul
    |
210a60c21ca7  - ratings and reviews
    |
85be510e9b8c  - legacy collection-status normalization
```

The normalization migration repairs old collection statuses such as
`finished`, `reading`, and `listening` so they conform to the current
separation between collection ownership status and reading status.

## Post-Migration Verification

The synchronized build was manually verified for:

-   Frontend production build
-   Frontend/backend connection
-   Existing collection loading
-   Book creation/editing
-   Vinyl creation
-   Multiple vinyl editions
-   Owned/wishlist architecture
-   Reading-status architecture
-   Public/Friends/Private data model
-   Review persistence
-   Half-star rating persistence after browser refresh
-   Duplicate physical copies
-   Shared catalog-level rating/review across copies
-   Independent visibility per copy
-   Public collection filtering
-   Protection of personal notes and acquired dates
-   Individual collection-entry deletion
-   Browser-refresh persistence

## Not Yet Implemented

Major remaining v1 work includes:

-   Complete Profile Settings UI
-   Profile-photo object storage/upload
-   External metadata providers
-   Barcode scanning
-   Custom shelves/tags
-   Lending/borrowing
-   Friends/request/block system
-   Friends-only authorization
-   Aggregate catalog rating/count display
-   Notification center and web push
-   PWA installation/service worker
-   CSV import/export
-   Production hosting/hardening
-   Advertising integration
