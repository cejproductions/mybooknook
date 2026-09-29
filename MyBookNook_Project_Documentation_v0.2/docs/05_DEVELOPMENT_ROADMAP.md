# Development Roadmap

This sequence prioritizes architecture and core collection behavior before production/social expansion.

## Phase 0 - Preserve Current Working Baseline

- Commit current working source to Git.
- Tag a stable development version.
- Confirm `.env`, virtual environments, and `node_modules` are excluded.
- Preserve the current database before major schema work.

## Phase 1 - Database Architecture and Migrations

- Finalize v1 entities/relationships.
- Introduce Alembic.
- Create migration baseline.
- Extend User/Profile schema.
- Add privacy enum/defaults.
- Add required indexes/constraints.
- Decide how multiple physical vinyl/book copies are represented.

Exit condition: schema can evolve without deleting existing data.

## Phase 2 - Profile Settings

- Avatar dropdown
- Profile Settings route/view
- Username
- Display name
- Bio
- Profile photo upload/preview
- Profile privacy controls
- Collection privacy defaults
- Notification settings placeholder/foundation

Exit condition: authenticated users can manage a persistent profile.

## Phase 3 - Catalog Model and Metadata

- Finalize book fields.
- Finalize vinyl/release fields.
- Create backend metadata service interfaces.
- Integrate book metadata provider.
- Integrate vinyl metadata provider.
- Cover-art handling/caching strategy.
- Improve duplicate resolution.

Exit condition: catalog records can be created reliably from identifiers or manual input.

## Phase 4 - Barcode Scanning

- Mobile camera scanner
- ISBN recognition
- UPC/EAN recognition
- Lookup preview
- Already-owned/wishlist warnings
- Confirm-before-add workflow
- Manual fallback

Exit condition: common books/vinyl can be added from a phone camera.

## Phase 5 - Collection Feature Completion

- Owned/wishlist states
- Reading statuses
- Start/finish tracking
- Personal notes
- User-specific edition/copy data
- Search
- Filtering
- Sorting
- Custom shelves
- Shelf privacy
- CSV import/export

Exit condition: MyBookNook works as a complete personal collection manager without social features.

## Phase 6 - Lending / Borrowing

- Lend an owned item
- Manual borrower name
- Optional linked MyBookNook borrower
- Lent date
- Expected return date
- Return workflow/history
- Private notes
- Reminder scheduling foundation

Exit condition: lending lifecycle works without exposing private data.

## Phase 7 - Ratings and Reviews

- Star ratings
- Public reviews
- Edit/delete own review
- Aggregate rating
- Rating count
- Catalog review display
- Keep personal notes technically and visually separate

## Phase 8 - Friends, Blocking, and Privacy Enforcement

- User search/discovery appropriate to privacy design
- Send/accept/decline friend request
- Remove friend
- Block user
- Public/Friends/Private authorization rules
- Per-entry visibility
- Profile visibility
- Privacy test suite

Exit condition: backend authorization is reliable enough that private data cannot be exposed by direct API calls.

## Phase 9 - Notifications

- Notification table/service
- Notification center
- Read/unread state
- Friend request notifications
- Friend accepted notifications
- Lending reminders
- Optional friend activity notifications
- User preferences
- Web push subscription
- PWA push delivery where supported

## Phase 10 - PWA and Mobile Polish

- Manifest
- Icons
- Service worker
- Install experience
- Mobile navigation
- Camera permission UX
- Push permission UX
- Responsive QA
- Accessibility review

## Phase 11 - Production Hardening

- Automated backend tests
- Frontend critical-flow tests
- Authorization/privacy tests
- Upload validation
- Rate limiting where appropriate
- Error handling
- Logging/monitoring
- Secret management
- Managed PostgreSQL
- Object storage
- Database backups
- HTTPS
- Domain/DNS
- Account/data deletion
- Privacy Policy
- Terms of Service
- Required consent/cookie controls

## Phase 12 - Advertising and Launch

- Select advertising provider.
- Review current provider policies/privacy requirements.
- Add reserved ad component/placements.
- Keep ads visually distinct from user/catalog content.
- Avoid interstitials and workflow-blocking ads.
- Production load/health testing.
- Launch checklist.
- Public v1.0 release.

## Development Rule

Each phase should include:

```text
Design -> Migration/API -> Frontend -> Tests -> Documentation -> Git checkpoint
```

This keeps the project understandable and makes regressions easier to isolate.
