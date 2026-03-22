from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from config import DATABASE_URL
from models.base import Base  # noqa: F401 — re-export for convenience

# 確保 async engine 使用 asyncpg 驅動
_async_url = (
    DATABASE_URL
    .replace("postgresql://", "postgresql+asyncpg://")
    .replace("postgresql+psycopg2://", "postgresql+asyncpg://")
)

engine = create_async_engine(_async_url, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
