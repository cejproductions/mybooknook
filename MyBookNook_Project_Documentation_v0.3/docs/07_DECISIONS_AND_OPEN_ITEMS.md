# Product Decisions and Open Items

## Decisions Already Made

### Product

-   MyBookNook supports books and vinyl.
-   It is web-first and intended to become a PWA.
-   Core collection integrity precedes deep social expansion.
-   User-facing wording should remain authentic rather than generic
    filler.

### Technology

-   React + TypeScript + Vite frontend.
-   FastAPI backend.
-   SQLAlchemy ORM.
-   PostgreSQL database.
-   Alembic migrations.
-   JWT authentication.
-   Initial production direction is a managed PaaS architecture; Render
    is the current preferred candidate.

### Catalog

-   Shared catalog records hold descriptive item/release metadata.
-   Current fields include title, creator, year, identifier, cover,
    description, edition, publisher/label, catalog number, and
    special-edition flag.
-   Community ratings/reviews belong to catalog items.

### Multiple Copies / Editions

Decision: **resolved**

-   A user may own multiple physical copies.
-   `(user_id, item_id)` is not unique.
-   Duplicate detection warns rather than blocks.
-   Each copy has independent collection metadata/privacy.
-   Ratings/reviews remain shared at catalog level.
-   Distinct releases/editions may use distinct catalog records when
    appropriate.

### Personal Collection

-   `status` represents `owned` or `wishlist`.
-   Reading status is separate from collection status.
-   Personal notes belong to the collection entry and are always
    private.
-   Acquired date belongs to the collection entry and is private in
    public projections.
-   Lending will belong to a specific collection entry.
-   Custom shelves/tags remain part of v1.

### Profile Settings and Visibility Defaults

Decision: **core behavior resolved**

-   Display name and bio are editable through Profile Settings.
-   Username and email are read-only until dedicated account workflows exist.
-   Initials are used when no profile photo is available.
-   Profile photos use a dedicated upload/remove API and storage-service boundary.
-   Local filesystem storage is used for development; production will use object storage.
-   PostgreSQL stores the photo URL/reference rather than image binary data.
-   Profile uploads accept validated JPEG/PNG/WebP files up to 5 MB and are normalized to WebP.
-   Book and vinyl visibility settings are defaults for newly added entries.
-   Existing collection entries are not bulk-modified when defaults change.
-   Per-entry visibility can override the user's default.

### Ratings and Reviews

Decision: **resolved**

-   One rating per user per catalog item.
-   One review per user per catalog item.
-   Half-star increments are supported.
-   Database stores integer rating units 1-10.
-   API/UI use 0.5-5.0 star values.
-   Ratings/reviews are public.
-   Personal notes are separate and private.
-   Ratings and reviews are optional; unrelated collection-entry edits do not create, delete, or require them.

### Privacy

-   Visibility levels are Public, Friends, Private.
-   Individual collection entries can have different visibility.
-   Public collection responses exclude personal notes and acquired
    dates.
-   Friends-only authorization will be implemented with the friendship
    system.
-   Lending records remain private.

### Social

-   Mutual friends are preferred for v1.
-   Friend request/accept/decline/remove is required.
-   Blocking is a baseline safety control.
-   Followers and deeper social features are post-launch candidates.

### Notifications

-   In-app notifications are planned.
-   Opt-in web push is planned.
-   Notification categories/preferences are planned.
-   Friend requests, acceptance, lending reminders, and selected friend
    activity are candidate events.

### Monetization

-   Core app should remain free.
-   Restrained banner advertising is acceptable.
-   Intrusive/interstitial/workflow-blocking ads are not desired.
-   An optional supporter/ad-free model may be evaluated later.

## Open Items

### Vinyl Release Depth

Determine how much additional release metadata v1 needs beyond the
fields already implemented.

Candidates:

-   Pressing
-   Vinyl color
-   Country
-   Format/speed/size
-   More detailed release identifiers

### Reading Progress

Current status model is implemented.

Still decide whether v1 additionally needs:

-   Percentage
-   Current page
-   Both
-   Status/start/finish dates only

### Profile Privacy Detail

Decide whether profile privacy should remain grouped or become per-field
for information such as:

-   Bio
-   Collection counts
-   Shelves
-   Friends

The interface should remain understandable rather than exposing
excessive configuration.

### Friend Activity Notifications

Determine eligible events and defaults. High-volume events such as every
collection addition should likely default off.

### Advertising Provider

Choose closer to launch after evaluating:

-   PWA/web compatibility
-   Revenue model
-   Privacy requirements
-   Consent/cookie requirements
-   Ad quality/control
-   Geographic requirements

### Metadata Providers

Select during catalog integration based on:

-   Coverage
-   API limits
-   Licensing/attribution
-   Cover availability
-   Vinyl release accuracy
-   Commercial-use terms

### Aggregate Rating Strategy

The current source of truth is the `Rating` table.

Decide whether catalog averages/counts should:

-   Be calculated on demand initially, or
-   Later use cached/denormalized aggregate fields if performance
    requires them

Do not introduce cached aggregates until there is a demonstrated need.

## Verified Architecture Notes

The October 1, 2026 post-migration test and October 2 Profile Settings
checkpoint confirmed:

-   Multiple copies work.
-   Shared ratings/reviews across copies work.
-   Half-star persistence works.
-   Per-copy public/private visibility works.
-   Private notes/acquired dates are excluded from public views.
-   Different vinyl editions display correctly.
-   Deleting one collection copy does not prevent the remaining copy
    from functioning.
-   Profile Settings persist after browser refresh.
-   New books and vinyl inherit their configured visibility defaults.
-   Existing entries remain unchanged when profile defaults change.
-   Ratings/reviews remain optional during unrelated item edits.
-   Profile-photo upload, persistence, replacement, removal, and initials fallback work.
-   User-upload files remain outside Git via `backend/uploads/` exclusion.
-   Production object storage remains pending.

## Scope-Control Rule

Before implementing a newly proposed feature, classify it:

``` text
1. Required for core collection integrity?
2. Required for privacy/security?
3. Required for v1 usability?
4. Social enhancement?
5. Monetization enhancement?
```

Items 1-3 are candidates for v1.

Items 4-5 should normally remain post-launch unless necessary for an
already-approved v1 requirement.
