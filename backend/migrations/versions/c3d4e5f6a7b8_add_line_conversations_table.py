"""add line_conversations table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-22

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS line_conversations (
            id SERIAL PRIMARY KEY,
            line_user_id VARCHAR(100) NOT NULL,
            role VARCHAR(10) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_line_conv_user_id
        ON line_conversations(line_user_id);
    """)


def downgrade() -> None:
    op.drop_table('line_conversations')
