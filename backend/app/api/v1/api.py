from fastapi import APIRouter
from app.api.v1.endpoints import (
    learners,
    profiles,
    documents,
    analysis,
    plans,
    tasks,
    evidence,
    dashboard,
    conversations
)

api_router = APIRouter()

api_router.include_router(learners.router, prefix="/learners", tags=["learners"])
api_router.include_router(profiles.router, prefix="/profile", tags=["profile"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(evidence.router, prefix="/evidence", tags=["evidence"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
