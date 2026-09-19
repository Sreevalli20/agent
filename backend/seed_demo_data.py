"""Seed database with demo learner data for production deployment"""
import sys
import os
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal
from app.models.learner import (
    User, Profile, DocumentUpload, SkillCapability, 
    SkillGap, PlanTask, EvidenceRecord, AssessmentRecord,
    LearnerProgress, PathConversationMessage
)
import json

def seed_demo_alex():
    """Seed Alex Chen demo learner with full state (idempotent - updates if exists)"""
    db = SessionLocal()
    
    try:
        # Check if Alex already exists
        existing_alex = db.query(User).filter(User.email == "alex.chen@example.edu").first()
        
        if existing_alex:
            print("Alex Chen demo learner already exists. Updating with comprehensive demo data...")
            learner_id = existing_alex.id
            
            # Delete existing related data for clean update
            db.query(PathConversationMessage).filter(PathConversationMessage.learner_id == learner_id).delete()
            db.query(LearnerProgress).filter(LearnerProgress.learner_id == learner_id).delete()
            db.query(AssessmentRecord).filter(AssessmentRecord.learner_id == learner_id).delete()
            db.query(EvidenceRecord).filter(EvidenceRecord.learner_id == learner_id).delete()
            db.query(PlanTask).filter(PlanTask.learner_id == learner_id).delete()
            db.query(SkillGap).filter(SkillGap.learner_id == learner_id).delete()
            db.query(SkillCapability).filter(SkillCapability.learner_id == learner_id).delete()
            db.query(DocumentUpload).filter(DocumentUpload.learner_id == learner_id).delete()
            db.query(Profile).filter(Profile.learner_id == learner_id).delete()
            
            # Update user
            existing_alex.name = "Alex Chen"
            existing_alex.is_demo = True
            db.flush()
        else:
            print("Creating new Alex Chen demo learner...")
            learner_id = "demo-learner-alex"
            
            # Create User
            alex_user = User(
                id=learner_id,
                name="Alex Chen",
                email="alex.chen@example.edu",
                is_demo=True,
                created_at=datetime.fromisoformat("2026-09-12T10:00:00Z")
            )
            db.add(alex_user)
            db.flush()
        
        # Create Profile
        alex_profile = Profile(
            id="profile-alex",
            learner_id=learner_id,
            full_name="Alex Chen",
            experience_level="Career Switcher",
            current_role="Operations Specialist",
            career_goal="Transition into a full-time Data Analyst role in tech or healthcare.",
            target_role="Data Analyst",
            weekly_available_hours=12,
            initial_skills_text="SQL, Advanced Excel, Pivot Tables, Business Reporting, Basic Python, Tableau basics",
            created_at=datetime.fromisoformat("2026-09-12T10:05:00Z"),
            updated_at=datetime.fromisoformat("2026-09-17T14:30:00Z")
        )
        db.add(alex_profile)
        
        # Create Documents
        documents = [
            DocumentUpload(
                id="doc-alex-1",
                learner_id=learner_id,
                filename="Alex_Chen_Resume_2026.pdf",
                file_type="application/pdf",
                size_bytes=248000,
                upload_date=datetime.fromisoformat("2026-09-12T10:10:00Z"),
                status="Verified",
                extracted_skills=json.dumps(['SQL', 'Excel', 'Operations Reporting', 'Process Audits']),
                notes="Contains 3 years of operations reporting experience with extensive Excel workbook management."
            ),
            DocumentUpload(
                id="doc-alex-2",
                learner_id=learner_id,
                filename="SQL_Certification_Credential.pdf",
                file_type="application/pdf",
                size_bytes=182000,
                upload_date=datetime.fromisoformat("2026-09-12T10:12:00Z"),
                status="Verified",
                extracted_skills=json.dumps(['SQL & Relational Querying', 'Database Indexing']),
                notes="Advanced SQL certificate verifying CTEs, aggregations, and window functions."
            ),
            DocumentUpload(
                id="doc-alex-3",
                learner_id=learner_id,
                filename="Inventory_Reconciliation_Project.pdf",
                file_type="application/pdf",
                size_bytes=412000,
                upload_date=datetime.fromisoformat("2026-09-14T09:20:00Z"),
                status="Processed",
                extracted_skills=json.dumps(['Business Statistics & Hypothesis Testing', 'Excel Automation']),
                notes="Project writeup demonstrating inventory variance reduction analysis."
            )
        ]
        for doc in documents:
            db.add(doc)
        
        # Create Skills
        skills = [
            SkillCapability(
                id="skill-alex-1",
                learner_id=learner_id,
                capability="SQL & Relational Querying",
                category="Technical",
                tags=json.dumps(['sql', 'relational-db', 'query-optimization', 'window-functions']),
                current_level="Intermediate",
                evidence_found="Advanced SQL certificate + 8 verified query scripts featuring window functions and multi-table joins.",
                evidence_strength="Strong evidence",
                source="Resume & SQL_Certification_Credential.pdf",
                validation_status="Verified",
                target_level="Advanced",
                last_updated=datetime.fromisoformat("2026-09-16T11:00:00Z")
            ),
            SkillCapability(
                id="skill-alex-2",
                learner_id=learner_id,
                capability="Power BI / Tableau Dashboarding",
                category="Technical",
                tags=json.dumps(['power-bi', 'tableau', 'dashboards', 'dax', 'reporting']),
                current_level="Beginner",
                evidence_found="Self-reported basic Tableau usage. No public dashboard or DAX metric formulas provided yet.",
                evidence_strength="Limited evidence",
                source="Self-Reported Profile Entry",
                validation_status="Needs validation",
                target_level="Intermediate",
                last_updated=datetime.fromisoformat("2026-09-12T10:15:00Z")
            ),
            SkillCapability(
                id="skill-alex-3",
                learner_id=learner_id,
                capability="Python Data Analysis (pandas/numpy)",
                category="Technical",
                tags=json.dumps(['python', 'pandas', 'numpy', 'data-wrangling']),
                current_level="Beginner",
                evidence_found="Completed introductory syntax exercises. No portfolio repository or EDA project found.",
                evidence_strength="Limited evidence",
                source="Self-Reported Profile Entry",
                validation_status="Needs validation",
                target_level="Intermediate",
                last_updated=datetime.fromisoformat("2026-09-12T10:15:00Z")
            ),
            SkillCapability(
                id="skill-alex-4",
                learner_id=learner_id,
                capability="Business Statistics & Hypothesis Testing",
                category="Analytics & BI",
                tags=json.dumps(['statistics', 'hypothesis-testing', 'variance-analysis', 'kpis']),
                current_level="Beginner",
                evidence_found="Inventory reconciliation variance calculations; needs rigorous A/B testing and p-value evaluation work.",
                evidence_strength="Moderate evidence",
                source="Inventory_Reconciliation_Project.pdf",
                validation_status="Verified",
                target_level="Intermediate",
                last_updated=datetime.fromisoformat("2026-09-14T09:25:00Z")
            ),
            SkillCapability(
                id="skill-alex-5",
                learner_id=learner_id,
                capability="Executive Communication & Storytelling",
                category="Soft Skills",
                tags=json.dumps(['communication', 'storytelling', 'presentations', 'stakeholders']),
                current_level="Intermediate",
                evidence_found="Operations memos and monthly executive slide presentations documented in employment history.",
                evidence_strength="Strong evidence",
                source="Alex_Chen_Resume_2026.pdf",
                validation_status="Verified",
                target_level="Intermediate",
                last_updated=datetime.fromisoformat("2026-09-12T10:15:00Z")
            ),
            SkillCapability(
                id="skill-alex-6",
                learner_id=learner_id,
                capability="Data Modeling & ETL Pipelines",
                category="Technical",
                tags=json.dumps(['etl', 'data-modeling', 'star-schema', 'warehousing']),
                current_level="None",
                evidence_found="No star schema, fact/dimension architecture, or pipeline documentation found.",
                evidence_strength="No evidence",
                source="Unverified",
                validation_status="Needs validation",
                target_level="Beginner",
                last_updated=datetime.fromisoformat("2026-09-12T10:15:00Z")
            )
        ]
        for skill in skills:
            db.add(skill)
        
        # Create Gaps
        gaps = [
            SkillGap(
                id="gap-alex-bi",
                learner_id=learner_id,
                capability="Power BI / Tableau Dashboarding",
                category="Analytics & BI",
                current_evidence="Limited evidence",
                current_level="Beginner",
                target_requirement="Intermediate",
                importance="Essential",
                gap="High",
                priority="Critical",
                reason="No strong dashboard project or practical evidence was found in the submitted profile.",
                recommended_action="Build an interactive multi-page business dashboard with calculated DAX measures and drill-through filters.",
                estimated_hours_to_close=14
            ),
            SkillGap(
                id="gap-alex-py",
                learner_id=learner_id,
                capability="Python Data Analysis (pandas/numpy)",
                category="Analytics & BI",
                current_evidence="Limited evidence",
                current_level="Beginner",
                target_requirement="Intermediate",
                importance="High",
                gap="Medium",
                priority="High",
                reason="Lacks documented exploratory data analysis (EDA) pipeline demonstrating data cleaning and distribution plotting.",
                recommended_action="Execute an end-to-end data cleaning notebook on a messy e-commerce dataset using pandas.",
                estimated_hours_to_close=16
            ),
            SkillGap(
                id="gap-alex-sql",
                learner_id=learner_id,
                capability="SQL & Relational Querying",
                category="Analytics & BI",
                current_evidence="Strong evidence",
                current_level="Intermediate",
                target_requirement="Advanced",
                importance="Essential",
                gap="Low",
                priority="Medium",
                reason="Solid query foundation verified, but needs demonstrated mastery of recursive CTEs and performance query plan optimization.",
                recommended_action="Complete advanced analytical SQL challenges using window partitions and query plan indexing.",
                estimated_hours_to_close=8
            ),
            SkillGap(
                id="gap-alex-stats",
                learner_id=learner_id,
                capability="Business Statistics & Hypothesis Testing",
                category="Analytics & BI",
                current_evidence="Moderate evidence",
                current_level="Beginner",
                target_requirement="Intermediate",
                importance="High",
                gap="Medium",
                priority="Medium",
                reason="Understands basic dispersion metrics, but lacks practical hypothesis testing and A/B test sample size determination.",
                recommended_action="Write an A/B experiment evaluation brief calculating confidence intervals and p-value power.",
                estimated_hours_to_close=10
            ),
            SkillGap(
                id="gap-alex-etl",
                learner_id=learner_id,
                capability="Data Modeling & ETL Pipelines",
                category="Analytics & BI",
                current_evidence="No evidence",
                current_level="None",
                target_requirement="Beginner",
                importance="Medium",
                gap="Medium",
                priority="Low",
                reason="No dimensional data modeling diagrams or star-schema design artifacts identified.",
                recommended_action="Draft a conceptual dimensional model diagram mapping transaction facts to dimension tables.",
                estimated_hours_to_close=6
            )
        ]
        for gap in gaps:
            db.add(gap)
        
        # Create Plan Tasks
        tasks = [
            PlanTask(
                id="task-alex-1",
                learner_id=learner_id,
                day=1,
                capability="SQL & Relational Querying",
                learning_objective="Analyze cohort retention and customer lifetime value using SQL window functions.",
                practice_activity="Write SQL queries using SUM() OVER (PARTITION BY customer_id ORDER BY order_date) and DENSE_RANK() on retail data.",
                expected_duration="60 minutes",
                duration_minutes=60,
                deliverable="Tested SQL script with 4 window queries and result screenshots.",
                evidence_requirement="Query file + execution output showing correct running totals and monthly retention cohorts.",
                status="Verified",
                why_it_matters="Demonstrates ability to answer complex business questions directly from relational data stores.",
                priority_score=92,
                evidence_id="ev-alex-1",
                completed_at=datetime.fromisoformat("2026-09-15T16:00:00Z")
            ),
            PlanTask(
                id="task-alex-2",
                learner_id=learner_id,
                day=2,
                capability="Power BI / Tableau Dashboarding",
                learning_objective="Design a clean visual KPI card grid and date hierarchy filter model.",
                practice_activity="Import sample retail CSV dataset into Power BI or Tableau and configure calendar dimensions with YTD revenue filters.",
                expected_duration="75 minutes",
                duration_minutes=75,
                deliverable="Visual layout mockup and data relationship schema.",
                evidence_requirement="Relationship view screenshot + 3 configured KPI cards.",
                status="Verified",
                why_it_matters="Establishes the structured data foundation needed before building executive visual dashboards.",
                priority_score=95,
                evidence_id="ev-alex-2",
                completed_at=datetime.fromisoformat("2026-09-16T18:00:00Z")
            ),
            PlanTask(
                id="task-alex-3",
                learner_id=learner_id,
                day=3,
                capability="Power BI / Tableau Dashboarding",
                learning_objective="Build an interactive business dashboard with dynamic DAX metrics.",
                practice_activity="Create a sales dashboard using the provided dataset. Implement Year-over-Year revenue variance and regional drill-down.",
                expected_duration="90 minutes",
                duration_minutes=90,
                deliverable="Dashboard screenshot or project file with calculated measures.",
                evidence_requirement="Dashboard + three business insights.",
                status="In progress",
                why_it_matters="Directly addresses your highest-priority capability gap by demonstrating end-to-end dashboarding proficiency.",
                priority_score=98
            ),
            PlanTask(
                id="task-alex-4",
                learner_id=learner_id,
                day=4,
                capability="Python Data Analysis (pandas/numpy)",
                learning_objective="Clean a non-standard tabular dataset and handle anomalous missing values.",
                practice_activity="Load messy survey data in pandas, impute missing demographic values, and normalize string encodings.",
                expected_duration="90 minutes",
                duration_minutes=90,
                deliverable="Jupyter notebook (.ipynb or HTML export) showing data pipeline before and after cleaning.",
                evidence_requirement="Documented notebook showing shape before/after and summary of data hygiene steps.",
                status="Not started",
                why_it_matters="Validates that you can handle dirty real-world datasets without manual spreadsheet labor.",
                priority_score=88
            ),
            PlanTask(
                id="task-alex-5",
                learner_id=learner_id,
                day=5,
                capability="Business Statistics & Hypothesis Testing",
                learning_objective="Formulate and evaluate a two-tailed hypothesis test on conversion rates.",
                practice_activity="Calculate p-values and 95% confidence intervals for a promotional campaign vs control group test.",
                expected_duration="60 minutes",
                duration_minutes=60,
                deliverable="Statistical analysis summary write-up (PDF or Markdown) with decision boundary.",
                evidence_requirement="Hypothesis statement, sample sizes, test statistic calculation, and business conclusion.",
                status="Not started",
                why_it_matters="Guarantees you do not make false positive recommendations that waste company capital.",
                priority_score=84
            ),
            PlanTask(
                id="task-alex-6",
                learner_id=learner_id,
                day=6,
                capability="Executive Communication & Storytelling",
                learning_objective="Synthesize data analysis findings into an executive briefing document.",
                practice_activity="Draft a 1-page stakeholder memorandum summarizing revenue risks and proposing three corrective actions.",
                expected_duration="60 minutes",
                duration_minutes=60,
                deliverable="1-page Executive Briefing Memo (PDF).",
                evidence_requirement="One-page document including executive summary, primary chart visual, and 3 strategic recommendations.",
                status="Not started",
                why_it_matters="Technical analysis has zero value if department directors cannot readily act upon the findings.",
                priority_score=80
            ),
            PlanTask(
                id="task-alex-7",
                learner_id=learner_id,
                day=7,
                capability="Data Modeling & ETL Pipelines",
                learning_objective="Construct a star-schema dimensional model for an e-commerce order workflow.",
                practice_activity="Map tables into 1 centralized fact table (Sales Fact) and 4 dimension tables (Customer, Date, Store, Product).",
                expected_duration="75 minutes",
                duration_minutes=75,
                deliverable="Entity-Relationship Diagram (ERD) with primary and foreign key mapping.",
                evidence_requirement="Schema visual + table definitions explaining granularity and surrogate keys.",
                status="Not started",
                why_it_matters="Enables high-performance data warehousing and clean BI report connections.",
                priority_score=74
            )
        ]
        for task in tasks:
            db.add(task)
        
        # Create Evidence Records
        evidence_records = [
            EvidenceRecord(
                id="ev-alex-1",
                learner_id=learner_id,
                task_id="task-alex-1",
                task_title="Cohort Retention Window Queries",
                capability="SQL & Relational Querying",
                evidence_type="GitHub link",
                submitted_evidence="https://github.com/alexchen-data/sql-analytics/blob/main/cohort_retention.sql",
                summary_notes="Implemented monthly customer cohort retention queries using DENSE_RANK() and window frames on 50,000 retail transactions.",
                date=datetime.fromisoformat("2026-09-15T15:45:00Z"),
                status="Verified",
                feedback="Evidence confirms proficient syntax with PARTITION BY and boundary clauses. Execution plan verified.",
                next_step="Capability upgraded to Advanced query proficiency. Focus shifts to visual dashboarding.",
                attachment_name="cohort_retention.sql"
            ),
            EvidenceRecord(
                id="ev-alex-2",
                learner_id=learner_id,
                task_id="task-alex-2",
                task_title="Visual KPI Card Grid and Model",
                capability="Power BI / Tableau Dashboarding",
                evidence_type="Screenshot",
                submitted_evidence="Verified screenshot of data model relationship diagram with 1:many joins and active date table.",
                summary_notes="Configured star-schema relationship and verified bidirectional filter behaviors in Power BI desktop.",
                date=datetime.fromisoformat("2026-09-16T17:50:00Z"),
                status="Verified",
                feedback="Model structure matches standard single-direction filter practices. Ready for interactive visual construction.",
                next_step="Proceed to Day 3: Build the interactive business dashboard with calculated measures.",
                attachment_name="powerbi_model_screenshot.png"
            )
        ]
        for ev in evidence_records:
            db.add(ev)
        
        # Create Assessment Records
        assessments = [
            AssessmentRecord(
                id="assess-alex-1",
                learner_id=learner_id,
                capability="SQL & Relational Querying",
                previous_level="Beginner",
                new_level="Intermediate",
                previous_strength="Limited evidence",
                new_strength="Strong evidence",
                triggered_by_evidence_id="ev-alex-1",
                date=datetime.fromisoformat("2026-09-15T16:00:00Z"),
                demonstrated_capabilities=json.dumps([
                    'Multi-table inner and left joins',
                    'Window partitioning with DENSE_RANK',
                    'Cohort retention time calculation'
                ]),
                capabilities_still_missing=json.dumps([
                    'Query plan performance tuning',
                    'Recursive Common Table Expressions'
                ]),
                recommended_next_practice="Apply window functions directly in reporting views.",
                action_summary="SQL capability upgraded from Beginner to Intermediate with verified evidence."
            ),
            AssessmentRecord(
                id="assess-alex-2",
                learner_id=learner_id,
                capability="Power BI / Tableau Dashboarding",
                previous_level="None",
                new_level="Beginner",
                previous_strength="No evidence",
                new_strength="Limited evidence",
                triggered_by_evidence_id="ev-alex-2",
                date=datetime.fromisoformat("2026-09-16T18:00:00Z"),
                demonstrated_capabilities=json.dumps([
                    'Data source connection and schema verification',
                    'Date table relationship configuration'
                ]),
                capabilities_still_missing=json.dumps([
                    'DAX calculated measures (YoY growth, moving averages)',
                    'Cross-filter interactive storytelling'
                ]),
                recommended_next_practice="Execute Day 3 practice: Complete interactive dashboard with DAX measures and 3 insights.",
                action_summary="Initial dashboarding setup verified. Capability currently progressing toward Intermediate."
            )
        ]
        for assess in assessments:
            db.add(assess)
        
        # Create Progress
        progress = LearnerProgress(
            learner_id=learner_id,
            completed_activities=2,
            total_activities=7,
            current_activities=1,
            remaining_gaps=4,
            recently_strengthened=json.dumps(['SQL & Relational Querying', 'Power BI / Tableau Dashboarding']),
            capabilities_needing_evidence=json.dumps(['Power BI / Tableau Dashboarding', 'Python Data Analysis (pandas/numpy)', 'Business Statistics & Hypothesis Testing']),
            next_milestone="Complete Day 3 Interactive Dashboard to close the highest-priority gap.",
            weekly_target_hours=12,
            hours_completed_this_week=4.5
        )
        db.add(progress)
        
        # Create Conversation
        conversation = PathConversationMessage(
            id="conv-alex-1",
            learner_id=learner_id,
            sender="learner",
            query="What should I learn today?",
            response="Your current primary focus is **Day 3: Power BI / Tableau Dashboarding**. You are scheduled to build an interactive business dashboard using the provided dataset, focusing on Year-over-Year variance and regional drill-downs (90 minutes). Completing this task and submitting your dashboard deliverable directly targets your highest-priority capability gap.",
            timestamp=datetime.fromisoformat("2026-09-17T09:00:00Z"),
            related_capability="Power BI / Tableau Dashboarding",
            actionable_task_id="task-alex-3"
        )
        db.add(conversation)
        
        db.commit()
        print("Alex Chen demo learner data seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding demo data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_alex()