# MyBookNook v1.0 Product Specification

## Product Goal

Launch with a strong collection-management foundation for books and vinyl, plus the minimum social infrastructure needed for users to control sharing, maintain friendships, and publish ratings/reviews.

The deeper social-network experience will be refined after launch.

---

## 1. Accounts and Profiles

Users will be able to:

- Register and sign in.
- Choose a unique username.
- Set a display name.
- Add an optional bio.
- Upload/change a profile photo.
- Use initials as an avatar fallback.
- Configure profile visibility.
- Configure collection visibility defaults.
- Configure notification preferences.
- Log out.
- Eventually delete their account/data through a production-safe workflow.

Clicking the user's avatar will expose account/profile actions including Profile Settings and Sign Out.

---

## 2. Global Book Catalog

Core book metadata:

- Title
- Author
- Publication year
- ISBN
- Cover image when available

Catalog information belongs to the global catalog and can be shared by many users.

The catalog may also expose derived community information:

- Aggregate star rating
- Rating count
- Public user reviews

Aggregate ratings should be calculated from user ratings rather than treated as manually maintained catalog metadata.

---

## 3. Global Vinyl Catalog

Core vinyl metadata:

- Album title
- Artist
- Release year
- UPC/EAN or other appropriate release identifier
- Cover image when available

Vinyl-specific edition/copy information must be modeled carefully because two users may own different pressings/releases of the same album.

Personal/release information may include:

- Collector's edition
- Special release
- Edition/pressing
- Optional edition notes

The initial implementation does not need to reproduce the full complexity of specialist record databases, but it should not assume every copy of an album is identical.

---

## 4. Personal Collection Entries

A user's personal collection entry can contain:

- Catalog item reference
- Ownership/status information
- Privacy level
- Date added
- Personal notes
- Reading status where applicable
- Custom shelves/tags
- Lending/borrowing information
- User-specific edition/copy information where applicable

Personal notes are always private.

---

## 5. Privacy

Three visibility levels:

- `PUBLIC` - visible to anyone permitted to access public MyBookNook content.
- `FRIENDS` - visible only to accepted friends.
- `PRIVATE` - visible only to the owner.

Privacy must be granular.

Users should be able to control:

- Profile visibility/defaults
- Collection visibility/defaults
- Individual collection-entry visibility
- Shelf visibility
- Other profile fields where appropriate

Individual entries can override collection defaults.

Example:

```text
Default Books: PUBLIC
Book A: PUBLIC
Book B: FRIENDS
Book C: PRIVATE
```

Personal notes and lending records remain private regardless of public collection visibility.

---

## 6. Friends

v1.0 will use mutual friendships rather than a follower model.

Required actions:

- Send friend request
- Accept request
- Decline request
- Remove friend
- Block user

Accepted friendship grants access to content marked `FRIENDS`.

---

## 7. Ratings and Reviews

Ratings:

- User star rating
- Public
- Contributes to catalog aggregate
- User can edit/remove their rating

Reviews:

- Written public review
- Associated with a user and catalog item
- User can edit/delete their own review

Personal notes:

- Separate from reviews
- Always private
- Never included in public/friend views

---

## 8. Custom Shelves / Tags

Users can create their own organization system.

Examples:

- Favorites
- Cookbooks
- Fantasy
- Signed Copies
- Halloween Reads
- Movie Soundtracks

An item may belong to multiple shelves.

Shelves can use Public/Friends/Private visibility.

---

## 9. Reading Tracking

Book collection functionality should support:

- Unread
- In Progress
- Finished
- Reading start date
- Reading finish date
- Reading progress/history where practical

Exact progress representation (page, percentage, etc.) can be finalized during implementation.

---

## 10. Wishlist

Users can keep items they do not yet own in a wishlist.

Barcode/metadata workflows should be able to warn when an item is already owned or already on the user's wishlist.

---

## 11. Lending and Borrowing

Included in v1.0.

A lending record should support:

- Collection entry
- Borrower's name or linked MyBookNook user
- Date lent
- Optional expected return date
- Return status
- Actual return date
- Private lending notes

A borrower does not need a MyBookNook account.

Lending records are private.

---

## 12. Barcode Scanning

Books:

```text
Camera -> ISBN -> metadata lookup -> catalog match/create -> user confirmation -> collection
```

Vinyl:

```text
Camera -> UPC/EAN -> metadata lookup -> catalog/release match -> user confirmation -> collection
```

Manual entry remains available when scanning or lookup fails.

---

## 13. Metadata Integration

External metadata should reduce manual entry.

Book lookup can populate appropriate catalog fields from ISBN.

Vinyl lookup can populate appropriate album/release fields from UPC/EAN or other identifiers.

Providers will be selected during implementation. The application should isolate provider-specific logic behind backend services rather than coupling UI code directly to a third-party API.

---

## 14. Search, Filter, and Sort

Search should cover relevant fields such as:

- Title/album
- Author/artist
- ISBN/identifier

Filters should include:

- Books
- Vinyl
- Owned
- Wishlist
- Reading status
- Custom shelf

Sorting should include useful options such as:

- Title
- Author/artist
- Year
- Rating
- Date added

---

## 15. Import and Export

v1.0 should support collection data portability.

Initial target:

- CSV import
- CSV export

This is especially important for users migrating large existing collections.

---

## 16. Notifications

### In-App Notifications

The application will maintain a notification center with unread state.

Potential v1 events:

- Friend request
- Friend request accepted
- Friend activity permitted by notification/privacy settings
- Lending/borrow reminders
- Relevant account/system notifications

### Push Notifications

The PWA should support opt-in web push notifications where supported by the browser/OS.

The application must request permission contextually rather than immediately demanding notification permission on first visit.

### Preferences

Users should be able to enable/disable categories such as:

- Friend requests
- Friend accepted
- Friend collection activity
- Reviews/activity
- Lending reminders
- Important account notifications

High-volume social notifications should default conservatively to avoid notification fatigue.

---

## 17. PWA / Mobile

The launch product is web-first.

Required direction:

- Responsive mobile interface
- Installable PWA
- Web app manifest
- App icons
- Service worker
- HTTPS
- Camera access for barcode scanning
- Push support where platform/browser support allows it

Full offline synchronization is not currently a v1 requirement.

---

## 18. Advertising / Monetization

MyBookNook should be architected so restrained advertising can be enabled at or near launch.

Preferred model:

- Free core application
- Clearly identified banner-style advertising
- No ads disguised as collection content
- No full-screen/interstitial ads
- No ad blocking the barcode/add-item workflow
- No ads embedded into user reviews

Potential future monetization:

- Optional ad-free/supporter tier

Ad-provider integration should occur closer to production launch because provider privacy, consent, cookie, and policy requirements can change.

---

## 19. Production Requirements

Before public launch:

- Production frontend hosting
- Production FastAPI hosting
- Managed PostgreSQL
- Object storage for profile photos and other approved uploads
- HTTPS
- Domain/DNS
- Alembic migrations
- Backups
- Logging/monitoring
- Input validation
- Authorization tests
- Secure secret management
- Upload validation
- Production CORS configuration
- Rate limiting where appropriate
- Account/data deletion workflow
- Privacy Policy
- Terms of Service
- Consent/cookie handling where required
