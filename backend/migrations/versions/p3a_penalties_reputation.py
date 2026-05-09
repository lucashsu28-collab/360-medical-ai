"""P3-A: penalties + reputation infra

Revision ID: p3a_penalties_reputation
Revises: p2_all_features
Create Date: 2026-05-10
"""
from alembic import op

revision = 'p3a_penalties_reputation'
down_revision = 'p2_all_features'
branch_labels = None
depends_on = None


def upgrade():
    # 1. admin_penalties 行政處分主表
    op.execute("""
        CREATE TABLE IF NOT EXISTS admin_penalties (
            id SERIAL PRIMARY KEY,
            target_type VARCHAR(10) NOT NULL,
            target_id TEXT NOT NULL,
            source VARCHAR(30) NOT NULL,
            source_url TEXT UNIQUE NOT NULL,
            penalty_date DATE NOT NULL,
            agency VARCHAR(100),
            violation_item TEXT,
            violation_item_plain TEXT,
            law_article VARCHAR(200),
            fine_amount INTEGER DEFAULT 0,
            penalty_type VARCHAR(20),
            severity VARCHAR(10) NOT NULL DEFAULT 'minor',
            is_major BOOLEAN DEFAULT FALSE,
            status VARCHAR(20) DEFAULT 'active',
            raw_data JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_penalties_target ON admin_penalties(target_type, target_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_penalties_date ON admin_penalties(penalty_date)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_penalties_severity ON admin_penalties(severity)")

    # 2. penalty_clinic_responses 診所改善說明
    op.execute("""
        CREATE TABLE IF NOT EXISTS penalty_clinic_responses (
            id SERIAL PRIMARY KEY,
            penalty_id INTEGER REFERENCES admin_penalties(id) ON DELETE CASCADE,
            clinic_id TEXT REFERENCES clinics(id) ON DELETE CASCADE,
            response_text TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            reviewed_by TEXT,
            reviewed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_penalty_responses_penalty ON penalty_clinic_responses(penalty_id)")

    # 3. mentions 口碑提及（P3-B/C 共用）
    op.execute("""
        CREATE TABLE IF NOT EXISTS mentions (
            id SERIAL PRIMARY KEY,
            target_type VARCHAR(10) NOT NULL,
            target_id TEXT NOT NULL,
            source_type VARCHAR(20) NOT NULL,
            source_name VARCHAR(100),
            source_url TEXT UNIQUE NOT NULL,
            title TEXT,
            content TEXT,
            author VARCHAR(100),
            published_at TIMESTAMP,
            sentiment VARCHAR(10),
            sentiment_score FLOAT,
            authority_weight FLOAT DEFAULT 1.0,
            interaction_likes INTEGER DEFAULT 0,
            interaction_comments INTEGER DEFAULT 0,
            interaction_dislikes INTEGER DEFAULT 0,
            interaction_weight FLOAT DEFAULT 1.0,
            is_advertorial BOOLEAN DEFAULT FALSE,
            ad_confidence FLOAT,
            ai_summary TEXT,
            keywords JSONB DEFAULT '[]',
            contribution_score FLOAT,
            status VARCHAR(20) DEFAULT 'active',
            crawled_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_mentions_target ON mentions(target_type, target_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_mentions_source_type ON mentions(source_type)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_mentions_published ON mentions(published_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_mentions_sentiment ON mentions(sentiment)")

    # 4. reputation_scores 評分快照
    op.execute("""
        CREATE TABLE IF NOT EXISTS reputation_scores (
            id SERIAL PRIMARY KEY,
            target_type VARCHAR(10) NOT NULL,
            target_id TEXT NOT NULL,
            snapshot_date DATE NOT NULL,
            news_score INTEGER,
            social_score INTEGER,
            penalty_score INTEGER,
            mention_count INTEGER DEFAULT 0,
            positive_count INTEGER DEFAULT 0,
            neutral_count INTEGER DEFAULT 0,
            negative_count INTEGER DEFAULT 0,
            penalty_count_severe INTEGER DEFAULT 0,
            penalty_count_medium INTEGER DEFAULT 0,
            penalty_count_minor INTEGER DEFAULT 0,
            details JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(target_type, target_id, snapshot_date)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_reputation_target ON reputation_scores(target_type, target_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reputation_date ON reputation_scores(snapshot_date)")

    # 5. monitor_keywords 監測關鍵字
    op.execute("""
        CREATE TABLE IF NOT EXISTS monitor_keywords (
            id SERIAL PRIMARY KEY,
            scope VARCHAR(20) DEFAULT 'global',
            clinic_id TEXT REFERENCES clinics(id) ON DELETE CASCADE,
            keyword VARCHAR(200) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_monitor_keywords_clinic ON monitor_keywords(clinic_id)")

    # 6. media_authority 媒體權威度分級
    op.execute("""
        CREATE TABLE IF NOT EXISTS media_authority (
            id SERIAL PRIMARY KEY,
            domain VARCHAR(200) UNIQUE NOT NULL,
            media_name VARCHAR(100),
            tier VARCHAR(2) NOT NULL,
            weight FLOAT NOT NULL,
            category VARCHAR(20),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # 7. mention_appeals 口碑申訴
    op.execute("""
        CREATE TABLE IF NOT EXISTS mention_appeals (
            id SERIAL PRIMARY KEY,
            mention_id INTEGER REFERENCES mentions(id) ON DELETE CASCADE,
            clinic_id TEXT REFERENCES clinics(id) ON DELETE CASCADE,
            appeal_type VARCHAR(30),
            appeal_text TEXT,
            evidence_urls JSONB DEFAULT '[]',
            status VARCHAR(20) DEFAULT 'pending',
            reviewed_by TEXT,
            reviewed_at TIMESTAMP,
            review_note TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_appeals_status ON mention_appeals(status)")

    # 8. 預填媒體權威度資料（17 家）
    op.execute("""
        INSERT INTO media_authority (domain, media_name, tier, weight, category) VALUES
        ('appledaily.com', '蘋果日報', 'A', 1.5, 'mainstream'),
        ('udn.com', '聯合新聞網', 'A', 1.5, 'mainstream'),
        ('ltn.com.tw', '自由時報', 'A', 1.5, 'mainstream'),
        ('chinatimes.com', '中時新聞網', 'A', 1.5, 'mainstream'),
        ('tvbs.com.tw', 'TVBS', 'A', 1.5, 'mainstream'),
        ('mirrormedia.mg', '鏡週刊', 'A', 1.5, 'mainstream'),
        ('ettoday.net', 'ETtoday', 'B', 1.2, 'online'),
        ('setn.com', '三立新聞', 'B', 1.2, 'online'),
        ('ebc.net.tw', '東森新聞', 'B', 1.2, 'online'),
        ('news.yahoo.com', 'Yahoo新聞', 'B', 1.2, 'online'),
        ('storm.mg', '風傳媒', 'B', 1.2, 'online'),
        ('newtalk.tw', '新頭殼', 'B', 1.2, 'online'),
        ('nownews.com', 'NOWnews', 'B', 1.2, 'online'),
        ('beauty321.com', '美人圈', 'C', 1.0, 'beauty'),
        ('beauty.bella.tw', '醫美時尚', 'C', 1.0, 'beauty'),
        ('elle.com.tw', 'ELLE', 'C', 1.0, 'beauty'),
        ('marieclaire.com.tw', '美麗佳人', 'C', 1.0, 'beauty')
        ON CONFLICT (domain) DO NOTHING
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS mention_appeals")
    op.execute("DROP TABLE IF EXISTS media_authority")
    op.execute("DROP TABLE IF EXISTS monitor_keywords")
    op.execute("DROP TABLE IF EXISTS reputation_scores")
    op.execute("DROP TABLE IF EXISTS mentions")
    op.execute("DROP TABLE IF EXISTS penalty_clinic_responses")
    op.execute("DROP TABLE IF EXISTS admin_penalties")
