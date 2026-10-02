from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


Visibility = Literal["private", "friends", "public"]
CollectionStatus = Literal["owned", "wishlist"]
ReadingStatus = Literal["unread", "in_progress", "finished"]


# ---------------------------------------------------------
# Authentication
# ---------------------------------------------------------

class RegisterIn(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=40,
        pattern=r"^[a-zA-Z0-9_]+$",
    )

    email: EmailStr

    password: str = Field(
        min_length=10,
        max_length=128,
    )


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------------------------
# User / Profile
# ---------------------------------------------------------

class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    display_name: str
    bio: str
    profile_photo_url: str | None

    profile_visibility: str
    books_visibility: str
    vinyl_visibility: str


class ProfilePatch(BaseModel):
    display_name: str | None = Field(
        default=None,
        max_length=100,
    )

    bio: str | None = Field(
        default=None,
        max_length=5000,
    )

    profile_photo_url: str | None = None

    profile_visibility: Visibility | None = None
    books_visibility: Visibility | None = None
    vinyl_visibility: Visibility | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: EmailStr
    profile: ProfileOut


# ---------------------------------------------------------
# Catalog
# ---------------------------------------------------------

class ItemIn(BaseModel):
    kind: Literal["book", "vinyl"]

    title: str = Field(
        min_length=1,
        max_length=300,
    )

    creator: str = Field(
        default="",
        max_length=300,
    )

    identifier: str | None = Field(
        default=None,
        max_length=64,
    )

    cover_url: str | None = None

    year: int | None = Field(
        default=None,
        ge=1400,
        le=2200,
    )

    description: str = ""

    edition: str | None = Field(
        default=None,
        max_length=150,
    )

    publisher_label: str | None = Field(
        default=None,
        max_length=200,
    )

    catalog_number: str | None = Field(
        default=None,
        max_length=100,
    )

    special_edition: bool = False


class ItemOut(ItemIn):
    model_config = ConfigDict(from_attributes=True)

    id: str


# ---------------------------------------------------------
# Collection
# ---------------------------------------------------------

class EntryIn(BaseModel):
    item: ItemIn

    status: CollectionStatus = "owned"
    visibility: Visibility = "private"

    reading_status: ReadingStatus | None = None

    personal_notes: str = Field(
        default="",
        max_length=5000,
    )

    acquired_at: datetime | None = None


class EntryPatch(BaseModel):
    status: CollectionStatus | None = None
    visibility: Visibility | None = None

    reading_status: ReadingStatus | None = None

    personal_notes: str | None = Field(
        default=None,
        max_length=5000,
    )

    acquired_at: datetime | None = None


class EntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    visibility: str
    reading_status: str | None

    personal_notes: str
    acquired_at: datetime | None

    added_at: datetime
    updated_at: datetime

    item: ItemOut


# Public responses intentionally exclude personal notes
# and other owner-only copy information.

class PublicEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    visibility: str
    reading_status: str | None

    added_at: datetime

    item: ItemOut


# ---------------------------------------------------------
# Ratings
# ---------------------------------------------------------

class RatingIn(BaseModel):
    stars: float = Field(
        ge=0.5,
        le=5.0,
        multiple_of=0.5,
    )


class RatingOut(BaseModel):
    id: str
    user_id: str
    item_id: str

    stars: float

    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------
# Reviews
# ---------------------------------------------------------

class ReviewIn(BaseModel):
    body: str = Field(
        min_length=1,
        max_length=5000,
    )


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    item_id: str

    body: str

    created_at: datetime
    updated_at: datetime