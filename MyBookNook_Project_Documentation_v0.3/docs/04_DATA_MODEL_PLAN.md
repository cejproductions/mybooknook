# Data Model

## Status

The core catalog/collection/rating/review model is implemented.
Additional v1 entities will be added through Alembic migrations.

## Current Relationships

``` text
User
 |
 +-- 1:1 UserProfile
 |
 +-- 1:M CollectionEntry M:1 CatalogItem
 |
 +-- 1:M Rating          M:1 CatalogItem
 |
 +-- 1:M Review          M:1 CatalogItem
```

## User

Purpose: authentication/account identity.

Core fields:

-   `id`
-   `username`
-   `email`
-   `password_hash`
-   `created_at`

Profile information is intentionally separated into `UserProfile`.

## UserProfile

Purpose: public/personal profile settings.

Current fields include:

-   `id`
-   `user_id`
-   `display_name`
-   `bio`
-   profile photo URL
-   profile visibility
-   books visibility
-   vinyl visibility
-   timestamps

Future profile preferences can extend this model or related settings
models.

## CatalogItem

Purpose: shared descriptive metadata for a book or vinyl release.

Current fields:

-   `id`
-   `kind`
-   `title`
-   `creator`
-   `identifier`
-   `cover_url`
-   `year`
-   `description`
-   `edition`
-   `publisher_label`
-   `catalog_number`
-   `special_edition`

Important rule: a catalog item is not a user's physical copy.

## CollectionEntry

Purpose: represent one user's individual collection relationship/copy.

Current fields:

-   `id`
-   `user_id`
-   `item_id`
-   `status`
-   `visibility`
-   `reading_status`
-   `personal_notes`
-   `acquired_at`
-   `added_at`
-   `updated_at`

Current `status` values:

-   `owned`
-   `wishlist`

Current book `reading_status` values:

-   `unread`
-   `in_progress`
-   `finished`

The old uniqueness restriction on `(user_id, item_id)` has been removed.
Multiple copies are intentional.

## Rating

Purpose: public user rating of a catalog item.

Rules:

-   One rating per user/catalog item.
-   Stored as integer units 1-10.
-   API/UI expose 0.5-5.0 stars.
-   Cascade with user/catalog item deletion as defined by the
    implemented foreign keys.

This model belongs to the catalog relationship, not a collection copy.

## Review

Purpose: public written review of a catalog item.

Rules:

-   One review per user/catalog item.
-   Review body is separate from private personal notes.
-   User may edit/delete their review.
-   Review is associated with the catalog item rather than a collection
    copy.

## Public Collection Projection

Public API responses intentionally omit owner-only collection fields.

Publicly eligible collection information can include:

-   Entry identity
-   Catalog item
-   Collection status
-   Visibility
-   Reading status
-   Added/updated timestamps

Owner-only information includes:

-   Personal notes
-   Acquired date
-   Future lending records

## Multiple Copies / Editions

The model distinguishes two concepts:

1.  Multiple `CollectionEntry` rows can point to the same `CatalogItem`
    when the user owns multiple copies of the same catalog
    representation.
2.  Different releases/editions can be represented as distinct catalog
    records when their release metadata requires independent identity.

This is particularly important for vinyl collectors.

## Planned Shelf Model

Target:

``` text
User
 |
 +-- Shelf
       |
       +-- ShelfMembership --> CollectionEntry
```

A collection entry may belong to multiple shelves.

Shelf visibility should support Public/Friends/Private.

## Planned Lending Model

Target relationship:

``` text
CollectionEntry
      |
      +-- LendingRecord
```

Fields should include borrower information, lent date, expected return,
returned date/state, and private notes.

Lending records are always private.

## Planned Friendship Model

A friendship/request model must support:

-   Pending requests
-   Accepted friendships
-   Declined/cancelled handling
-   Removal
-   Blocking

The exact table design should prioritize unambiguous authorization
queries and uniqueness constraints.

## Planned Notification Model

Likely entities:

-   Notification
-   NotificationPreference
-   PushSubscription

Notifications should reference domain events/resources without
duplicating sensitive content unnecessarily.

## Privacy Rules

Visibility values:

-   `public`
-   `friends`
-   `private`

Backend authorization is authoritative.

Personal notes and lending information remain private regardless of
entry visibility.

## Migration History

Current chain:

``` text
657d9e32a191  baseline
9993b88fad9a  user profiles
5f12e20685d2  catalog/collection overhaul
210a60c21ca7  ratings/reviews
85be510e9b8c  legacy collection-status normalization
```

The final migration converts legacy states such as `finished` and
`reading` into the current ownership + reading-status model and
normalizes legacy vinyl `listening` state.
