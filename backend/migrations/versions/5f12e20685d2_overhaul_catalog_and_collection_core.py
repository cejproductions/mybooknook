"""overhaul catalog and collection core

Revision ID: 5f12e20685d2
Revises: 9993b88fad9a
Create Date: 2026-09-30 14:02:02.710386
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5f12e20685d2"
down_revision: Union[str, Sequence[str], None] = "9993b88fad9a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Overhaul catalog and collection core."""

    # ---------------------------------------------------------
    # Catalog items
    # ---------------------------------------------------------

    op.add_column(
        "catalog_items",
        sa.Column("edition", sa.String(length=150), nullable=True),
    )

    op.add_column(
        "catalog_items",
        sa.Column("publisher_label", sa.String(length=200), nullable=True),
    )

    op.add_column(
        "catalog_items",
        sa.Column("catalog_number", sa.String(length=100), nullable=True),
    )

    # Existing catalog items need a value before NOT NULL can
    # safely be enforced.
    op.add_column(
        "catalog_items",
        sa.Column(
            "special_edition",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # The default above is only needed to safely migrate existing rows.
    # Application-side defaults remain defined in the SQLAlchemy model.
    op.alter_column(
        "catalog_items",
        "special_edition",
        server_default=None,
    )

    op.alter_column(
        "catalog_items",
        "identifier",
        existing_type=sa.VARCHAR(length=32),
        type_=sa.String(length=64),
        existing_nullable=True,
    )

    op.create_index(
        op.f("ix_catalog_items_title"),
        "catalog_items",
        ["title"],
        unique=False,
    )

    # ---------------------------------------------------------
    # Collection entries
    # ---------------------------------------------------------

    op.add_column(
        "collection_entries",
        sa.Column(
            "reading_status",
            sa.String(length=20),
            nullable=True,
        ),
    )

    # Give existing rows an empty value while adding the NOT NULL
    # column, then remove the temporary database default.
    op.add_column(
        "collection_entries",
        sa.Column(
            "personal_notes",
            sa.Text(),
            nullable=False,
            server_default="",
        ),
    )

    op.alter_column(
        "collection_entries",
        "personal_notes",
        server_default=None,
    )

    op.add_column(
        "collection_entries",
        sa.Column(
            "acquired_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # Add updated_at as nullable first because existing entries
    # do not yet have a value.
    op.add_column(
        "collection_entries",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # Existing records were last known to exist when they were added.
    # This gives them a meaningful historical value rather than
    # pretending they were all updated during this migration.
    op.execute(
        """
        UPDATE collection_entries
        SET updated_at = added_at
        WHERE updated_at IS NULL
        """
    )

    # All existing records now have updated_at, so enforce NOT NULL.
    op.alter_column(
        "collection_entries",
        "updated_at",
        nullable=False,
    )

    # ---------------------------------------------------------
    # Allow multiple copies of the same catalog item
    # ---------------------------------------------------------

    op.drop_constraint(
        "uq_user_item",
        "collection_entries",
        type_="unique",
    )

    # ---------------------------------------------------------
    # Catalog item FK delete behavior
    # ---------------------------------------------------------

    # Replace the existing FK so catalog item deletion cascades
    # to its collection entries.
    op.drop_constraint(
        "collection_entries_item_id_fkey",
        "collection_entries",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "collection_entries_item_id_fkey",
        "collection_entries",
        "catalog_items",
        ["item_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Restore the pre-overhaul catalog and collection schema."""

    # ---------------------------------------------------------
    # Restore previous FK behavior
    # ---------------------------------------------------------

    op.drop_constraint(
        "collection_entries_item_id_fkey",
        "collection_entries",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "collection_entries_item_id_fkey",
        "collection_entries",
        "catalog_items",
        ["item_id"],
        ["id"],
    )

    # ---------------------------------------------------------
    # Restore one-entry-per-user/item rule
    # ---------------------------------------------------------

    op.create_unique_constraint(
        "uq_user_item",
        "collection_entries",
        ["user_id", "item_id"],
    )

    # ---------------------------------------------------------
    # Remove new collection fields
    # ---------------------------------------------------------

    op.drop_column("collection_entries", "updated_at")
    op.drop_column("collection_entries", "acquired_at")
    op.drop_column("collection_entries", "personal_notes")
    op.drop_column("collection_entries", "reading_status")

    # ---------------------------------------------------------
    # Restore catalog
    # ---------------------------------------------------------

    op.drop_index(
        op.f("ix_catalog_items_title"),
        table_name="catalog_items",
    )

    op.alter_column(
        "catalog_items",
        "identifier",
        existing_type=sa.String(length=64),
        type_=sa.VARCHAR(length=32),
        existing_nullable=True,
    )

    op.drop_column("catalog_items", "special_edition")
    op.drop_column("catalog_items", "catalog_number")
    op.drop_column("catalog_items", "publisher_label")
    op.drop_column("catalog_items", "edition")