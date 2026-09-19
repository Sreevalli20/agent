from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.db.session import get_db
from app.schemas.learner import SkillGap, SkillCapability
from app.services.learner_service import LearnerService
from app.services.evaluation_service import EvaluationService

router = APIRouter()


class AnalyzeProfileRequest(BaseModel):
    learner_id: str
    target_role_id: str


@router.post("/profile", response_model=List[SkillCapability])
def analyze_profile(
    request: AnalyzeProfileRequest,
    db: Session = Depends(get_db)
):
    """Build skill profile from learner profile and documents"""
    learner_service = LearnerService(db)
    evaluation_service = EvaluationService()
    
    state = learner_service.get_learner_state(request.learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    
    # Generate skills using evaluation engine logic
    from app.schemas.learner import Profile
    profile = state.profile
    documents = state.documents
    
    # Convert documents to proper format
    from app.data.roles_data import CAREER_REQUIREMENTS
    requirements = CAREER_REQUIREMENTS.get(request.target_role_id, CAREER_REQUIREMENTS['data-analyst'])
    
    skills = evaluation_service.build_skill_profile_from_input(
        profile.model_dump(),
        [doc.model_dump() for doc in documents],
        request.target_role_id
    )
    
    # Update state with new skills
    from app.schemas.learner import LearnerStateCreate, User, LearnerProgress
    user = learner_service.get_learner(request.learner_id)
    updated_state = LearnerStateCreate(
        user=User.model_validate(user),
        profile=profile,
        documents=state.documents,
        skills=[SkillCapability(**skill) for skill in skills],
        selected_target_id=request.target_role_id,
        gaps=state.gaps,
        plan_tasks=state.plan_tasks,
        evidence_history=state.evidence_history,
        assessments=state.assessments,
        progress=LearnerProgress.model_validate(state.progress) if state.progress else None,
        conversations=state.conversations
    )
    
    learner_service.update_learner_state(request.learner_id, updated_state)
    return updated_state.skills


@router.post("/gaps", response_model=List[SkillGap])
def compute_gaps(
    request: AnalyzeProfileRequest,
    db: Session = Depends(get_db)
):
    """Compute gap analysis from current skills and target role"""
    learner_service = LearnerService(db)
    evaluation_service = EvaluationService()
    
    state = learner_service.get_learner_state(request.learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    
    # Generate gaps using evaluation engine logic
    gaps = evaluation_service.compute_gap_analysis(
        [skill.model_dump() for skill in state.skills],
        request.target_role_id
    )
    
    # Update state with new gaps
    from app.schemas.learner import LearnerStateCreate, User, LearnerProgress
    user = learner_service.get_learner(request.learner_id)
    updated_state = LearnerStateCreate(
        user=User.model_validate(user),
        profile=state.profile,
        documents=state.documents,
        skills=state.skills,
        selected_target_id=request.target_role_id,
        gaps=[SkillGap(**gap) for gap in gaps],
        plan_tasks=state.plan_tasks,
        evidence_history=state.evidence_history,
        assessments=state.assessments,
        progress=LearnerProgress.model_validate(state.progress) if state.progress else None,
        conversations=state.conversations
    )
    
    learner_service.update_learner_state(request.learner_id, updated_state)
    return updated_state.gaps


@router.get("/{learner_id}/gaps", response_model=List[SkillGap])
def get_gaps(
    learner_id: str,
    db: Session = Depends(get_db)
):
    """Get current gap analysis for a learner"""
    learner_service = LearnerService(db)
    state = learner_service.get_learner_state(learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    return state.gaps
