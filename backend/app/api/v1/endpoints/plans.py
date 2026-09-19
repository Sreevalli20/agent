from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.db.session import get_db
from app.schemas.learner import PlanTask, PlanTaskCreate
from app.services.learner_service import LearnerService
from app.services.evaluation_service import EvaluationService

router = APIRouter()


class GeneratePlanRequest(BaseModel):
    learner_id: str
    target_role_id: str


@router.post("/generate", response_model=List[PlanTask])
def generate_learning_plan(
    request: GeneratePlanRequest,
    db: Session = Depends(get_db)
):
    """Generate 7-day execution plan from gaps"""
    learner_service = LearnerService(db)
    evaluation_service = EvaluationService()
    
    state = learner_service.get_learner_state(request.learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    
    # Generate plan using evaluation engine
    gaps = [gap.model_dump() for gap in state.gaps]
    tasks = evaluation_service.generate_execution_plan(
        gaps,
        request.learner_id,
        request.target_role_id
    )
    
    # Update state with new plan
    from app.schemas.learner import LearnerStateCreate, User, LearnerProgress
    user = learner_service.get_learner(request.learner_id)
    updated_state = LearnerStateCreate(
        user=User.model_validate(user),
        profile=state.profile,
        documents=state.documents,
        skills=state.skills,
        selected_target_id=request.target_role_id,
        gaps=state.gaps,
        plan_tasks=[PlanTask(**task) for task in tasks],
        evidence_history=state.evidence_history,
        assessments=state.assessments,
        progress=LearnerProgress.model_validate(state.progress) if state.progress else None,
        conversations=state.conversations
    )
    
    learner_service.update_learner_state(request.learner_id, updated_state)
    return updated_state.plan_tasks


@router.get("/{learner_id}", response_model=List[PlanTask])
def get_learning_plan(
    learner_id: str,
    db: Session = Depends(get_db)
):
    """Get current learning plan for a learner"""
    learner_service = LearnerService(db)
    state = learner_service.get_learner_state(learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    return state.plan_tasks
