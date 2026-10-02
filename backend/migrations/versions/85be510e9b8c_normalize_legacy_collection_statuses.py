"""normalize legacy collection statuses

Revision ID: 85be510e9b8c
Revises: 210a60c21ca7
Create Date: 2026-10-01 21:55:45.825402

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "85be510e9b8c"
down_revision: Union[str, Sequence[str], None] = "210a60c21ca7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Normalize collection statuses from the legacy status model."""

    # In the old model, reading progress was stored in CollectionEntry.status.
    # The current model separates collection ownership from reading progress:
    #
    #   status         -> owned / wishlist
    #   reading_status -> unread / in_progress / finished
    #
    # Preserve an existing reading_status if one is already present.

    op.execute(
        """
        UPDATE collection_entries
        SET
            status = 'owned',
            reading_status = COALESCE(reading_status, 'finished')
        WHERE status = 'finished'
        """
    )

    op.execute(
        """
        UPDATE collection_entries
        SET
            status = 'owned',
            reading_status = COALESCE(reading_status, 'in_progress')
        WHERE status = 'reading'
        """
    )

    # "listening" was a legacy collection status used for vinyl.
    # Vinyl does not use reading_status in the current model, so only
    # normalize its collection ownership state.
    op.execute(
        """
        UPDATE collection_entries
        SET status = 'owned'
        WHERE status = 'listening'
        """
    )


def downgrade() -> None:
    """No automatic downgrade for legacy status normalization.

    This migration repairs legacy data to match the current data model.
    Reconstructing the exact historical status is not reliable because an
    'owned' entry may have originated as 'owned', 'reading', 'finished',
    or 'listening'.
    """
    pass