"""P3-F: industry_news（醫美快訊：行業新聞 + 國內外新知）

Revision ID: p3f_industry_news
Revises: p3e_clinic_brand_pages
Create Date: 2026-05-10
"""
from alembic import op

revision = 'p3f_industry_news'
down_revision = 'p3e_clinic_brand_pages'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS industry_news (
            id SERIAL PRIMARY KEY,
            source_url TEXT UNIQUE NOT NULL,
            source_name VARCHAR(100),
            category VARCHAR(20) NOT NULL DEFAULT 'domestic',
            title TEXT NOT NULL,
            summary TEXT,
            cover_image TEXT,
            published_at TIMESTAMP,
            ai_keywords JSONB DEFAULT '[]'::jsonb,
            status VARCHAR(20) DEFAULT 'active',
            crawled_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_industry_news_category ON industry_news(category)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_industry_news_published ON industry_news(published_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_industry_news_status ON industry_news(status)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS industry_news")
