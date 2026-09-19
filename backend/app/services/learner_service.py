import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.learner import (
    User as UserSchema, UserCreate, LearnerState, LearnerStateCreate,
    Profile as ProfileSchema, ProfileCreate, DocumentUpload as DocumentUploadSchema, DocumentUploadCreate,
    SkillCapability as SkillCapabilitySchema, SkillCapabilityCreate, SkillGap as SkillGapSchema, SkillGapCreate,
    PlanTask as PlanTaskSchema, PlanTaskCreate, EvidenceRecord as EvidenceRecordSchema, EvidenceRecordCreate,
    AssessmentRecord as AssessmentRecordSchema, AssessmentRecordCreate, LearnerProgress as LearnerProgressSchema, LearnerProgressCreate,
    PathConversationMessage as PathConversationMessageSchema, PathConversationMessageCreate
)
from app.models.learner import (
    User as UserModel, Profile as ProfileModel, DocumentUpload as DocumentModel,
    SkillCapability as SkillModel, SkillGap as GapModel, PlanTask as TaskModel,
    EvidenceRecord as EvidenceModel, AssessmentRecord as AssessmentModel,
    LearnerProgress as ProgressModel, PathConversationMessage as ConversationModel
)


class LearnerService:
    def __init__(self, db: Session):
        self.db = db
    
    def _json_list(self, field: str) -> List[str]:
        """Parse JSON list from database field"""
        try:
            return json.loads(field) if field else []
        except:
            return []
    
    def _json_dump(self, data: List[str]) -> str:
        """Convert list to JSON string for database"""
        return json.dumps(data) if data else "[]"
    
    def create_learner(self, user_data: UserCreate) -> UserSchema:
        """Create a new learner with default state"""
        db_user = UserModel(
            name=user_data.name,
            email=user_data.email,
            is_demo=user_data.is_demo
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        # Create default profile
        profile = ProfileModel(
            learner_id=db_user.id,
            full_name=user_data.name,
            experience_level="Entry",
            current_role="Student",
            career_goal="Develop verified competencies",
            target_role="Data Analyst",
            weekly_available_hours=10,
            initial_skills_text=""
        )
        self.db.add(profile)
        
        # Create default progress
        progress = ProgressModel(
            learner_id=db_user.id,
            completed_activities=0,
            total_activities=0,
            current_activities=0,
            remaining_gaps=0,
            recently_strengthened="[]",
            capabilities_needing_evidence="[]",
            next_milestone="Upload documents to begin",
            weekly_target_hours=10,
            hours_completed_this_week=0.0
        )
        self.db.add(progress)
        
        self.db.commit()
        self.db.refresh(db_user)
        
        return UserSchema.model_validate(db_user)
    
    def get_learner(self, learner_id: str) -> Optional[UserSchema]:
        """Get learner by ID"""
        db_user = self.db.query(UserModel).filter(UserModel.id == learner_id).first()
        if not db_user:
            return None
        return UserSchema.model_validate(db_user)
    
    def get_all_learners(self, skip: int = 0, limit: int = 100) -> List[UserSchema]:
        """Get all learners"""
        db_users = self.db.query(UserModel).offset(skip).limit(limit).all()
        return [UserSchema.model_validate(user) for user in db_users]
    
    def delete_learner(self, learner_id: str) -> bool:
        """Delete learner and all related data"""
        db_user = self.db.query(UserModel).filter(UserModel.id == learner_id).first()
        if not db_user:
            return False
        
        # Delete related records (cascade should handle this, but explicit for safety)
        self.db.query(ConversationModel).filter(ConversationModel.learner_id == learner_id).delete()
        self.db.query(ProgressModel).filter(ProgressModel.learner_id == learner_id).delete()
        self.db.query(AssessmentModel).filter(AssessmentModel.learner_id == learner_id).delete()
        self.db.query(EvidenceModel).filter(EvidenceModel.learner_id == learner_id).delete()
        self.db.query(TaskModel).filter(TaskModel.learner_id == learner_id).delete()
        self.db.query(GapModel).filter(GapModel.learner_id == learner_id).delete()
        self.db.query(SkillModel).filter(SkillModel.learner_id == learner_id).delete()
        self.db.query(DocumentModel).filter(DocumentModel.learner_id == learner_id).delete()
        self.db.query(ProfileModel).filter(ProfileModel.learner_id == learner_id).delete()
        
        self.db.delete(db_user)
        self.db.commit()
        return True
    
    def get_learner_state(self, learner_id: str) -> Optional[LearnerState]:
        """Get complete learner state"""
        db_user = self.db.query(UserModel).filter(UserModel.id == learner_id).first()
        if not db_user:
            return None
        
        profile = self.db.query(ProfileModel).filter(ProfileModel.learner_id == learner_id).first()
        documents = self.db.query(DocumentModel).filter(DocumentModel.learner_id == learner_id).all()
        skills = self.db.query(SkillModel).filter(SkillModel.learner_id == learner_id).all()
        gaps = self.db.query(GapModel).filter(GapModel.learner_id == learner_id).all()
        tasks = self.db.query(TaskModel).filter(TaskModel.learner_id == learner_id).all()
        evidence = self.db.query(EvidenceModel).filter(EvidenceModel.learner_id == learner_id).all()
        assessments = self.db.query(AssessmentModel).filter(AssessmentModel.learner_id == learner_id).all()
        progress = self.db.query(ProgressModel).filter(ProgressModel.learner_id == learner_id).first()
        conversations = self.db.query(ConversationModel).filter(ConversationModel.learner_id == learner_id).all()
        
        # Create default profile if missing
        if not profile:
            profile_data = {
                "id": str(uuid.uuid4()),
                "learner_id": learner_id,
                "full_name": db_user.name,
                "experience_level": "Entry",
                "current_role": "Student",
                "career_goal": "Develop verified competencies",
                "target_role": "Data Analyst",
                "weekly_available_hours": 10,
                "initial_skills_text": "",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            profile = ProfileSchema(**profile_data)
        else:
            profile = ProfileSchema.model_validate(profile)
        
        # Create default progress if missing
        if not progress:
            progress_data = {
                "learner_id": learner_id,
                "completed_activities": 0,
                "total_activities": 0,
                "current_activities": 0,
                "remaining_gaps": 0,
                "recently_strengthened": [],
                "capabilities_needing_evidence": [],
                "next_milestone": "Upload documents to begin",
                "weekly_target_hours": 10,
                "hours_completed_this_week": 0.0
            }
            progress = LearnerProgressSchema(**progress_data)
        else:
            progress = LearnerProgressSchema.model_validate(progress)
        
        return LearnerState(
            user=UserSchema.model_validate(db_user),
            profile=profile,
            documents=[DocumentUploadSchema.model_validate(doc) for doc in documents],
            skills=[SkillCapabilitySchema.model_validate(skill) for skill in skills],
            selected_target_id=profile.target_role.lower().replace(" ", "-") if profile else "data-analyst",
            gaps=[SkillGapSchema.model_validate(gap) for gap in gaps],
            plan_tasks=[PlanTaskSchema.model_validate(task) for task in tasks],
            evidence_history=[EvidenceRecordSchema.model_validate(ev) for ev in evidence],
            assessments=[AssessmentRecordSchema.model_validate(assess) for assess in assessments],
            progress=progress,
            conversations=[PathConversationMessageSchema.model_validate(conv) for conv in conversations]
        )
    
    def update_learner_state(self, learner_id: str, state_data: LearnerStateCreate) -> Optional[LearnerState]:
        """Update complete learner state"""
        db_user = self.db.query(UserModel).filter(UserModel.id == learner_id).first()
        if not db_user:
            return None
        
        # Update user
        db_user.name = state_data.user.name
        db_user.email = state_data.user.email
        db_user.is_demo = state_data.user.is_demo
        
        # Update or create profile
        profile = self.db.query(ProfileModel).filter(ProfileModel.learner_id == learner_id).first()
        if profile:
            profile.full_name = state_data.profile.full_name
            profile.experience_level = state_data.profile.experience_level
            profile.current_role = state_data.profile.current_role
            profile.career_goal = state_data.profile.career_goal
            profile.target_role = state_data.profile.target_role
            profile.weekly_available_hours = state_data.profile.weekly_available_hours
            profile.initial_skills_text = state_data.profile.initial_skills_text
        else:
            profile = ProfileModel(
                learner_id=learner_id,
                full_name=state_data.profile.full_name,
                experience_level=state_data.profile.experience_level,
                current_role=state_data.profile.current_role,
                career_goal=state_data.profile.career_goal,
                target_role=state_data.profile.target_role,
                weekly_available_hours=state_data.profile.weekly_available_hours,
                initial_skills_text=state_data.profile.initial_skills_text
            )
            self.db.add(profile)
        
        # Update documents
        self.db.query(DocumentModel).filter(DocumentModel.learner_id == learner_id).delete()
        for doc_data in state_data.documents:
            doc = DocumentModel(
                learner_id=learner_id,
                filename=doc_data.filename,
                file_type=doc_data.file_type,
                size_bytes=doc_data.size_bytes,
                extracted_skills=self._json_dump(doc_data.extracted_skills),
                notes=doc_data.notes,
                status=doc_data.status
            )
            self.db.add(doc)
        
        # Update skills
        self.db.query(SkillModel).filter(SkillModel.learner_id == learner_id).delete()
        for skill_data in state_data.skills:
            skill = SkillModel(
                learner_id=learner_id,
                capability=skill_data.capability,
                category=skill_data.category,
                tags=self._json_dump(skill_data.tags),
                current_level=skill_data.current_level,
                evidence_found=skill_data.evidence_found,
                evidence_strength=skill_data.evidence_strength,
                source=skill_data.source,
                validation_status=skill_data.validation_status,
                target_level=skill_data.target_level
            )
            self.db.add(skill)
        
        # Update gaps
        self.db.query(GapModel).filter(GapModel.learner_id == learner_id).delete()
        for gap_data in state_data.gaps:
            gap = GapModel(
                learner_id=learner_id,
                capability=gap_data.capability,
                category=gap_data.category,
                current_evidence=gap_data.current_evidence,
                current_level=gap_data.current_level,
                target_requirement=gap_data.target_requirement,
                importance=gap_data.importance,
                gap=gap_data.gap,
                priority=gap_data.priority,
                reason=gap_data.reason,
                recommended_action=gap_data.recommended_action,
                estimated_hours_to_close=gap_data.estimated_hours_to_close
            )
            self.db.add(gap)
        
        # Update tasks
        self.db.query(TaskModel).filter(TaskModel.learner_id == learner_id).delete()
        for task_data in state_data.plan_tasks:
            task = TaskModel(
                learner_id=learner_id,
                day=task_data.day,
                capability=task_data.capability,
                learning_objective=task_data.learning_objective,
                practice_activity=task_data.practice_activity,
                expected_duration=task_data.expected_duration,
                duration_minutes=task_data.duration_minutes,
                deliverable=task_data.deliverable,
                evidence_requirement=task_data.evidence_requirement,
                status=task_data.status,
                why_it_matters=task_data.why_it_matters,
                priority_score=task_data.priority_score,
                evidence_id=task_data.evidence_id,
                completed_at=task_data.completed_at
            )
            self.db.add(task)
        
        # Update evidence
        self.db.query(EvidenceModel).filter(EvidenceModel.learner_id == learner_id).delete()
        for evidence_data in state_data.evidence_history:
            evidence = EvidenceModel(
                learner_id=learner_id,
                task_id=evidence_data.task_id,
                task_title=evidence_data.task_title,
                capability=evidence_data.capability,
                evidence_type=evidence_data.evidence_type,
                submitted_evidence=evidence_data.submitted_evidence,
                summary_notes=evidence_data.summary_notes,
                status=evidence_data.status,
                feedback=evidence_data.feedback,
                next_step=evidence_data.next_step,
                attachment_name=evidence_data.attachment_name
            )
            self.db.add(evidence)
        
        # Update assessments
        self.db.query(AssessmentModel).filter(AssessmentModel.learner_id == learner_id).delete()
        for assess_data in state_data.assessments:
            assessment = AssessmentModel(
                learner_id=learner_id,
                capability=assess_data.capability,
                previous_level=assess_data.previous_level,
                new_level=assess_data.new_level,
                previous_strength=assess_data.previous_strength,
                new_strength=assess_data.new_strength,
                triggered_by_evidence_id=assess_data.triggered_by_evidence_id,
                demonstrated_capabilities=self._json_dump(assess_data.demonstrated_capabilities),
                capabilities_still_missing=self._json_dump(assess_data.capabilities_still_missing),
                recommended_next_practice=assess_data.recommended_next_practice,
                action_summary=assess_data.action_summary
            )
            self.db.add(assessment)
        
        # Update progress
        progress = self.db.query(ProgressModel).filter(ProgressModel.learner_id == learner_id).first()
        if progress:
            progress.completed_activities = state_data.progress.completed_activities
            progress.total_activities = state_data.progress.total_activities
            progress.current_activities = state_data.progress.current_activities
            progress.remaining_gaps = state_data.progress.remaining_gaps
            progress.recently_strengthened = self._json_dump(state_data.progress.recently_strengthened)
            progress.capabilities_needing_evidence = self._json_dump(state_data.progress.capabilities_needing_evidence)
            progress.next_milestone = state_data.progress.next_milestone
            progress.weekly_target_hours = state_data.progress.weekly_target_hours
            progress.hours_completed_this_week = state_data.progress.hours_completed_this_week
        else:
            progress = ProgressModel(
                learner_id=learner_id,
                completed_activities=state_data.progress.completed_activities,
                total_activities=state_data.progress.total_activities,
                current_activities=state_data.progress.current_activities,
                remaining_gaps=state_data.progress.remaining_gaps,
                recently_strengthened=self._json_dump(state_data.progress.recently_strengthened),
                capabilities_needing_evidence=self._json_dump(state_data.progress.capabilities_needing_evidence),
                next_milestone=state_data.progress.next_milestone,
                weekly_target_hours=state_data.progress.weekly_target_hours,
                hours_completed_this_week=state_data.progress.hours_completed_this_week
            )
            self.db.add(progress)
        
        # Update conversations
        self.db.query(ConversationModel).filter(ConversationModel.learner_id == learner_id).delete()
        for conv_data in state_data.conversations:
            conversation = ConversationModel(
                learner_id=learner_id,
                sender=conv_data.sender,
                query=conv_data.query,
                response=conv_data.response,
                related_capability=conv_data.related_capability,
                actionable_task_id=conv_data.actionable_task_id
            )
            self.db.add(conversation)
        
        self.db.commit()
        self.db.refresh(db_user)
        
        return self.get_learner_state(learner_id)
