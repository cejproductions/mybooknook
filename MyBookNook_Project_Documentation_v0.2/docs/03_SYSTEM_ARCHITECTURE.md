# System Architecture

## Current Development Architecture

```text
+---------------------------+
| Browser                   |
| React + TypeScript + Vite |
| localhost:5173            |
+-------------+-------------+
              |
              | REST / JSON
              v
+---------------------------+
| FastAPI                   |
| localhost:8000            |
|                           |
| Auth / Collection / API   |
+-------------+-------------+
              |
              | SQLAlchemy
              v
+---------------------------+
| PostgreSQL                |
| localhost:5432            |
+---------------------------+
```

The user's development PC currently hosts all three layers.

---

## Planned Production Architecture

```text
                       Internet
                          |
                          v
                  +---------------+
                  | Domain / HTTPS|
                  +-------+-------+
                          |
                          v
              +-----------------------+
              | React / PWA Frontend  |
              | Static Web Hosting    |
              +-----------+-----------+
                          |
                          | HTTPS REST/JSON
                          v
              +-----------------------+
              | FastAPI Application   |
              | Cloud App Service     |
              +----+---------+--------+
                   |         |
           SQL     |         | Files
                   v         v
        +-------------+   +----------------+
        | PostgreSQL  |   | Object Storage |
        | Managed DB  |   | Profile Photos |
        +-------------+   +----------------+
                   |
                   | application events
                   v
        +--------------------------+
        | Notification Subsystem   |
        | In-app + Web Push        |
        +--------------------------+

External services may include:
- Book metadata provider
- Vinyl metadata provider
- Web push infrastructure
- Advertising provider
```

---

## Architectural Layers

### Frontend

Responsibilities:

- Rendering the interface
- Form handling
- Local UI state
- Calling backend APIs
- Barcode/camera UI
- PWA installation experience
- Displaying notification state
- Respecting server-provided authorization/visibility results

The frontend is not the security boundary. It should never be trusted to decide whether a user is allowed to access private data.

### Backend / FastAPI

Responsibilities:

- Authentication
- Authorization
- Privacy enforcement
- Business rules
- Collection operations
- Friendship operations
- Review/rating operations
- Notification generation
- Metadata-provider orchestration
- Upload authorization
- Data validation
- Import/export processing

### PostgreSQL

Source of truth for:

- Accounts/profile data
- Catalog data
- Collection entries
- Privacy values
- Friendships
- Shelves
- Ratings/reviews
- Lending records
- Notification records/preferences
- Push subscription metadata

### Object Storage

Binary uploads should not be stored directly as large PostgreSQL blobs.

Use object storage for:

- Profile photos
- Future approved user-uploaded imagery

PostgreSQL stores references/keys to those objects.

### External Metadata Services

Third-party APIs should be accessed through backend service modules.

Preferred pattern:

```text
Frontend
   |
   v
MyBookNook API
   |
   +-- BookMetadataService --> provider
   |
   +-- VinylMetadataService --> provider
```

This prevents provider API details from becoming embedded throughout the frontend and makes provider replacement easier.

---

## Notification Architecture

```text
Domain Event
   |
   +-- friend_request_created
   +-- friendship_accepted
   +-- visible_collection_item_added
   +-- review_published
   +-- lending_reminder_due
   |
   v
Notification Service
   |
   +-- Check recipient privacy/preferences
   |
   +-- Create in-app notification
   |
   +-- If opted in and supported:
          send web push
```

Notifications should be event-driven at the application level, even if the initial implementation is synchronous.

---

## Privacy Enforcement

Privacy must be enforced by FastAPI queries/services, not merely hidden in React.

Conceptual access rule:

```text
PUBLIC  -> permitted
FRIENDS -> permitted only if authenticated friendship exists
PRIVATE -> permitted only if requester owns the resource
```

Additional invariants:

- Personal notes: owner only
- Lending records: owner only
- Blocked relationships: must be respected by social/profile access rules
- Public review/rating data must not accidentally expose private collection metadata

---

## Production Deployment Principles

Development:

```text
Local React -> Local FastAPI -> Local PostgreSQL
```

Production:

```text
Hosted React/PWA -> Hosted FastAPI -> Managed PostgreSQL
```

Development remains local after launch. Tested changes are committed and deployed to production through a controlled deployment process.

Long-term CI/CD can automate:

```text
Git push
   -> automated tests
   -> build
   -> deployment
   -> health checks
```
