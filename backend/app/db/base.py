from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

Base = declarative_base()

# Get properly formatted database URL
database_url = settings.SQLALCHEMY_DATABASE_URL

# Create engine with appropriate configuration for each database type
if database_url.startswith("sqlite"):
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
elif database_url.startswith("postgresql"):
    # PostgreSQL with connection pooling for production
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300
    )
else:
    engine = create_engine(database_url)
