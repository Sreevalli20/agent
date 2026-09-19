from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.schemas.learner import PlanTask as PlanTaskSchema
from app.services.learner_service import LearnerService

router = APIRouter()


class TaskStatusUpdate(BaseModel):
    status: str


@router.patch("/{task_id}", response_model=PlanTaskSchema)
def update_task_status(
    task_id: str,
    status_update: TaskStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update task status"""
    learner_service = LearnerService(db)
    status = status_update.status
    
    # Find the learner that owns this task
    # In a real system, we'd query by task_id directly
    # For now, we'll iterate through learners to find the task
    all_learners = learner_service.get_all_learners()
    for learner in all_learners:
        state = learner_service.get_learner_state(learner.id)
        if state:
            task = next((t for t in state.plan_tasks if t.id == task_id), None)
            if task:
                # Update task status
                updated_tasks = []
                for t in state.plan_tasks:
                    if t.id == task_id:
                        updated_task = t.model_copy()
                        updated_task.status = status
                        if status in ['Completed', 'Verified']:
                            from datetime import datetime
                            updated_task.completed_at = datetime.utcnow().isoformat()
                        updated_tasks.append(updated_task)
                    else:
                        updated_tasks.append(t)
                
                # Update progress
                from app.schemas.learner import LearnerStateCreate, User as UserSchema, LearnerProgress as LearnerProgressSchema
                user = learner_service.get_learner(learner.id)
                updated_state = LearnerStateCreate(
                    user=UserSchema.model_validate(user),
                    profile=state.profile,
                    documents=state.documents,
                    skills=state.skills,
                    selected_target_id=state.selected_target_id,
                    gaps=state.gaps,
                    plan_tasks=updated_tasks,
                    evidence_history=state.evidence_history,
                    assessments=state.assessments,
                    progress=LearnerProgressSchema.model_validate(state.progress) if state.progress else None,
                    conversations=state.conversations
                )
                
                learner_service.update_learner_state(learner.id, updated_state)
                return next((t for t in updated_tasks if t.id == task_id), None)
    
    raise HTTPException(status_code=404, detail="Task not found")
