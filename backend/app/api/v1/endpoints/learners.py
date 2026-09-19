from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.learner import User as UserSchema, UserCreate, LearnerState, LearnerStateCreate
from app.models.learner import User as UserModel
from app.services.learner_service import LearnerService

router = APIRouter()


@router.post("/", response_model=UserSchema)
def create_learner(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Create a new learner"""
    service = LearnerService(db)
    return service.create_learner(user_data)


@router.get("/{learner_id}", response_model=UserSchema)
def get_learner(
    learner_id: str,
    db: Session = Depends(get_db)
):
    """Get learner by ID"""
    service = LearnerService(db)
    learner = service.get_learner(learner_id)
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found")
    return learner


@router.get("/", response_model=List[UserSchema])
def get_all_learners(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all learners"""
    service = LearnerService(db)
    return service.get_all_learners(skip=skip, limit=limit)


@router.delete("/{learner_id}")
def delete_learner(
    learner_id: str,
    db: Session = Depends(get_db)
):
    """Delete a learner"""
    service = LearnerService(db)
    success = service.delete_learner(learner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Learner not found")
    return {"message": "Learner deleted successfully"}


@router.get("/{learner_id}/state")
def get_learner_state(
    learner_id: str,
    db: Session = Depends(get_db)
):
    """Get complete learner state"""
    try:
        service = LearnerService(db)
        state = service.get_learner_state(learner_id)
        if not state:
            raise HTTPException(status_code=404, detail="Learner not found")
        return state.model_dump()
    except Exception as e:
        import traceback
        error_msg = f"Error retrieving learner state: {str(e)}"
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)


@router.put("/{learner_id}/state", response_model=LearnerState)
def update_learner_state(
    learner_id: str,
    state_data: LearnerStateCreate,
    db: Session = Depends(get_db)
):
    """Update complete learner state"""
    service = LearnerService(db)
    state = service.update_learner_state(learner_id, state_data)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    return state
