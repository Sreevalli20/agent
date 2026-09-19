from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.db.session import get_db
from app.schemas.learner import (
    EvidenceRecord as EvidenceRecordSchema, EvidenceRecordCreate, AssessmentRecord as AssessmentRecordSchema,
    SkillCapability as SkillCapabilitySchema, SkillGap as SkillGapSchema, PlanTask as PlanTaskSchema, LearnerProgress as LearnerProgressSchema
)
from app.services.learner_service import LearnerService
from app.services.evaluation_service import EvaluationService

router = APIRouter()


class SubmitEvidenceRequest(BaseModel):
    learner_id: str
    task_id: str
    evidence_type: str
    submitted_evidence: str
    summary_notes: str
    attachment_name: str = None


@router.post("/submit", response_model=dict)
def submit_evidence(
    request: SubmitEvidenceRequest,
    db: Session = Depends(get_db)
):
    """Submit evidence and trigger reassessment"""
    learner_service = LearnerService(db)
    evaluation_service = EvaluationService()
    
    state = learner_service.get_learner_state(request.learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    
    # Convert state to dict for evaluation service
    state_dict = {
        'user': state.user.model_dump(),
        'profile': state.profile.model_dump() if state.profile else {},
        'documents': [doc.model_dump() for doc in state.documents],
        'skills': [skill.model_dump() for skill in state.skills],
        'selectedTargetId': state.selected_target_id,
        'gaps': [gap.model_dump() for gap in state.gaps],
        'planTasks': [task.model_dump() for task in state.plan_tasks],
        'evidenceHistory': [ev.model_dump() for ev in state.evidence_history],
        'assessments': [assess.model_dump() for assess in state.assessments],
        'progress': state.progress.model_dump() if state.progress else {},
        'conversations': [conv.model_dump() for conv in state.conversations]
    }
    
    # Process evidence submission
    result = evaluation_service.submit_and_reassess_evidence(
        state_dict,
        request.task_id,
        request.evidence_type,
        request.submitted_evidence,
        request.summary_notes,
        request.attachment_name
    )
    
    # Update state with reassessment results
    from app.schemas.learner import LearnerStateCreate, User as UserSchema
    user = learner_service.get_learner(request.learner_id)
    updated_state = LearnerStateCreate(
        user=UserSchema.model_validate(user),
        profile=state.profile,
        documents=state.documents,
        skills=[SkillCapabilitySchema(**skill) for skill in result['updatedState']['skills']],
        selected_target_id=state.selected_target_id,
        gaps=[SkillGapSchema(**gap) for gap in result['updatedState']['gaps']],
        plan_tasks=[PlanTaskSchema(**task) for task in result['updatedState']['planTasks']],
        evidence_history=[EvidenceRecordSchema(**ev) for ev in result['updatedState']['evidenceHistory']],
        assessments=[AssessmentRecordSchema(**assess) for assess in result['updatedState']['assessments']],
        progress=LearnerProgressSchema(**result['updatedState']['progress']) if result['updatedState'].get('progress') else None,
        conversations=state.conversations
    )
    
    learner_service.update_learner_state(request.learner_id, updated_state)
    
    return {
        'assessment': result['assessment'],
        'feedback': result['feedback'],
        'updatedState': updated_state.model_dump()
    }


@router.get("/{learner_id}", response_model=List[EvidenceRecordSchema])
def get_evidence_history(
    learner_id: str,
    db: Session = Depends(get_db)
):
    """Get evidence history for a learner"""
    learner_service = LearnerService(db)
    state = learner_service.get_learner_state(learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    return state.evidence_history
