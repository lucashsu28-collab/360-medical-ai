"""P3-G: clinics 加 google_photo_url 欄位

Revision ID: p3g_clinic_google_photo
Revises: p3f_industry_news
Create Date: 2026-05-10
"""
from alembic import op

revision = 'p3g_clinic_google_photo'
down_revision = 'p3f_industry_news'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_photo_url TEXT")
    op.execute("ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_photo_synced_at TIMESTAMP")


def downgrade():
    op.execute("ALTER TABLE clinics DROP COLUMN IF EXISTS google_photo_synced_at")
    op.execute("ALTER TABLE clinics DROP COLUMN IF EXISTS google_photo_url")
