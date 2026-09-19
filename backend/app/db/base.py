from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

Base = declarative_base()

# Create engine
engine = create_engine(settings.DATABASE_URL)
