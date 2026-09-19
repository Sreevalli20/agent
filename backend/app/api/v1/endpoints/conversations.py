from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.db.session import get_db
from app.schemas.learner import PathConversationMessage as PathConversationMessageSchema, PathConversationMessageCreate
from app.services.learner_service import LearnerService
from app.services.evaluation_service import EvaluationService

router = APIRouter()


class AskPathRequest(BaseModel):
    learner_id: str
    query: str


@router.post("/ask", response_model=PathConversationMessageSchema)
def ask_path_query(
    request: AskPathRequest,
    db: Session = Depends(get_db)
):
    """Process natural language query about learner path"""
    learner_service = LearnerService(db)
    evaluation_service = EvaluationService()
    
    state = learner_service.get_learner_state(request.learner_id)
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
    
    response = evaluation_service.answer_path_query(state_dict, request.query)
    
    # Add conversation to state
    from app.schemas.learner import LearnerStateCreate, User as UserSchema, LearnerProgress as LearnerProgressSchema
    user = learner_service.get_learner(request.learner_id)
    updated_state = LearnerStateCreate(
        user=UserSchema.model_validate(user),
        profile=state.profile,
        documents=state.documents,
        skills=state.skills,
        selected_target_id=state.selected_target_id,
        gaps=state.gaps,
        plan_tasks=state.plan_tasks,
        evidence_history=state.evidence_history,
        assessments=state.assessments,
        progress=LearnerProgressSchema.model_validate(state.progress) if state.progress else None,
        conversations=[PathConversationMessageSchema(**response)] + state.conversations
    )
    
    learner_service.update_learner_state(request.learner_id, updated_state)
    return PathConversationMessageSchema(**response)


@router.get("/{learner_id}", response_model=List[PathConversationMessageSchema])
def get_conversations(
    learner_id: str,
    db: Session = Depends(get_db)
):
    """Get conversation history for a learner"""
    learner_service = LearnerService(db)
    state = learner_service.get_learner_state(learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    return state.conversations
