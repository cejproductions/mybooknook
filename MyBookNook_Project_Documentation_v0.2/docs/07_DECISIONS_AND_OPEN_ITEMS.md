# Product Decisions and Open Items

## Decisions Already Made

### Product
- MyBookNook supports both books and vinyl.
- The application is web-first and intended to become a PWA.
- Core collection functionality should be complete before deep social expansion.
- User-facing wording should be authentic and intentionally written, not generic filler copy.

### Catalog
- Books: Title, Author, Year, ISBN.
- Vinyl: Album/title, Artist, Year, appropriate identifier.
- Cover artwork should be supported when metadata provides it.
- Core item information belongs to a shared global catalog.
- Community aggregate ratings and public reviews are associated with catalog items.

### Personal Collection
- Personal notes belong to the user's copy/entry and are always private.
- Lending/borrowing belongs to the user's copy/entry and is private.
- Custom shelves/tags are desired.
- Lending/borrowing is included in v1.0.

### Privacy
- Visibility levels are Public, Friends, Private.
- Users should have granular control over profile and collection visibility.
- Individual collection items can have different visibility.
- Ratings and written reviews are public.
- Personal notes are private.

### Social
- Mutual friends are preferred over a follower-only system for v1.0.
- Friend requests/acceptance are required.
- Blocking should be included as a baseline safety control.
- Deeper social features are primarily post-launch work.

### Notifications
- In-app notifications are planned.
- Opt-in web push notifications are planned.
- Notification categories/preferences are planned.
- Examples include friend requests, friend acceptance, permitted friend collection activity, and lending reminders.

### Monetization
- Core app should remain free.
- Restrained banner-style advertising is acceptable.
- Intrusive/interstitial/workflow-blocking ads are not desired.
- An optional ad-free/supporter model can be considered later.

---

## Open Items To Finalize During Design

These do not block the overall architecture but should be resolved before their implementation phase.

### Multiple Copies / Editions
Can one user own multiple physical copies of the same book/album?

This matters for:
- `UNIQUE(user_id, item_id)`
- Collector editions
- Vinyl pressings
- Lending individual copies

A copy-aware model may ultimately be preferable for collectors.

### Vinyl Release Depth
How much release detail should v1.0 capture?

Candidates:
- Pressing
- Edition
- Label
- Catalog number
- Vinyl color
- Collector/special edition flag

### Reading Progress
Should progress be:
- Status only
- Percentage
- Current page
- Both page and percentage

### Review Rules
Confirm whether:
- One review per user per catalog item
- One rating per user per catalog item

This is the recommended v1 rule.

### Profile Field Privacy
Decide whether privacy is:
- A small number of grouped profile privacy controls, or
- Per-field controls for bio, counts, shelves, friends, etc.

The goal should be granular control without creating an overwhelming settings screen.

### Friend Activity Notifications
Determine which activities are eligible and default settings. High-volume activity such as every new collection addition should likely default off.

### Advertising Provider
Do not choose until closer to launch. Evaluate:
- PWA/web compatibility
- Revenue model
- Privacy requirements
- Consent/cookie requirements
- Ad quality/control
- Geographic requirements

### Metadata Providers
Select during catalog implementation after evaluating:
- Coverage
- API limits
- Licensing/attribution
- Book cover availability
- Vinyl release accuracy
- Commercial-use terms

---

## Scope-Control Rule

A newly proposed feature should be classified before implementation:

```text
1. Required for core collection integrity?
2. Required for privacy/security?
3. Required for v1 usability?
4. Social enhancement?
5. Monetization enhancement?
```

Items 1-3 are candidates for v1.0.

Items 4-5 should normally remain post-launch unless they are necessary to support the already-approved v1 architecture.
