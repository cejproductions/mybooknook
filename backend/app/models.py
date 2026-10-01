import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    String,
    Text,
    ForeignKey,
    DateTime,
    Integer,
    Boolean,
    CheckConstraint,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    username: Mapped[str] = mapped_column(
        String(40),
        unique=True,
        index=True,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
    )

    profile: Mapped["UserProfile"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )

    display_name: Mapped[str] = mapped_column(
        String(100),
        default="",
    )

    bio: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    profile_photo_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    profile_visibility: Mapped[str] = mapped_column(
        String(10),
        default="public",
    )

    books_visibility: Mapped[str] = mapped_column(
        String(10),
        default="private",
    )

    vinyl_visibility: Mapped[str] = mapped_column(
        String(10),
        default="private",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

    user: Mapped["User"] = relationship(
        back_populates="profile",
    )


class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    kind: Mapped[str] = mapped_column(
        String(10),
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(300),
        index=True,
    )

    creator: Mapped[str] = mapped_column(
        String(300),
        default="",
    )

    identifier: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        index=True,
    )

    cover_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    edition: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    publisher_label: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    catalog_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    special_edition: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

class CollectionEntry(Base):
    __tablename__ = "collection_entries"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    item_id: Mapped[str] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"),
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="owned",
    )

    visibility: Mapped[str] = mapped_column(
        String(10),
        default="private",
    )

    reading_status: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    personal_notes: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    acquired_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

    item: Mapped["CatalogItem"] = relationship()

class Rating(Base):
    __tablename__ = "ratings"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "item_id",
            name="uq_rating_user_item",
        ),
        CheckConstraint(
            "value >= 1 AND value <= 10",
            name="ck_rating_value_range",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    item_id: Mapped[str] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"),
        index=True,
    )

    value: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

class Review(Base):
    __tablename__ = "reviews"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "item_id",
            name="uq_review_user_item",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    item_id: Mapped[str] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"),
        index=True,
    )

    body: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )