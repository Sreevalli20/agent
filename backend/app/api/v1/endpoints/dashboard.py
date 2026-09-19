from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.learner import LearnerProgress
from app.services.learner_service import LearnerService
from app.services.evaluation_service import EvaluationService

router = APIRouter()


@router.get("/{learner_id}/progress", response_model=LearnerProgress)
def get_dashboard_progress(
    learner_id: str,
    db: Session = Depends(get_db)
):
    """Get dashboard progress data"""
    learner_service = LearnerService(db)
    state = learner_service.get_learner_state(learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    return state.progress


@router.get("/{learner_id}/next-action")
def get_next_action(
    learner_id: str,
    db: Session = Depends(get_db)
):
    """Calculate next action for dashboard"""
    learner_service = LearnerService(db)
    evaluation_service = EvaluationService()
    
    state = learner_service.get_learner_state(learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    
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
    
    next_action = evaluation_service.calculate_next_action(state_dict)
    return next_action
