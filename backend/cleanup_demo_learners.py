"""Clean up duplicate Alex Chen demo learners before seeding"""
import sys
import os
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal
from app.models.learner import (
    User, Profile, DocumentUpload, SkillCapability, 
    SkillGap, PlanTask, EvidenceRecord, AssessmentRecord,
    LearnerProgress, PathConversationMessage
)

def cleanup_duplicate_alex():
    """Delete all Alex Chen demo learners except the one with correct ID"""
    db = SessionLocal()
    
    try:
        # Find all Alex Chen demo learners
        alex_learners = db.query(User).filter(
            User.email == "alex.chen@example.edu",
            User.is_demo == True
        ).all()
        
        print(f"Found {len(alex_learners)} Alex Chen demo learners")
        
        for alex in alex_learners:
            if alex.id != "demo-learner-alex":
                print(f"Deleting duplicate Alex with ID: {alex.id}")
                
                # Delete all related data
                db.query(PathConversationMessage).filter(PathConversationMessage.learner_id == alex.id).delete()
                db.query(LearnerProgress).filter(LearnerProgress.learner_id == alex.id).delete()
                db.query(AssessmentRecord).filter(AssessmentRecord.learner_id == alex.id).delete()
                db.query(EvidenceRecord).filter(EvidenceRecord.learner_id == alex.id).delete()
                db.query(PlanTask).filter(PlanTask.learner_id == alex.id).delete()
                db.query(SkillGap).filter(SkillGap.learner_id == alex.id).delete()
                db.query(SkillCapability).filter(SkillCapability.learner_id == alex.id).delete()
                db.query(DocumentUpload).filter(DocumentUpload.learner_id == alex.id).delete()
                db.query(Profile).filter(Profile.learner_id == alex.id).delete()
                
                db.delete(alex)
            else:
                print(f"Keeping correct Alex with ID: {alex.id}")
        
        db.commit()
        print("Cleanup completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_duplicate_alex()
