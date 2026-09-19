from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.learner import DocumentUpload, DocumentUploadCreate
from app.services.learner_service import LearnerService

router = APIRouter()


@router.post("/{learner_id}", response_model=DocumentUpload)
def upload_document(
    learner_id: str,
    document_data: DocumentUploadCreate,
    db: Session = Depends(get_db)
):
    """Upload a document for a learner"""
    service = LearnerService(db)
    state = service.get_learner_state(learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    
    # Add new document to existing documents
    updated_documents = state.documents + [document_data]
    
    from app.schemas.learner import LearnerStateCreate, User, LearnerProgress
    user = service.get_learner(learner_id)
    updated_state = LearnerStateCreate(
        user=User.model_validate(user),
        profile=state.profile,
        documents=updated_documents,
        skills=state.skills,
        selected_target_id=state.selected_target_id,
        gaps=state.gaps,
        plan_tasks=state.plan_tasks,
        evidence_history=state.evidence_history,
        assessments=state.assessments,
        progress=LearnerProgress.model_validate(state.progress) if state.progress else None,
        conversations=state.conversations
    )
    
    updated = service.update_learner_state(learner_id, updated_state)
    return updated.documents[-1]  # Return the newly added document


@router.get("/{learner_id}", response_model=List[DocumentUpload])
def get_documents(
    learner_id: str,
    db: Session = Depends(get_db)
):
    """Get all documents for a learner"""
    service = LearnerService(db)
    state = service.get_learner_state(learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    return state.documents


@router.delete("/{learner_id}/{document_id}")
def delete_document(
    learner_id: str,
    document_id: str,
    db: Session = Depends(get_db)
):
    """Delete a document"""
    service = LearnerService(db)
    state = service.get_learner_state(learner_id)
    if not state:
        raise HTTPException(status_code=404, detail="Learner not found")
    
    # Remove document from list
    updated_documents = [doc for doc in state.documents if doc.id != document_id]
    
    from app.schemas.learner import LearnerStateCreate, User, LearnerProgress
    user = service.get_learner(learner_id)
    updated_state = LearnerStateCreate(
        user=User.model_validate(user),
        profile=state.profile,
        documents=updated_documents,
        skills=state.skills,
        selected_target_id=state.selected_target_id,
        gaps=state.gaps,
        plan_tasks=state.plan_tasks,
        evidence_history=state.evidence_history,
        assessments=state.assessments,
        progress=LearnerProgress.model_validate(state.progress) if state.progress else None,
        conversations=state.conversations
    )
    
    service.update_learner_state(learner_id, updated_state)
    return {"message": "Document deleted successfully"}
