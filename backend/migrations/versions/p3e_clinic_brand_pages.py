"""P3-E: clinic_brand_pages（合作診所品牌頁）

Revision ID: p3e_clinic_brand_pages
Revises: p3a_penalties_reputation
Create Date: 2026-05-10
"""
from alembic import op

revision = 'p3e_clinic_brand_pages'
down_revision = 'p3a_penalties_reputation'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS clinic_brand_pages (
            id SERIAL PRIMARY KEY,
            clinic_id TEXT REFERENCES clinics(id) ON DELETE CASCADE UNIQUE NOT NULL,

            -- Hero 主視覺
            hero_image_url TEXT,
            slogan TEXT,
            subtitle TEXT,

            -- 5 大特色亮點 [{title, desc}]
            features JSONB DEFAULT '[]'::jsonb,

            -- 熱門精選療程 4 [{title, tagline, desc, price, badge, image}]
            signature_treatments JSONB DEFAULT '[]'::jsonb,

            -- 院長 {name, title, years, desc, photo}
            director JSONB,

            -- Before/After 4 [{treatment, duration, note, face_image}]
            before_after JSONB DEFAULT '[]'::jsonb,

            -- 院長推薦療程 4 [{title, target, items, doctor_note, price_from, image}]
            doctor_picks JSONB DEFAULT '[]'::jsonb,

            -- 完整療程列表 8 [{name, price, desc, image}]
            treatments_full JSONB DEFAULT '[]'::jsonb,

            -- 客戶好評 [{name, initial, text, rating, treatment}]
            testimonials JSONB DEFAULT '[]'::jsonb,

            -- 媒體報導 [{outlet, title, date, tier, url}]
            media_reports JSONB DEFAULT '[]'::jsonb,

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_clinic_brand_pages_clinic_id ON clinic_brand_pages(clinic_id)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS clinic_brand_pages")
