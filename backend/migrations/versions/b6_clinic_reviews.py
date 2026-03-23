"""add clinic_reviews table

Revision ID: b6_clinic_reviews
Revises: 
Create Date: 2026-03-23
"""
from alembic import op
import sqlalchemy as sa

revision = 'b6_clinic_reviews'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('clinic_reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('author_name', sa.String(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('text', sa.Text(), nullable=True),
        sa.Column('time', sa.BigInteger(), nullable=True),
        sa.Column('relative_time', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_clinic_reviews_clinic_id', 'clinic_reviews', ['clinic_id'])

def downgrade():
    op.drop_table('clinic_reviews')
