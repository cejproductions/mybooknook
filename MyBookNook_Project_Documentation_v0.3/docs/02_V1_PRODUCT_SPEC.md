# MyBookNook v1.0 Product Specification

## Product Goal

Launch a reliable collection manager for books and vinyl with
privacy-aware sharing, profiles, mutual friendships, public
ratings/reviews, lending support, barcode-assisted entry, and PWA
functionality. Deeper social-network features remain post-launch work.

## 1. Accounts and Profiles

v1 users should be able to:

-   Register and sign in.
-   Use a unique username.
-   Set a display name and optional bio.
-   Upload/change a profile photo.
-   Use initials as an avatar fallback.
-   Configure profile visibility.
-   Configure default book and vinyl visibility.
-   Configure notification preferences.
-   Sign out.
-   Delete their account/data through a production-safe workflow.

The Profile Settings interface is implemented for display name, bio,
initials/avatar presentation, account information, and profile/book/vinyl
visibility defaults. Username and email are currently read-only. Profile
photo upload remains pending object-storage infrastructure, and
notification preferences remain a later v1 phase.

## 2. Shared Catalog

Books and vinyl use shared `CatalogItem` records so multiple users and
multiple collection entries can reference the same canonical
item/release.

Current shared metadata supports:

-   Type
-   Title/album
-   Author/artist
-   Year
-   ISBN/UPC/EAN/other identifier
-   Cover URL
-   Description
-   Edition
-   Publisher/label
-   Catalog number
-   Special-edition flag

Metadata depth can expand as provider integrations are implemented.

## 3. Personal Collection Entries

A `CollectionEntry` represents a user's individual relationship to a
catalog item.

Current/target personal information includes:

-   Owned or wishlist state
-   Privacy level
-   Date added
-   Acquired date
-   Private personal notes
-   Reading status for books
-   Custom shelves/tags
-   Lending/borrowing state
-   Additional copy-specific information where required

Multiple copies of the same catalog item are supported.

## 4. Privacy

Visibility levels:

-   `PUBLIC`
-   `FRIENDS`
-   `PRIVATE`

Users should have granular control over:

-   Profile visibility/defaults
-   Book and vinyl visibility defaults
-   Individual collection entries
-   Shelves
-   Other profile fields where appropriate

Individual entries may override defaults.

Personal notes and lending records are always owner-only.

Public collection responses must enforce privacy at the backend
schema/authorization layer rather than relying only on hidden frontend
fields.

## 5. Friends

v1 uses mutual friendships rather than followers.

Required actions:

-   Send request
-   Accept
-   Decline
-   Remove friend
-   Block user

Accepted friendship will authorize access to eligible `FRIENDS` content.

## 6. Ratings and Reviews

Implemented architectural rules:

-   One rating per user per catalog item.
-   One review per user per catalog item.
-   Ratings and reviews are public.
-   Ratings can be edited/removed.
-   Reviews can be edited/deleted.
-   Ratings support 0.5-star increments from 0.5 to 5.0.
-   Ratings/reviews belong to the catalog item, not a physical
    collection copy.
-   Private personal notes remain technically and conceptually separate.

Planned catalog presentation:

-   Aggregate rating
-   Rating count
-   Public review list

## 7. Multiple Copies and Editions

A user may own multiple physical copies or editions of the same
work/release.

The system must:

-   Warn about likely duplicates without blocking intentional duplicate
    ownership.
-   Keep each `CollectionEntry` independently editable.
-   Preserve per-copy privacy and lending state.
-   Reuse shared catalog metadata when appropriate.
-   Allow distinct catalog/release records when edition metadata
    represents genuinely different releases.

## 8. Custom Shelves / Tags

v1 target:

-   User-created shelves
-   Many-to-many shelf membership
-   Multiple shelves per item
-   Public/Friends/Private shelf visibility

Examples include Favorites, Cookbooks, Fantasy, Signed Copies, Halloween
Reads, and Movie Soundtracks.

## 9. Reading Tracking

Books should support:

-   Unread
-   In Progress
-   Finished
-   Start date
-   Finish date

Current build implements the status foundation. More detailed
history/progress can be finalized during implementation.

## 10. Wishlist

Users can keep items they do not yet own in a wishlist.

Barcode/metadata workflows should warn when an item is already owned or
already present in the wishlist.

## 11. Lending and Borrowing

Included in v1.

A lending record should support:

-   Specific collection entry
-   Borrower's name or linked MyBookNook user
-   Date lent
-   Optional expected return date
-   Return status
-   Actual return date
-   Private notes

Borrowers do not need MyBookNook accounts. Lending records remain
private.

## 12. Barcode Scanning

Books:

``` text
Camera -> ISBN -> metadata lookup -> catalog match/create
       -> user confirmation -> collection
```

Vinyl:

``` text
Camera -> UPC/EAN -> metadata lookup -> release match/create
       -> user confirmation -> collection
```

Manual entry remains available when scanning or metadata lookup fails.

## 13. Metadata Integration

External metadata should reduce manual entry.

Provider-specific logic should be isolated behind backend services so
React does not depend directly on a third-party metadata API.

Candidate providers will be evaluated during implementation based on
coverage, licensing, limits, attribution requirements, and release
accuracy.

## 14. Search, Filter, and Sort

Search targets:

-   Title/album
-   Author/artist
-   Identifier

Filters:

-   Books/vinyl
-   Owned/wishlist
-   Reading status
-   Shelf

Sorting targets:

-   Title
-   Creator
-   Year
-   Rating
-   Date added

## 15. Import and Export

v1 should provide collection data portability, initially targeting CSV
import/export.

## 16. Notifications

v1 target:

-   In-app notification center
-   Read/unread state
-   Opt-in browser/web push
-   Friend requests
-   Friend acceptance
-   Lending reminders
-   Optional permitted friend activity
-   Account/system notices

Push permission should be requested contextually rather than immediately
on first visit.

## 17. PWA

v1 target:

-   Responsive mobile experience
-   Web app manifest
-   Installable app experience
-   Service worker
-   HTTPS production deployment
-   Camera support
-   Push support where available

The initial PWA is online-first; full offline synchronization is not
required for v1.

## 18. Advertising

Advertising may support a free product, but it must remain restrained:

-   Clearly identified banners
-   No disguised content
-   No blocking/interstitial workflow ads
-   No advertising inside private notes or review authorship controls

An optional supporter/ad-free tier can be considered after launch.

## 19. Production Requirements

Before public launch:

-   Managed PostgreSQL
-   Object storage for user uploads
-   HTTPS
-   Secret management
-   Backups
-   Logging/monitoring
-   Privacy/authorization testing
-   Upload validation
-   Account/data deletion workflow
-   Privacy Policy
-   Terms of Service
-   Applicable consent/cookie controls
