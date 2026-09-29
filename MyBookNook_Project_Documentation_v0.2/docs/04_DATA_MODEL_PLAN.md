# Data Model Plan

This document describes the target domain model. Field names and table boundaries may be refined before migrations are created.

## Core Relationship Overview

```text
User
 |-- Profile / preferences
 |-- Friendships
 |-- CollectionEntry
 |     |-- CatalogItem
 |     |-- Personal notes
 |     |-- LendingRecord
 |     `-- Shelf memberships
 |-- Rating
 |-- Review
 |-- Shelf
 `-- Notification / PushSubscription

CatalogItem
 |-- Book metadata OR Vinyl metadata/release data
 |-- Ratings
 `-- Reviews
```

---

## User

Core account identity.

Potential fields:

- id
- email
- password_hash
- username
- created_at
- updated_at
- account status

Do not store raw passwords.

## Profile

May be a separate table or an extension of User depending on final implementation.

Potential fields:

- user_id
- display_name
- bio
- avatar_object_key / avatar_url
- profile_visibility
- collection_count_visibility
- friends_visibility

The exact per-field privacy design should remain manageable; not every field necessarily needs its own database column if a structured privacy-preference model is cleaner.

## Privacy Preference

Visibility enum:

```text
PUBLIC
FRIENDS
PRIVATE
```

Support defaults plus entry-level overrides.

## CatalogItem

Shared identity for an item.

Common conceptual fields:

- id
- kind (`book` / `vinyl`)
- title
- year
- identifier
- cover reference
- created_at

Book-specific metadata:

- author
- ISBN

Vinyl-specific metadata:

- artist
- UPC/EAN
- release-related metadata as needed

A future normalized design may use subtype tables (`BookMetadata`, `VinylMetadata`) if type-specific fields grow significantly.

## CollectionEntry

Represents a user's relationship to a catalog item.

Potential fields:

- id
- user_id
- item_id
- status
- visibility
- date_added
- personal_notes
- reading_status
- reading_started_at
- reading_finished_at
- edition/copy information where appropriate

Important database constraint:

```text
UNIQUE(user_id, item_id)
```

The final constraint may need adjustment if MyBookNook intentionally supports multiple physical copies/editions of the same catalog item.

That decision should be finalized before the constraint is migrated.

## Rating

Potential fields:

- id
- user_id
- item_id
- stars
- created_at
- updated_at

Likely constraint:

```text
UNIQUE(user_id, item_id)
```

Catalog aggregate rating is derived from ratings.

## Review

Potential fields:

- id
- user_id
- item_id
- body
- created_at
- updated_at

Reviews are public under the current product decision.

Whether one user may create only one review per item should be enforced explicitly.

## Shelf

Potential fields:

- id
- user_id
- name
- visibility
- created_at

## ShelfMembership

Many-to-many relationship:

```text
Shelf <-> CollectionEntry
```

Potential fields:

- shelf_id
- collection_entry_id

An item may belong to multiple shelves.

## Friendship

Represents a mutual relationship after acceptance.

Possible implementation:

```text
FriendRequest
- sender_id
- recipient_id
- status
- created_at
- responded_at
```

and/or normalized accepted friendship records.

Required states/actions:

- pending
- accepted
- declined
- removed

The implementation must prevent duplicate/reversed duplicate requests and self-friending.

## Block

Potential fields:

- blocker_user_id
- blocked_user_id
- created_at

Blocking rules should supersede friendship/discovery behavior.

## LendingRecord

Private record associated with a collection entry.

Potential fields:

- id
- collection_entry_id
- linked_borrower_user_id (nullable)
- borrower_name (nullable)
- lent_at
- expected_return_at
- returned_at
- private_notes

At least one borrower representation should be present.

## Notification

Potential fields:

- id
- recipient_user_id
- type
- actor_user_id (nullable)
- related_entity_type (nullable)
- related_entity_id (nullable)
- read_at
- created_at

Notification payloads should avoid duplicating sensitive/private data unnecessarily.

## NotificationPreference

Potential categories:

- friend_requests
- friend_acceptance
- friend_collection_activity
- friend_reviews
- lending_reminders
- account_notifications
- push_enabled

## PushSubscription

Stores browser/PWA push subscription information.

Potential fields:

- id
- user_id
- endpoint
- public key/subscription material
- created_at
- last_used_at
- revoked_at

Push subscription information must be treated as security-sensitive application data.

---

## Global vs Personal Data

### Global

- Book title
- Author
- Publication year
- ISBN
- Book cover
- Album title
- Artist
- Release year
- UPC/EAN
- Album artwork
- Aggregate rating
- Public reviews

### User-Specific

- Owned/wishlist status
- Reading status/history
- Visibility
- Personal notes
- Custom shelves
- Lending records
- User rating
- User review authorship
- User-specific copy/edition details

### Always Private

- Personal notes
- Lending/borrowing records

---

## Migration Strategy

Before substantial schema expansion:

1. Introduce Alembic.
2. Capture the current database as a migration baseline.
3. Add schema changes through versioned migrations.
4. Never rely on deleting/recreating the production database to change schema.
5. Add database constraints and indexes alongside feature implementation.
