"""separate ratings and reviews

Revision ID: 210a60c21ca7
Revises: 5f12e20685d2
Create Date: 2026-10-01 18:09:32.569737
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "210a60c21ca7"
down_revision: Union[str, Sequence[str], None] = "5f12e20685d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Move ratings and reviews out of collection entries."""

    # ---------------------------------------------------------
    # Ratings
    # ---------------------------------------------------------

    op.create_table(
        "ratings",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("item_id", sa.String(length=36), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.CheckConstraint(
            "value >= 1 AND value <= 10",
            name="ck_rating_value_range",
        ),
        sa.ForeignKeyConstraint(
            ["item_id"],
            ["catalog_items.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "item_id",
            name="uq_rating_user_item",
        ),
    )

    op.create_index(
        op.f("ix_ratings_item_id"),
        "ratings",
        ["item_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_ratings_user_id"),
        "ratings",
        ["user_id"],
        unique=False,
    )

    # ---------------------------------------------------------
    # Reviews
    # ---------------------------------------------------------

    op.create_table(
        "reviews",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("item_id", sa.String(length=36), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["item_id"],
            ["catalog_items.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "item_id",
            name="uq_review_user_item",
        ),
    )

    op.create_index(
        op.f("ix_reviews_item_id"),
        "reviews",
        ["item_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_reviews_user_id"),
        "reviews",
        ["user_id"],
        unique=False,
    )

    # ---------------------------------------------------------
    # Migrate existing ratings
    # ---------------------------------------------------------
    #
    # Old ratings used whole stars:
    #
    #   1 -> 1 star
    #   2 -> 2 stars
    #   ...
    #   5 -> 5 stars
    #
    # New ratings use half-star units:
    #
    #   1  -> 0.5 stars
    #   2  -> 1.0 stars
    #   ...
    #   10 -> 5.0 stars
    #
    # Therefore old_rating * 2 preserves the original rating.
    #
    # DISTINCT ON protects against multiple collection copies
    # belonging to the same user/catalog-item combination.
    # The most recently updated applicable entry wins.

    op.execute(
        """
        INSERT INTO ratings (
            id,
            user_id,
            item_id,
            value,
            created_at,
            updated_at
        )
        SELECT
            gen_random_uuid()::text,
            selected.user_id,
            selected.item_id,
            selected.rating * 2,
            selected.added_at,
            selected.updated_at
        FROM (
            SELECT DISTINCT ON (user_id, item_id)
                user_id,
                item_id,
                rating,
                added_at,
                updated_at
            FROM collection_entries
            WHERE rating IS NOT NULL
            ORDER BY
                user_id,
                item_id,
                updated_at DESC,
                added_at DESC,
                id DESC
        ) AS selected
        """
    )

    # ---------------------------------------------------------
    # Migrate existing reviews
    # ---------------------------------------------------------
    #
    # Blank reviews are not real reviews and therefore do not
    # create rows in the new reviews table.

    op.execute(
        """
        INSERT INTO reviews (
            id,
            user_id,
            item_id,
            body,
            created_at,
            updated_at
        )
        SELECT
            gen_random_uuid()::text,
            selected.user_id,
            selected.item_id,
            selected.review,
            selected.added_at,
            selected.updated_at
        FROM (
            SELECT DISTINCT ON (user_id, item_id)
                user_id,
                item_id,
                review,
                added_at,
                updated_at
            FROM collection_entries
            WHERE review IS NOT NULL
              AND BTRIM(review) <> ''
            ORDER BY
                user_id,
                item_id,
                updated_at DESC,
                added_at DESC,
                id DESC
        ) AS selected
        """
    )

    # ---------------------------------------------------------
    # Remove legacy fields only after their data is migrated
    # ---------------------------------------------------------

    op.drop_column("collection_entries", "review")
    op.drop_column("collection_entries", "rating")


def downgrade() -> None:
    """Move ratings and reviews back onto collection entries."""

    # ---------------------------------------------------------
    # Restore legacy columns
    # ---------------------------------------------------------

    op.add_column(
        "collection_entries",
        sa.Column(
            "rating",
            sa.Integer(),
            nullable=True,
        ),
    )

    # The legacy review column was NOT NULL. Use a temporary
    # server default so existing collection rows receive "".
    op.add_column(
        "collection_entries",
        sa.Column(
            "review",
            sa.Text(),
            nullable=False,
            server_default="",
        ),
    )

    op.alter_column(
        "collection_entries",
        "review",
        server_default=None,
    )

    # ---------------------------------------------------------
    # Restore ratings to collection entries
    # ---------------------------------------------------------
    #
    # The old schema only supports whole-star integer ratings.
    # Half-star ratings therefore cannot be represented exactly.
    #
    # PostgreSQL integer division gives us a deterministic
    # downgrade:
    #
    #   10 -> 5
    #    9 -> 4
    #    8 -> 4
    #    7 -> 3
    #
    # Thus half-star values are rounded DOWN during downgrade.
    #
    # Because ratings now belong to catalog items rather than
    # individual copies, the restored rating is placed on every
    # matching collection entry owned by that user.

    op.execute(
        """
        UPDATE collection_entries AS ce
        SET rating = r.value / 2
        FROM ratings AS r
        WHERE ce.user_id = r.user_id
          AND ce.item_id = r.item_id
        """
    )

    # ---------------------------------------------------------
    # Restore reviews to collection entries
    # ---------------------------------------------------------

    op.execute(
        """
        UPDATE collection_entries AS ce
        SET review = r.body
        FROM reviews AS r
        WHERE ce.user_id = r.user_id
          AND ce.item_id = r.item_id
        """
    )

    # ---------------------------------------------------------
    # Remove new review architecture
    # ---------------------------------------------------------

    op.drop_index(
        op.f("ix_reviews_user_id"),
        table_name="reviews",
    )

    op.drop_index(
        op.f("ix_reviews_item_id"),
        table_name="reviews",
    )

    op.drop_table("reviews")

    # ---------------------------------------------------------
    # Remove new rating architecture
    # ---------------------------------------------------------

    op.drop_index(
        op.f("ix_ratings_user_id"),
        table_name="ratings",
    )

    op.drop_index(
        op.f("ix_ratings_item_id"),
        table_name="ratings",
    )

    op.drop_table("ratings")