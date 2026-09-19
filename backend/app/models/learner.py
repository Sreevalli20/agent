from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.base import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    avatar_url = Column(String, nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)
    documents = relationship("DocumentUpload", back_populates="user")
    skills = relationship("SkillCapability", back_populates="user")
    gaps = relationship("SkillGap", back_populates="user")
    plan_tasks = relationship("PlanTask", back_populates="user")
    evidence_history = relationship("EvidenceRecord", back_populates="user")
    assessments = relationship("AssessmentRecord", back_populates="user")
    progress = relationship("LearnerProgress", back_populates="user", uselist=False)
    conversations = relationship("PathConversationMessage", back_populates="user")


class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id = Column(String, ForeignKey("users.id"), nullable=False)
    full_name = Column(String, nullable=False)
    experience_level = Column(String, nullable=False)
    current_role = Column(String, nullable=False)
    career_goal = Column(Text, nullable=False)
    target_role = Column(String, nullable=False)
    weekly_available_hours = Column(Integer, default=10)
    initial_skills_text = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="profile")


class DocumentUpload(Base):
    __tablename__ = "document_uploads"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Processed")
    extracted_skills = Column(Text, default="[]")  # JSON array
    notes = Column(Text, nullable=True)
    mock_download_url = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="documents")


class SkillCapability(Base):
    __tablename__ = "skill_capabilities"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id = Column(String, ForeignKey("users.id"), nullable=False)
    capability = Column(String, nullable=False)
    category = Column(String, default="Technical")
    tags = Column(Text, default="[]")  # JSON array
    current_level = Column(String, default="None")
    evidence_found = Column(Text, default="")
    evidence_strength = Column(String, default="No evidence")
    source = Column(String, default="Initial Assessment")
    validation_status = Column(String, default="Needs validation")
    target_level = Column(String, default="Beginner")
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="skills")


class SkillGap(Base):
    __tablename__ = "skill_gaps"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id = Column(String, ForeignKey("users.id"), nullable=False)
    capability = Column(String, nullable=False)
    category = Column(String, nullable=False)
    current_evidence = Column(String, default="No evidence")
    current_level = Column(String, default="None")
    target_requirement = Column(String, nullable=False)
    importance = Column(String, default="Medium")
    gap = Column(String, default="Low")
    priority = Column(String, default="Low")
    reason = Column(Text, default="")
    recommended_action = Column(Text, default="")
    estimated_hours_to_close = Column(Integer, default=8)
    
    # Relationships
    user = relationship("User", back_populates="gaps")


class PlanTask(Base):
    __tablename__ = "plan_tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id = Column(String, ForeignKey("users.id"), nullable=False)
    day = Column(Integer, nullable=False)
    capability = Column(String, nullable=False)
    learning_objective = Column(Text, nullable=False)
    practice_activity = Column(Text, nullable=False)
    expected_duration = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    deliverable = Column(Text, nullable=False)
    evidence_requirement = Column(Text, nullable=False)
    status = Column(String, default="Not started")
    why_it_matters = Column(Text, default="")
    priority_score = Column(Integer, default=0)
    evidence_id = Column(String, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="plan_tasks")


class EvidenceRecord(Base):
    __tablename__ = "evidence_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id = Column(String, ForeignKey("users.id"), nullable=False)
    task_id = Column(String, nullable=False)
    task_title = Column(String, nullable=False)
    capability = Column(String, nullable=False)
    evidence_type = Column(String, nullable=False)
    submitted_evidence = Column(Text, nullable=False)
    summary_notes = Column(Text, default="")
    date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Submitted")
    feedback = Column(Text, default="")
    next_step = Column(Text, default="")
    attachment_name = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="evidence_history")


class AssessmentRecord(Base):
    __tablename__ = "assessment_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id = Column(String, ForeignKey("users.id"), nullable=False)
    capability = Column(String, nullable=False)
    previous_level = Column(String, nullable=False)
    new_level = Column(String, nullable=False)
    previous_strength = Column(String, nullable=False)
    new_strength = Column(String, nullable=False)
    triggered_by_evidence_id = Column(String, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    demonstrated_capabilities = Column(Text, default="[]")  # JSON array
    capabilities_still_missing = Column(Text, default="[]")  # JSON array
    recommended_next_practice = Column(Text, default="")
    action_summary = Column(Text, default="")
    
    # Relationships
    user = relationship("User", back_populates="assessments")


class LearnerProgress(Base):
    __tablename__ = "learner_progress"
    
    learner_id = Column(String, ForeignKey("users.id"), primary_key=True)
    completed_activities = Column(Integer, default=0)
    total_activities = Column(Integer, default=0)
    current_activities = Column(Integer, default=0)
    remaining_gaps = Column(Integer, default=0)
    recently_strengthened = Column(Text, default="[]")  # JSON array
    capabilities_needing_evidence = Column(Text, default="[]")  # JSON array
    next_milestone = Column(Text, default="")
    weekly_target_hours = Column(Integer, default=10)
    hours_completed_this_week = Column(Float, default=0.0)
    
    # Relationships
    user = relationship("User", back_populates="progress")


class PathConversationMessage(Base):
    __tablename__ = "path_conversations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id = Column(String, ForeignKey("users.id"), nullable=False)
    sender = Column(String, nullable=False)  # 'learner' or 'system'
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    related_capability = Column(String, nullable=True)
    actionable_task_id = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="conversations")
