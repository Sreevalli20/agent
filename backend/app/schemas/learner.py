from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    name: str
    email: str
    is_demo: bool = False


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProfileBase(BaseModel):
    full_name: str
    experience_level: str
    current_role: str
    career_goal: str
    target_role: str
    weekly_available_hours: int
    initial_skills_text: str = ""


class ProfileCreate(ProfileBase):
    pass


class Profile(ProfileBase):
    id: str
    learner_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DocumentUploadBase(BaseModel):
    filename: str
    file_type: str
    size_bytes: int
    extracted_skills: List[str] = []
    notes: Optional[str] = None


class DocumentUploadCreate(DocumentUploadBase):
    pass


class DocumentUpload(DocumentUploadBase):
    id: str
    learner_id: str
    upload_date: datetime
    status: str
    
    class Config:
        from_attributes = True


class SkillCapabilityBase(BaseModel):
    capability: str
    category: str
    tags: List[str] = []
    current_level: str
    evidence_found: str
    evidence_strength: str
    source: str
    validation_status: str
    target_level: str


class SkillCapabilityCreate(SkillCapabilityBase):
    pass


class SkillCapability(SkillCapabilityBase):
    id: str
    learner_id: str
    last_updated: datetime
    
    class Config:
        from_attributes = True


class SkillGapBase(BaseModel):
    capability: str
    category: str
    current_evidence: str
    current_level: str
    target_requirement: str
    importance: str
    gap: str
    priority: str
    reason: str
    recommended_action: str
    estimated_hours_to_close: int


class SkillGap(SkillGapBase):
    id: str
    learner_id: str
    
    class Config:
        from_attributes = True


class PlanTaskBase(BaseModel):
    day: int
    capability: str
    learning_objective: str
    practice_activity: str
    expected_duration: str
    duration_minutes: int
    deliverable: str
    evidence_requirement: str
    status: str
    why_it_matters: str
    priority_score: int


class PlanTaskCreate(PlanTaskBase):
    pass


class PlanTask(PlanTaskBase):
    id: str
    learner_id: str
    evidence_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EvidenceRecordBase(BaseModel):
    task_id: str
    task_title: str
    capability: str
    evidence_type: str
    submitted_evidence: str
    summary_notes: str
    status: str
    feedback: str
    next_step: str
    attachment_name: Optional[str] = None


class EvidenceRecordCreate(EvidenceRecordBase):
    pass


class EvidenceRecord(EvidenceRecordBase):
    id: str
    learner_id: str
    date: datetime
    
    class Config:
        from_attributes = True


class AssessmentRecordBase(BaseModel):
    capability: str
    previous_level: str
    new_level: str
    previous_strength: str
    new_strength: str
    triggered_by_evidence_id: str
    demonstrated_capabilities: List[str]
    capabilities_still_missing: List[str]
    recommended_next_practice: str
    action_summary: str


class AssessmentRecordCreate(AssessmentRecordBase):
    pass


class AssessmentRecord(AssessmentRecordBase):
    id: str
    learner_id: str
    date: datetime
    
    class Config:
        from_attributes = True


class LearnerProgressBase(BaseModel):
    completed_activities: int
    total_activities: int
    current_activities: int
    remaining_gaps: int
    recently_strengthened: List[str]
    capabilities_needing_evidence: List[str]
    next_milestone: str
    weekly_target_hours: int
    hours_completed_this_week: float


class LearnerProgressCreate(LearnerProgressBase):
    pass


class LearnerProgress(LearnerProgressBase):
    learner_id: str
    
    class Config:
        from_attributes = True


class PathConversationMessageBase(BaseModel):
    sender: str
    query: str
    response: str
    related_capability: Optional[str] = None
    actionable_task_id: Optional[str] = None


class PathConversationMessageCreate(PathConversationMessageBase):
    pass


class PathConversationMessage(PathConversationMessageBase):
    id: str
    learner_id: str
    timestamp: datetime
    
    class Config:
        from_attributes = True


class LearnerStateBase(BaseModel):
    user: User
    profile: Profile
    documents: List[DocumentUpload]
    skills: List[SkillCapability]
    selected_target_id: str
    custom_target_title: Optional[str] = None
    gaps: List[SkillGap]
    plan_tasks: List[PlanTask]
    evidence_history: List[EvidenceRecord]
    assessments: List[AssessmentRecord]
    progress: LearnerProgress
    conversations: List[PathConversationMessage]


class LearnerStateCreate(LearnerStateBase):
    pass


class LearnerState(LearnerStateBase):
    class Config:
        from_attributes = True
