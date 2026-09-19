from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.learner import Profile as ProfileSchema, ProfileCreate
from app.services.learner_service import LearnerService

router = APIRouter()


@router.post("/{learner_id}", response_model=ProfileSchema)
def create_or_update_profile(
    learner_id: str,
    profile_data: ProfileCreate,
    db: Session = Depends(get_db)
):
    """Create or update learner profile"""
    service = LearnerService(db)
    # Get current state to update
    from app.schemas.learner import LearnerStateCreate, User as UserSchema, LearnerProgress as LearnerProgressSchema
    user = service.get_learner(learner_id)
    if not user:
        raise HTTPException(status_code=404, detail="Learner not found")
    
    state = service.get_learner_state(learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner state not found")
    
    updated_state = LearnerStateCreate(
        user=UserSchema.model_validate(user),
        profile=profile_data,
        documents=state.documents,
        skills=state.skills,
        selected_target_id=state.selected_target_id,
        gaps=state.gaps,
        plan_tasks=state.plan_tasks,
        evidence_history=state.evidence_history,
        assessments=state.assessments,
        progress=LearnerProgressSchema.model_validate(state.progress) if state.progress else None,
        conversations=state.conversations
    )
    
    updated = service.update_learner_state(learner_id, updated_state)
    return updated.profile


@router.get("/{learner_id}", response_model=ProfileSchema)
def get_profile(
    learner_id: str,
    db: Session = Depends(get_db)
):
    """Get learner profile"""
    service = LearnerService(db)
    state = service.get_learner_state(learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    return state.profile
