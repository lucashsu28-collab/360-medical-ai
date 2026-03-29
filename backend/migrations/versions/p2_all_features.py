"""P2 all feature schema changes

Revision ID: p2_all_features
Revises: b6_clinic_reviews
Create Date: 2026-03-29
"""
from alembic import op

revision = 'p2_all_features'
down_revision = ('c3d4e5f6a7b8', 'b6_clinic_reviews')
branch_labels = None
depends_on = None


def upgrade():
    # P2-1: clinics 新增 partner 相關欄位
    op.execute("ALTER TABLE clinics ADD COLUMN IF NOT EXISTS partner_since DATE")
    op.execute("ALTER TABLE clinics ADD COLUMN IF NOT EXISTS line_oa_url TEXT")
    op.execute("ALTER TABLE clinics ADD COLUMN IF NOT EXISTS doctors JSONB DEFAULT '[]'")
    op.execute("ALTER TABLE clinics ADD COLUMN IF NOT EXISTS promotions JSONB DEFAULT '[]'")
    op.execute("ALTER TABLE clinics ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'")

    # P2-2: promotions 表（療程優惠）
    op.execute("""
        CREATE TABLE IF NOT EXISTS promotions (
            id SERIAL PRIMARY KEY,
            clinic_id TEXT REFERENCES clinics(id) ON DELETE CASCADE,
            treatment_name TEXT NOT NULL,
            treatment_category TEXT NOT NULL,
            treatment_part TEXT,
            treatment_effect TEXT,
            price_min INTEGER,
            price_max INTEGER,
            price_label TEXT,
            title TEXT NOT NULL,
            description TEXT,
            expires_at DATE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_promotions_clinic_id ON promotions(clinic_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_promotions_category ON promotions(treatment_category)")

    # P2-3: partnership_inquiries 表
    op.execute("""
        CREATE TABLE IF NOT EXISTS partnership_inquiries (
            id SERIAL PRIMARY KEY,
            clinic_name TEXT NOT NULL,
            contact TEXT NOT NULL,
            inquiry TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # P2-4: clinic_accounts 表（診所後台帳號）
    op.execute("""
        CREATE TABLE IF NOT EXISTS clinic_accounts (
            id SERIAL PRIMARY KEY,
            clinic_id TEXT REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # P2-4: clinic_page_views 表
    op.execute("""
        CREATE TABLE IF NOT EXISTS clinic_page_views (
            id SERIAL PRIMARY KEY,
            clinic_id TEXT REFERENCES clinics(id) ON DELETE CASCADE,
            viewed_at TIMESTAMP DEFAULT NOW(),
            source TEXT
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_clinic_page_views_clinic_id ON clinic_page_views(clinic_id)")

    # P2-4: appointments 表（診所預約）
    op.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id SERIAL PRIMARY KEY,
            clinic_id TEXT REFERENCES clinics(id) ON DELETE CASCADE,
            line_user_id TEXT,
            user_name TEXT,
            treatment TEXT,
            appointment_time TIMESTAMP,
            status TEXT DEFAULT 'pending',
            note TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_appointments_clinic_id ON appointments(clinic_id)")

    # P2-5: line_conversation_stats 表（統計用，不動現有 line_conversations）
    op.execute("""
        CREATE TABLE IF NOT EXISTS line_conversation_stats (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL,
            intent TEXT,
            keyword TEXT,
            converted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_line_conv_stats_user_id ON line_conversation_stats(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_line_conv_stats_created_at ON line_conversation_stats(created_at)")

    # P2-5: line_popular_questions 表
    op.execute("""
        CREATE TABLE IF NOT EXISTS line_popular_questions (
            id SERIAL PRIMARY KEY,
            question_text TEXT NOT NULL UNIQUE,
            count INTEGER DEFAULT 1,
            last_seen TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # P2-6: content_reviews 表（內容審核）
    op.execute("""
        CREATE TABLE IF NOT EXISTS content_reviews (
            id SERIAL PRIMARY KEY,
            content_type TEXT NOT NULL,
            content_id INTEGER NOT NULL,
            clinic_id TEXT REFERENCES clinics(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'pending',
            auto_flag BOOLEAN DEFAULT FALSE,
            flag_reasons JSONB DEFAULT '[]',
            reviewer_note TEXT,
            submitted_at TIMESTAMP DEFAULT NOW(),
            reviewed_at TIMESTAMP,
            reviewed_by TEXT
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_reviews_status ON content_reviews(status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_reviews_clinic_id ON content_reviews(clinic_id)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS content_reviews")
    op.execute("DROP TABLE IF EXISTS line_popular_questions")
    op.execute("DROP TABLE IF EXISTS line_conversation_stats")
    op.execute("DROP TABLE IF EXISTS appointments")
    op.execute("DROP TABLE IF EXISTS clinic_page_views")
    op.execute("DROP TABLE IF EXISTS clinic_accounts")
    op.execute("DROP TABLE IF EXISTS partnership_inquiries")
    op.execute("DROP TABLE IF EXISTS promotions")
    op.execute("ALTER TABLE clinics DROP COLUMN IF EXISTS gallery")
    op.execute("ALTER TABLE clinics DROP COLUMN IF EXISTS promotions")
    op.execute("ALTER TABLE clinics DROP COLUMN IF EXISTS doctors")
    op.execute("ALTER TABLE clinics DROP COLUMN IF EXISTS line_oa_url")
    op.execute("ALTER TABLE clinics DROP COLUMN IF EXISTS partner_since")
