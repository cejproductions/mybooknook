# Development Roadmap

## Development Rule

Each phase follows:

``` text
Design -> Migration/API -> Frontend -> Tests -> Documentation -> Git checkpoint
```

## Phase 0 - Working Baseline

Status: **Complete**

-   Working React/FastAPI/PostgreSQL application.
-   Git baseline established.
-   Existing source and documentation preserved.

## Phase 1 - Database Architecture and Migrations

Status: **Complete**

Completed:

-   Alembic introduced.
-   Runtime `create_all()` removed.
-   User profile foundation added.
-   Catalog/collection architecture expanded.
-   Multiple-copy restriction removed.
-   Ratings/reviews separated from collection entries.
-   Half-star storage model implemented.
-   Legacy collection statuses normalized.
-   Migration chain verified.
-   End-to-end post-migration testing completed.

Current migration head:

``` text
85be510e9b8c
```

## Phase 2 - Profile Settings

Status: **Next**

Planned:

-   Avatar/profile menu
-   Profile Settings view
-   Display name
-   Bio
-   Profile photo upload/preview
-   Initials fallback
-   Profile visibility
-   Book visibility default
-   Vinyl visibility default
-   Account information
-   Save/cancel UX
-   Notification-preference foundation where appropriate

Exit condition: authenticated users can manage a persistent profile
through the UI.

## Phase 3 - Catalog Model and Metadata

Status: **Core model complete; provider integration pending**

Remaining:

-   Select book metadata provider.
-   Select vinyl metadata provider.
-   Backend provider interfaces/services.
-   Cover-art handling.
-   Improve catalog matching/duplicate resolution.
-   Refine vinyl release depth as needed.

Exit condition: catalog records can be created reliably from identifiers
or manual entry.

## Phase 4 - Barcode Scanning

-   Mobile camera scanner
-   ISBN recognition
-   UPC/EAN recognition
-   Metadata lookup preview
-   Owned/wishlist warnings
-   Duplicate-copy confirmation
-   Manual fallback

Exit condition: common books/vinyl can be added efficiently from a phone
camera.

## Phase 5 - Collection Feature Completion

Partially complete:

-   Owned/wishlist states
-   Reading-status foundation
-   Personal notes
-   Acquired date
-   Multiple copies
-   Edition/release fields
-   Public/Friends/Private entry visibility
-   Basic collection/public views

Remaining:

-   Start/finish dates/history
-   Search/filter/sort expansion
-   Custom shelves
-   Shelf privacy
-   CSV import/export
-   Additional copy-specific metadata where justified

Exit condition: MyBookNook functions as a complete personal collection
manager without requiring social features.

## Phase 6 - Lending / Borrowing

-   Lend a specific owned copy
-   Manual borrower
-   Optional linked MyBookNook borrower
-   Lent date
-   Expected return date
-   Return workflow/history
-   Private notes
-   Reminder foundation

Exit condition: complete private lending lifecycle.

## Phase 7 - Ratings and Reviews

Status: **Core create/edit/persist architecture implemented**

Completed:

-   Separate rating model
-   Separate review model
-   One rating/review per user/catalog item
-   Half-star support
-   Public review/rating ownership at catalog level
-   Edit/save behavior

Remaining:

-   Aggregate rating
-   Rating count
-   Public catalog review display/discovery
-   Broader review presentation UX

## Phase 8 - Friends, Blocking, and Privacy Enforcement

-   User discovery
-   Send/accept/decline request
-   Remove friend
-   Block user
-   Friends-only authorization
-   Profile privacy enforcement
-   Privacy test suite

Current public/private collection behavior is implemented and verified.
Friends-only authorization remains pending.

## Phase 9 - Notifications

-   Notification table/service
-   Notification center
-   Read/unread state
-   Friend-request events
-   Friend-accepted events
-   Lending reminders
-   Optional collection activity
-   Preferences
-   Web push subscriptions

## Phase 10 - PWA and Mobile Polish

-   Manifest
-   Icons
-   Service worker
-   Install UX
-   Mobile navigation QA
-   Camera permission UX
-   Push permission UX
-   Accessibility review

## Phase 11 - Production Hardening

-   Automated backend tests
-   Frontend critical-flow tests
-   Authorization/privacy tests
-   Upload validation
-   Rate limiting where appropriate
-   Error handling/logging
-   Secret management
-   Managed PostgreSQL
-   Object storage
-   Backups
-   HTTPS
-   Domain/DNS
-   Account/data deletion
-   Privacy Policy
-   Terms of Service
-   Applicable consent controls

## Phase 12 - Advertising and Launch

-   Select provider.
-   Review provider/privacy requirements.
-   Add restrained banner placements.
-   Keep ads visually distinct.
-   Avoid workflow-blocking/interstitial advertising.
-   Production health/load checks.
-   Launch checklist.
-   Public v1.0 release.
