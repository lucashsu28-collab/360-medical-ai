"""initial schema

Revision ID: 0adf29d1433f
Revises:
Create Date: 2026-03-22

"""
from alembic import op
import sqlalchemy as sa

revision = '0adf29d1433f'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'clinics',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False, index=True),
        sa.Column('address', sa.String(500), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('specialty', sa.String(200), nullable=True),
        sa.Column('website', sa.String(500), nullable=True),
        sa.Column('cont_start', sa.String(20), nullable=True),
        sa.Column('is_partner', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('custom_note', sa.Text(), nullable=True),
        sa.Column('google_rating', sa.Float(), nullable=True),
        sa.Column('google_review_count', sa.Integer(), nullable=True),
        sa.Column('google_place_id', sa.String(200), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('legal_score', sa.Float(), nullable=True),
        sa.Column('judicial_score', sa.Float(), nullable=True),
        sa.Column('google_rating_score', sa.Float(), nullable=True),
        sa.Column('score_breakdown', sa.JSON(), nullable=True),
        sa.Column('dispute_count', sa.Integer(), nullable=True),
        sa.Column('treatments', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'unlock_records',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('time', sa.DateTime(), nullable=False, server_default=sa.func.now(), index=True),
        sa.Column('user_id', sa.String(200), nullable=False, index=True),
        sa.Column('target_name', sa.String(200), nullable=False),
        sa.Column('unlock_type', sa.String(50), nullable=False),
    )

    op.create_table(
        'broadcast_records',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('sent_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), index=True),
        sa.Column('user_id', sa.String(200), nullable=False),
        sa.Column('message_type', sa.String(50), nullable=False),
        sa.Column('target_name', sa.String(200), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='success'),
    )

    op.create_table(
        'crawler_status',
        sa.Column('key', sa.String(50), primary_key=True),
        sa.Column('last_run', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='unknown'),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('records_updated', sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('crawler_status')
    op.drop_table('broadcast_records')
    op.drop_table('unlock_records')
    op.drop_table('clinics')
