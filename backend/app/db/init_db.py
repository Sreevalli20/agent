from app.db.base import Base, engine
from app.models.learner import (
    User, Profile, DocumentUpload, SkillCapability, 
    SkillGap, PlanTask, EvidenceRecord, AssessmentRecord,
    LearnerProgress, PathConversationMessage
)

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    create_tables()
