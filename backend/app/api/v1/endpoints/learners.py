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


@router.get("/demo/alex/state")
def get_demo_alex_state(db: Session = Depends(get_db)):
    """Get or create demo Alex Chen learner state with comprehensive seed data"""
    service = LearnerService(db)
    
    # Always ensure comprehensive demo data is seeded
    try:
        from cleanup_demo_learners import cleanup_duplicate_alex
        from seed_demo_data import seed_demo_alex
        cleanup_duplicate_alex()
        seed_demo_alex()
    except Exception as e:
        print(f"Warning: Could not seed demo data: {e}")
        import traceback
        traceback.print_exc()
    
    # Get the seeded state
    state = service.get_learner_state("demo-learner-alex")
    if not state:
        raise HTTPException(status_code=500, detail="Failed to seed or retrieve demo learner")
    return state.model_dump()


@router.post("/demo/alex/seed")
def seed_demo_alex_endpoint(db: Session = Depends(get_db)):
    """Manually trigger seeding of Alex Chen demo data"""
    try:
        from seed_demo_data import seed_demo_alex
        seed_demo_alex()
        return {"message": "Alex Chen demo data seeded successfully"}
    except Exception as e:
        import traceback
        error_msg = f"Error seeding demo data: {str(e)}"
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/demo/marcus/state")
def get_demo_marcus_state(db: Session = Depends(get_db)):
    """Get or create demo Marcus Vance learner state"""
    service = LearnerService(db)
    
    # Try to get existing demo learner
    demo_marcus = service.get_learner("demo-learner-marcus")
    
    if not demo_marcus:
        # Create demo learner if doesn't exist
        from app.schemas.learner import UserCreate
        demo_user = service.create_learner(UserCreate(
            name="Marcus Vance",
            email="marcus.vance@example.edu",
            is_demo=True
        ))
        return service.get_learner_state(demo_user.id).model_dump()
    
    return service.get_learner_state("demo-learner-marcus").model_dump()


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
