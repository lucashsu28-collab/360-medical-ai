"""add error_message to crawler_status

Revision ID: a1b2c3d4e5f6
Revises: 0adf29d1433f
Create Date: 2026-03-22

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '0adf29d1433f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE crawler_status ADD COLUMN IF NOT EXISTS error_message TEXT;")


def downgrade() -> None:
    op.drop_column('crawler_status', 'error_message')
