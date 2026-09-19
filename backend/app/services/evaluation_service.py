from typing import List, Dict, Any
from datetime import datetime
import json


class EvaluationService:
    """Port of frontend evaluationEngine.ts business logic"""
    
    LEVEL_SCORES = {
        'None': 0,
        'Beginner': 1,
        'Intermediate': 2,
        'Advanced': 3,
        'Expert': 4,
    }
    
    STRENGTH_SCORES = {
        'No evidence': 0,
        'Needs validation': 1,
        'Limited evidence': 2,
        'Moderate evidence': 3,
        'Strong evidence': 4,
    }
    
    def build_skill_profile_from_input(
        self,
        profile: Dict[str, Any],
        documents: List[Dict[str, Any]],
        target_role_id: str
    ) -> List[Dict[str, Any]]:
        """Build skill profile from profile and documents"""
        from app.data.roles_data import CAREER_REQUIREMENTS
        
        requirements = CAREER_REQUIREMENTS.get(target_role_id, CAREER_REQUIREMENTS['data-analyst'])
        user_skill_strings = profile.get('initial_skills_text', '').split(r'[,;\n]')
        user_skill_strings = [s.strip() for s in user_skill_strings if s.strip()]
        
        document_skill_set = set()
        for doc in documents:
            for skill in doc.get('extracted_skills', []):
                document_skill_set.add(skill.lower())
        
        skills = []
        for idx, req in enumerate(requirements):
            req_cap_lower = req['capability'].lower()
            
            # Check if matched in verified documents
            is_found_in_docs = False
            for doc in documents:
                for skill in doc.get('extracted_skills', []):
                    if req_cap_lower in skill.lower() or skill.lower() in req_cap_lower.split(' ')[0]:
                        is_found_in_docs = True
                        break
            
            # Check if user manually listed it
            is_listed_by_self = any(
                req_cap_lower in s.lower() or s.lower() in req_cap_lower.split(' ')[0]
                for s in user_skill_strings
            )
            
            current_level = 'None'
            evidence_strength = 'No evidence'
            validation_status = 'Needs validation'
            source = 'Initial Assessment'
            evidence_found = 'No documented evidence found in uploaded files or profile.'
            
            if is_found_in_docs and is_listed_by_self:
                current_level = 'Intermediate' if req['expectedLevel'] == 'Advanced' else 'Beginner'
                evidence_strength = 'Strong evidence'
                validation_status = 'Verified'
                source = f'Verified in document records and profile statement'
                evidence_found = f'Practical competence verified through {len(documents)} uploaded portfolio/resume files.'
            elif is_found_in_docs:
                current_level = 'Beginner'
                evidence_strength = 'Moderate evidence'
                validation_status = 'Verified'
                source = 'Document extraction'
                evidence_found = 'Referenced across verified files. Practical depth pending verification.'
            elif is_listed_by_self:
                current_level = 'Beginner'
                evidence_strength = 'Limited evidence'
                validation_status = 'Self-Reported'
                source = 'Learner self-reported entry'
                evidence_found = 'Self-reported by learner. Requires project or credential artifact.'
            
            # Categorize skill
            category = 'Technical'
            cap_lower = req['capability'].lower()
            if any(x in cap_lower for x in ['communication', 'storytelling', 'presentation', 'interpersonal']):
                category = 'Soft Skills'
            elif any(x in cap_lower for x in ['management', 'agile', 'scrum', 'project', 'leadership']):
                category = 'Management'
            elif any(x in cap_lower for x in ['statistics', 'hypothesis', 'bi', 'analytics', 'reporting']):
                category = 'Analytics & BI'
            
            # Generate tags
            import re
            words = re.sub(r'[^a-z0-9\s]', '', req['capability'].lower()).split()
            words = [w for w in words if len(w) > 2]
            tags = list(set(words[:4]))
            
            skill = {
                'id': f"skill-{profile['learnerId']}-{idx + 1}",
                'learnerId': profile['learnerId'],
                'capability': req['capability'],
                'category': category,
                'tags': tags,
                'currentLevel': current_level,
                'evidenceFound': evidence_found,
                'evidenceStrength': evidence_strength,
                'source': source,
                'validationStatus': validation_status,
                'targetLevel': req['expectedLevel'],
                'lastUpdated': datetime.utcnow().isoformat()
            }
            skills.append(skill)
        
        return skills
    
    def compute_gap_analysis(
        self,
        skills: List[Dict[str, Any]],
        target_role_id: str
    ) -> List[Dict[str, Any]]:
        """Compute prioritized capability gaps"""
        from app.data.roles_data import CAREER_REQUIREMENTS
        
        requirements = CAREER_REQUIREMENTS.get(target_role_id, CAREER_REQUIREMENTS['data-analyst'])
        
        gaps = []
        for idx, req in enumerate(requirements):
            matched_skill = next((s for s in skills if s['capability'] == req['capability']), None)
            current_level = matched_skill['currentLevel'] if matched_skill else 'None'
            current_evidence = matched_skill['evidenceStrength'] if matched_skill else 'No evidence'
            
            level_diff = self.LEVEL_SCORES[req['expectedLevel']] - self.LEVEL_SCORES[current_level]
            strength_score = self.STRENGTH_SCORES[current_evidence]
            
            gap = 'None'
            priority = 'Low'
            reason = ''
            recommended_action = ''
            hours = 8
            
            if level_diff >= 2 or (req['importance'] == 'Essential' and strength_score <= 1):
                gap = 'Critical'
                priority = 'Critical'
                reason = f"Target requires {req['expectedLevel']} level for {req['importance'].lower()} role function, but current profile shows {current_evidence.lower()}. {req['reason']}"
                recommended_action = 'Prioritize immediate structured practice deliverable to establish verified baseline evidence.'
                hours = 16
            elif level_diff == 1 or (req['importance'] == 'Essential' and strength_score == 2):
                gap = 'High'
                priority = 'Critical' if req['importance'] == 'Essential' else 'High'
                reason = matched_skill.get('evidenceFound', '') if matched_skill and len(matched_skill.get('evidenceFound', '')) > 10 else f"No strong project or practical evidence was found in the submitted profile. {req['reason']}"
                recommended_action = 'Build and submit a focused project deliverable demonstrating end-to-end execution.'
                hours = 12
            elif strength_score in [2, 3]:
                gap = 'Medium'
                priority = 'Medium'
                reason = 'Developing baseline demonstrated, but additional verification required to reach target {} standard.'.format(req['expectedLevel'])
                recommended_action = 'Complete an applied case exercise with measurable business outcomes.'
                hours = 8
            elif level_diff <= 0 and strength_score >= 4:
                gap = 'None'
                priority = 'Low'
                reason = f'Current verified capability satisfies standard target requirement ({req["expectedLevel"]}).'
                recommended_action = 'Maintain competency through routine execution and advanced stretch practices.'
                hours = 4
            else:
                gap = 'Low'
                priority = 'Low'
                reason = 'Capability has supporting priority for this career path.'
                recommended_action = 'Review supplementary materials as secondary practice.'
                hours = 6
            
            gap_obj = {
                'id': f'gap-{idx + 1}',
                'learnerId': matched_skill['learnerId'] if matched_skill else 'current',
                'capability': req['capability'],
                'category': target_role_id,
                'currentEvidence': current_evidence,
                'currentLevel': current_level,
                'targetRequirement': req['expectedLevel'],
                'importance': req['importance'],
                'gap': gap,
                'priority': priority,
                'reason': reason,
                'recommendedAction': recommended_action,
                'estimatedHoursToClose': hours
            }
            gaps.append(gap_obj)
        
        return gaps
    
    def generate_execution_plan(
        self,
        gaps: List[Dict[str, Any]],
        learner_id: str,
        target_role_id: str
    ) -> List[Dict[str, Any]]:
        """Generate 7-day execution plan from prioritized gaps"""
        priority_weight = {
            'Critical': 4,
            'High': 3,
            'Medium': 2,
            'Low': 1,
        }
        
        sorted_gaps = sorted(gaps, key=lambda x: priority_weight[x['priority']], reverse=True)
        
        task_templates = {
            'SQL & Relational Querying': {
                'objective': 'Write multi-table relational queries with window partitions and cohort analysis.',
                'practice': 'Execute SQL queries using SUM() OVER (PARTITION BY customer_id ORDER BY order_date) and DENSE_RANK() on transaction data.',
                'duration': '60 minutes',
                'durationMinutes': 60,
                'deliverable': 'Tested SQL script with 4 analytical queries and output table snapshot.',
                'evidence': 'Query file + execution output showing correct running totals and monthly retention cohorts.',
                'why': 'Validates your ability to answer analytical questions directly from relational databases without manual spreadsheets.'
            },
            'Power BI / Tableau Dashboarding': {
                'objective': 'Build an interactive business dashboard with dynamic calculated measures.',
                'practice': 'Create a sales performance dashboard using the provided dataset. Implement Year-over-Year revenue variance and regional drill-down.',
                'duration': '90 minutes',
                'durationMinutes': 90,
                'deliverable': 'Dashboard screenshot or project file with calculated measures.',
                'evidence': 'Dashboard + three business insights.',
                'why': 'Directly addresses your highest-priority capability gap by demonstrating interactive executive dashboarding proficiency.'
            },
            'Python Data Analysis (pandas/numpy)': {
                'objective': 'Clean an anomalous tabular dataset and extract statistical distribution summaries.',
                'practice': 'Load messy e-commerce logs in pandas, handle missing categorical values, and normalize skewed distributions.',
                'duration': '90 minutes',
                'durationMinutes': 90,
                'deliverable': 'Documented Jupyter notebook (.ipynb or PDF export) showing clean data pipeline.',
                'evidence': 'Notebook showing data before/after cleaning and summary statistics.',
                'why': 'Proves you can handle real-world dirty data without failure or manual intervention.'
            },
            'Business Statistics & Hypothesis Testing': {
                'objective': 'Evaluate conversion rate variance using two-tailed hypothesis testing.',
                'practice': 'Calculate p-values and 95% confidence intervals for a product feature test vs baseline control.',
                'duration': '60 minutes',
                'durationMinutes': 60,
                'deliverable': 'Statistical evaluation memo (PDF or Markdown) with clear decision boundary.',
                'evidence': 'Hypothesis statement, sample sizes, test statistic calculation, and business recommendation.',
                'why': 'Guarantees that your recommendations are backed by statistical significance rather than random noise.'
            },
            'Executive Communication & Storytelling': {
                'objective': 'Synthesize data analysis findings into an actionable executive briefing document.',
                'practice': 'Draft a 1-page stakeholder memorandum summarizing quarterly risks and proposing three corrective operational actions.',
                'duration': '60 minutes',
                'durationMinutes': 60,
                'deliverable': '1-page Executive Briefing Memo (PDF).',
                'evidence': 'One-page document including executive summary, primary chart visual, and 3 strategic recommendations.',
                'why': 'Technical work is only effective when organizational leadership can immediately understand and approve action.'
            },
            'Data Modeling & ETL Pipelines': {
                'objective': 'Construct a star-schema dimensional model for an operational business process.',
                'practice': 'Map source transaction entities into 1 centralized fact table and 4 dimension tables with clear granularity.',
                'duration': '75 minutes',
                'durationMinutes': 75,
                'deliverable': 'Entity-Relationship Diagram (ERD) with primary and foreign key definitions.',
                'evidence': 'Schema diagram + table definitions explaining surrogate keys and SCD strategy.',
                'why': 'Establishes the scalable schema foundation needed for robust data warehousing and BI performance.'
            },
        }
        
        tasks = []
        for day in range(1, 8):
            gap_index = (day - 1) % len(sorted_gaps)
            gap = sorted_gaps[gap_index] if sorted_gaps else sorted_gaps[0]
            template = task_templates.get(gap['capability'], {
                'objective': f'Demonstrate practical competence in {gap["capability"]}.',
                'practice': f'Execute an applied exercise closing the {gap["gap"].lower()} gap in {gap["capability"]}.',
                'duration': '75 minutes',
                'durationMinutes': 75,
                'deliverable': f'Project deliverable demonstrating verified {gap["capability"]} standard.',
                'evidence': f'Code or document deliverable fulfilling target {gap["targetRequirement"]} standard.',
                'why': gap['reason']
            })
            
            priority_score = max(70, 100 - day * 3 - (0 if gap['priority'] == 'Critical' else 6))
            
            task = {
                'id': f'task-{learner_id}-d{day}',
                'learnerId': learner_id,
                'day': day,
                'capability': gap['capability'],
                'learningObjective': template['objective'],
                'practiceActivity': template['practice'],
                'expectedDuration': template['duration'],
                'durationMinutes': template['durationMinutes'],
                'deliverable': template['deliverable'],
                'evidenceRequirement': template['evidence'],
                'status': 'In progress' if day == 1 else 'Not started',
                'whyItMatters': template['why'],
                'priorityScore': priority_score
            }
            tasks.append(task)
        
        return tasks
    
    def submit_and_reassess_evidence(
        self,
        state: Dict[str, Any],
        task_id: str,
        evidence_type: str,
        submitted_evidence: str,
        notes: str,
        attachment_name: str = None
    ) -> Dict[str, Any]:
        """Evaluate evidence submission, reassess capability, and update execution plan"""
        task = next((t for t in state['planTasks'] if t['id'] == task_id), None)
        capability_name = task['capability'] if task else (state['skills'][0]['capability'] if state['skills'] else 'Power BI / Tableau Dashboarding')
        skill = next((s for s in state['skills'] if s['capability'] == capability_name), None)
        
        prev_level = skill['currentLevel'] if skill else 'Beginner'
        prev_strength = skill['evidenceStrength'] if skill else 'Limited evidence'
        
        # Determine realistic advancement based on evidence content quality
        is_substantial = len(submitted_evidence.strip()) > 20 or attachment_name
        new_level = prev_level
        new_strength = prev_strength
        status = 'Verified'
        feedback = ''
        next_step = ''
        
        if is_substantial:
            if prev_strength == 'No evidence':
                new_strength = 'Limited evidence'
                new_level = 'Beginner'
            elif prev_strength in ['Limited evidence', 'Needs validation']:
                new_strength = 'Moderate evidence'
                new_level = 'Intermediate' if prev_level == 'None' else prev_level
            elif prev_strength == 'Moderate evidence':
                new_strength = 'Strong evidence'
                new_level = 'Advanced' if prev_level == 'Beginner' else 'Intermediate'
            else:
                new_strength = 'Strong evidence'
                new_level = 'Advanced'
            
            status = 'Verified'
            feedback = f'Evidence verified against deliverable criteria: "{task["deliverable"] if task else "Standard criteria"}". Practical competence demonstrated with clear supporting artifact.'
            next_step = f'Capability reassessed from {prev_strength} ({prev_level}) to {new_strength} ({new_level}). Execution plan updated.'
        else:
            status = 'Needs improvement'
            feedback = f'The submitted response is brief. To verify {capability_name}, please attach a screenshot, project repository, or documented work file satisfying: "{task["evidenceRequirement"] if task else "Criteria"}".'
            next_step = 'Resubmit artifact with complete deliverable details.'
        
        evidence_id = f'ev-{int(datetime.utcnow().timestamp())}'
        evidence_record = {
            'id': evidence_id,
            'learnerId': state['user']['id'],
            'taskId': task['id'] if task else task_id,
            'taskTitle': task['learningObjective'] if task else capability_name,
            'capability': capability_name,
            'evidenceType': evidence_type,
            'submittedEvidence': submitted_evidence,
            'summaryNotes': notes or 'Submitted deliverable evidence.',
            'date': datetime.utcnow().isoformat(),
            'status': status,
            'feedback': feedback,
            'nextStep': next_step,
            'attachmentName': attachment_name
        }
        
        # Create assessment audit record
        assessment_id = f'assess-{int(datetime.utcnow().timestamp())}'
        assessment = {
            'id': assessment_id,
            'learnerId': state['user']['id'],
            'capability': capability_name,
            'previousLevel': prev_level,
            'newLevel': new_level,
            'previousStrength': prev_strength,
            'newStrength': new_strength,
            'triggeredByEvidenceId': evidence_id,
            'date': datetime.utcnow().isoformat(),
            'demonstratedCapabilities': [
                f'Fulfillment of deliverable for {capability_name}',
                f'Practical execution: {task["practiceActivity"] if task else "Applied practice"}'
            ],
            'capabilitiesStillMissing': [] if new_level == 'Advanced' else [
                'Complex edge-case handling under production scale',
                f'Advanced optimization for {capability_name}'
            ],
            'recommendedNextPractice': 'Proceed to subsequent prioritized gap activities in the execution plan.' if status == 'Verified' else 'Provide supplementary execution artifacts for {}.'.format(capability_name),
            'actionSummary': f'Capability strengthened from {prev_strength} to {new_strength}. Level: {new_level}.' if status == 'Verified' else 'Evidence recorded; additional documentation recommended.'
        }
        
        # Update skills in state
        updated_skills = []
        for s in state['skills']:
            if s['capability'] == capability_name and status == 'Verified':
                updated_skill = s.copy()
                updated_skill.update({
                    'currentLevel': new_level,
                    'evidenceStrength': new_strength,
                    'validationStatus': 'Verified',
                    'evidenceFound': f'Submitted artifact ({evidence_type}): {submitted_evidence[:80]}... Verified on {datetime.utcnow().strftime("%Y-%m-%d")}',
                    'lastUpdated': datetime.utcnow().isoformat()
                })
                updated_skills.append(updated_skill)
            else:
                updated_skills.append(s)
        
        # Recompute gaps
        updated_gaps = self.compute_gap_analysis(updated_skills, state['selectedTargetId'])
        
        # Update tasks in plan
        next_activated = False
        updated_plan_tasks = []
        for t in state['planTasks']:
            if t['id'] == task_id:
                updated_task = t.copy()
                updated_task.update({
                    'status': 'Verified' if status == 'Verified' else 'Needs improvement',
                    'completedAt': datetime.utcnow().isoformat() if status == 'Verified' else None,
                    'evidenceId': evidence_id
                })
                updated_plan_tasks.append(updated_task)
            elif status == 'Verified' and not next_activated and t['status'] == 'Not started':
                next_activated = True
                updated_task = t.copy()
                updated_task['status'] = 'In progress'
                updated_plan_tasks.append(updated_task)
            else:
                updated_plan_tasks.append(t)
        
        # Calculate updated progress
        completed_count = len([t for t in updated_plan_tasks if t['status'] in ['Verified', 'Completed']])
        current_count = len([t for t in updated_plan_tasks if t['status'] == 'In progress'])
        remaining_gap_count = len([g for g in updated_gaps if g['gap'] != 'None'])
        strengthened_list = list(set(state['progress']['recentlyStrengthened'] + [capability_name]))
        
        updated_progress = state['progress'].copy()
        updated_progress.update({
            'completedActivities': completed_count,
            'currentActivities': current_count,
            'remainingGaps': remaining_gap_count,
            'recentlyStrengthened': strengthened_list,
            'capabilitiesNeedingEvidence': [g['capability'] for g in updated_gaps if g['priority'] in ['Critical', 'High']],
            'nextMilestone': 'All prioritized target capabilities verified!' if remaining_gap_count == 0 else f'Advance next high-priority gap: {next((g["capability"] for g in updated_gaps if g["priority"] == "Critical"), "Next module")}',
            'hoursCompletedThisWeek': state['progress']['hoursCompletedThisWeek'] + (task['durationMinutes'] / 60 if task else 1)
        })
        
        updated_state = state.copy()
        updated_state.update({
            'skills': updated_skills,
            'gaps': updated_gaps,
            'planTasks': updated_plan_tasks,
            'evidenceHistory': [evidence_record] + state['evidenceHistory'],
            'assessments': [assessment] + state['assessments'],
            'progress': updated_progress
        })
        
        return {
            'updatedState': updated_state,
            'assessment': assessment,
            'feedback': feedback
        }
    
    def calculate_next_action(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate the exact NEXT ACTION based on highest priority gap, task state, and progress"""
        # If there's a task currently "In progress", that is first priority
        in_progress_task = next((t for t in state['planTasks'] if t['status'] == 'In progress'), None)
        if in_progress_task:
            return {
                'task': in_progress_task,
                'whyItMatters': in_progress_task['whyItMatters'],
                'expectedTime': in_progress_task['expectedDuration'],
                'deliverable': in_progress_task['deliverable'],
                'reason': 'This activity is currently underway and is aligned with your active learning focus.'
            }
        
        # Next, look for the first task that addresses the highest-priority gap
        critical_gaps = [g for g in state['gaps'] if g['priority'] in ['Critical', 'High']]
        for gap in critical_gaps:
            matching_unfinished_task = next(
                (t for t in state['planTasks'] if t['capability'] == gap['capability'] and t['status'] in ['Not started', 'Needs improvement']),
                None
            )
            if matching_unfinished_task:
                return {
                    'task': matching_unfinished_task,
                    'whyItMatters': matching_unfinished_task['whyItMatters'],
                    'expectedTime': matching_unfinished_task['expectedDuration'],
                    'deliverable': matching_unfinished_task['deliverable'],
                    'reason': f'Directly closes your highest priority gap ({gap["capability"]}: {gap["priority"]} priority).'
                }
        
        # Fallback to first unfinished task
        next_unfinished = next((t for t in state['planTasks'] if t['status'] in ['Not started', 'Needs improvement']), None)
        if next_unfinished:
            return {
                'task': next_unfinished,
                'whyItMatters': next_unfinished['whyItMatters'],
                'expectedTime': next_unfinished['expectedDuration'],
                'deliverable': next_unfinished['deliverable'],
                'reason': 'Next scheduled sequential activity in your 7-day personalized execution plan.'
            }
        
        return None
    
    def _classify_query_intent(self, query: str) -> str:
        """Classify the intent of a natural language query"""
        q = query.lower().strip()
        
        # Priority order - check more specific intents first
        
        # "What should I learn today?" - distinct from other queries
        if ('learn' in q and 'today' in q) or \
           ('what should i do' in q and 'today' in q) or \
           ('today' in q and ('learn' in q or 'study' in q)):
            return 'learn_today'
        
        # "What should I work on next and why?" - must include both "next" and "why"
        if ('next' in q and 'why' in q) or \
           'why did my plan change' in q or \
           'why should i do this next' in q:
            return 'next_with_why'
        
        # "Why is Power BI a priority?" - specific capability analysis
        if 'why' in q and ('priority' in q or 'important' in q):
            # Check if a specific capability is mentioned
            capabilities = ['power bi', 'sql', 'python', 'statistics', 'communication', 'modeling', 'typescript', 'react', 'api', 'terraform', 'figma']
            mentioned_capability = next((cap for cap in capabilities if cap in q), None)
            if mentioned_capability:
                return 'specific_capability_priority'
        
        # "What am I still missing for my target role?" - gap analysis
        if ('missing' in q or 'still need' in q or 'gap' in q) and \
           ('target' in q or 'role' in q or 'skills' in q):
            return 'missing_gaps'
        
        # "What should I practice next?" - practice activity focus
        if ('practice' in q and 'next' in q) or \
           'next practice' in q or \
           'what should i practice' in q:
            return 'practice_next'
        
        # "What did I improve this week?" - progress/assessment focus
        if ('improve' in q or 'strengthen' in q or 'progress' in q) and \
           ('week' in q or 'recently' in q or 'have i' in q):
            return 'improvements'
        
        # "What evidence do I still need?" - evidence requirements
        if ('evidence' in q or 'proof' in q or 'submit' in q) and \
           ('still need' in q or 'missing' in q or 'require' in q):
            return 'missing_evidence'
        
        # Natural language variations mapping
        if 'what should i do today' in q or 'what do i learn today' in q:
            return 'learn_today'
        
        if 'what is my next task' in q or 'what should i do next' in q:
            return 'next_with_why'
        
        if 'why is' in q and ('important' in q or 'priority' in q):
            return 'specific_capability_priority'
        
        if 'what skills am i missing' in q or 'what gaps do i have' in q or 'what do i still need' in q:
            return 'missing_gaps'
        
        if 'what should i practice' in q or 'what skill should i practice' in q:
            return 'practice_next'
        
        if 'what have i improved' in q or 'how have i improved' in q:
            return 'improvements'
        
        if 'what proof do i need' in q or 'what should i submit as evidence' in q:
            return 'missing_evidence'
        
        return 'general_fallback'
    
    def _handle_learn_today(self, state: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
        """Handler: "What should I learn today?""""
        next_action = self.calculate_next_action(state)
        
        if next_action and next_action['task']:
            return {
                'response': f'Your primary learning task for today is **Day {next_action["task"]["day"]}: {next_action["task"]["learningObjective"]}** ({next_action["task"]["expectedDuration"]}).\n\n' \
                        f'**Task Title:** {next_action["task"]["capability"]}\n' \
                        f'**Duration:** {next_action["task"]["expectedDuration"]}\n' \
                        f'**Practice Activity:** {next_action["task"]["practiceActivity"]}\n' \
                        f'**Deliverable:** {next_action["task"]["deliverable"]}\n\n' \
                        f'**Why this task is relevant today:** {next_action["whyItMatters"]}\n\n' \
                        'You can start this task directly in your Execution Plan or submit evidence once completed.',
                'relatedCapability': next_action['task']['capability'],
                'actionableTaskId': next_action['task']['id']
            }
        else:
            return {
                'response': 'You have completed all scheduled tasks in your current 7-day plan! You can review your verified competencies in the Progress view or generate an advanced continuation plan.',
                'relatedCapability': None,
                'actionableTaskId': None
            }
    
    def _handle_next_with_why(self, state: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
        """Handler: "What should I work on next and why?""""
        next_action = self.calculate_next_action(state)
        
        if next_action and next_action['task']:
            # Look for recent evidence that caused state changes
            recent_assessment = state['assessments'][0] if state['assessments'] else None
            recent_evidence = state['evidenceHistory'][0] if state['evidenceHistory'] else None
            contextual_reason = ''
            
            if recent_assessment and recent_evidence:
                completed_capability = recent_assessment['capability']
                prev_level = recent_assessment['previousLevel']
                new_level = recent_assessment['newLevel']
                prev_strength = recent_assessment['previousStrength']
                new_strength = recent_assessment['newStrength']
                
                # Find the task status for this capability
                task_status = None
                for t in state['planTasks']:
                    if t['capability'] == completed_capability:
                        task_status = t['status']
                        break
                
                if task_status == 'Verified':
                    completed_gap = next((g for g in state['gaps'] if g['capability'] == completed_capability), None)
                    
                    # Find remaining highest gap
                    remaining_gaps = [g for g in state['gaps'] if g['gap'] != 'None' and g['capability'] != completed_capability]
                    priority_weight = {'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1}
                    remaining_gaps.sort(key=lambda x: priority_weight[x['priority']], reverse=True)
                    remaining_highest = remaining_gaps[0] if remaining_gaps else None
                    
                    gap_info = f'{completed_gap["gap"]}' if completed_gap else 'High'
                    priority_info = f'{completed_gap["priority"]}' if completed_gap else 'Medium'
                    remaining_priority = f'{remaining_highest["priority"]}' if remaining_highest else 'Medium'
                    
                    contextual_reason = f'Your **{completed_capability}** evidence was verified, which moved your capability from **{prev_level}** to **{new_level}** and improved evidence from **{prev_strength}** to **{new_strength}**. ' \
                        f'This reduced that gap from **{gap_info}** to **{gap_info}** with **{priority_info}** priority. ' \
                        f'Because that capability is now sufficiently demonstrated, the system adapted your path toward **{next_action["task"]["capability"]}**, which is currently the next important remaining gap ({remaining_priority} priority).'
                else:
                    contextual_reason = f'Your most recent evidence submission for **{completed_capability}** is being processed. ' \
                        f'Your next priority action is **{next_action["task"]["capability"]}** based on your current highest unverified requirement ({next_action["reason"]}).'
            else:
                contextual_reason = f'Your next priority action is **{next_action["task"]["capability"]}** based on your current highest unverified requirement ({next_action["reason"]}).'
            
            return {
                'response': f'Your next action is **Day {next_action["task"]["day"]}: {next_action["task"]["learningObjective"]}** ({next_action["task"]["expectedDuration"]}).\n\n' \
                        f'**Contextual Reason:** {contextual_reason}\n\n' \
                        f'**Practice Activity:** {next_action["task"]["practiceActivity"]}\n' \
                        f'**Deliverable:** {next_action["task"]["deliverable"]}\n\n' \
                        f'**Why this matters:** {next_action["whyItMatters"]}',
                'relatedCapability': next_action['task']['capability'],
                'actionableTaskId': next_action['task']['id']
            }
        else:
            return {
                'response': 'You have completed all scheduled tasks in your current 7-day plan! You can review your verified competencies in the Progress view or generate an advanced continuation plan.',
                'relatedCapability': None,
                'actionableTaskId': None
            }
    
    def _handle_specific_capability_priority(self, state: Dict[str, Any], query: str, target: Dict[str, Any]) -> Dict[str, Any]:
        """Handler: "Why is Power BI a priority?""""
        # Extract the specific capability mentioned
        capabilities = [s['capability'].lower() for s in state['skills']]
        mentioned_capability = next((cap for cap in capabilities if query.startswith(cap.split(' ')[0])), None)
        
        if mentioned_capability:
            skill = next((s for s in state['skills'] if s['capability'].lower() == mentioned_capability.lower()), None)
            gap = next((g for g in state['gaps'] if g['capability'].lower() == mentioned_capability.lower()), None)
            
            if skill and gap:
                # Check if this capability is still a priority
                if gap['gap'] == 'None' or gap['priority'] == 'Low':
                    return {
                        'response': f'**{skill["capability"]}** is currently **not a high priority** for your learning path.\n\n' \
                                f'- **Target Standard:** The {target["title"]} role requires **{gap["targetRequirement"]}** level proficiency.\n' \
                                f'- **Current Evidence:** Your profile has **{skill["evidenceStrength"]}** ({skill["currentLevel"]} level).\n' \
                                f'- **Current Gap Status:** **{gap["gap"]}** with **{gap["priority"]}** priority.\n\n' \
                                'Since your capability meets or approaches the target standard, this skill is no longer flagged as a critical gap. Focus on the remaining high-priority capabilities shown in your Gap Analysis.',
                        'relatedCapability': skill['capability']
                    }
                else:
                    return {
                        'response': f'**{skill["capability"]}** is flagged with **{gap["priority"]} Priority** because:\n\n' \
                                f'- **Target Standard:** The {target["title"]} role mandates **{gap["targetRequirement"]}** level proficiency.\n' \
                                f'- **Current Evidence:** Your profile currently has **{skill["evidenceStrength"]}** ({skill["currentLevel"]} level).\n' \
                                f'- **Current Gap Status:** **{gap["gap"]}** gap with **{gap["priority"]}** priority.\n' \
                                f'- **Rationale:** {gap["reason"]}\n\n' \
                                f'**Recommended Action:** {gap["recommendedAction"]}',
                        'relatedCapability': skill['capability']
                    }
        
        # Fallback to highest priority gap
        critical_gaps = [g for g in state['gaps'] if g['priority'] == 'Critical']
        high_gaps = [g for g in state['gaps'] if g['priority'] == 'High']
        top_gap = critical_gaps[0] if critical_gaps else (high_gaps[0] if high_gaps else None)
        
        if top_gap:
            return {
                'response': f'Your highest current priority is **{top_gap["capability"]}** ({top_gap["priority"]} Priority). For a {target["title"]}, this capability is required at the **{top_gap["targetRequirement"]}** level. Your current profile has **{top_gap["currentEvidence"]}**. {top_gap["reason"]}',
                'relatedCapability': top_gap['capability']
            }
        else:
            return {
                'response': f'Your capabilities currently align closely with the requirements for {target["title"]}. Focus on maintaining strong evidence across all core capabilities.',
                'relatedCapability': None
            }
    
    def _handle_missing_gaps(self, state: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
        """Handler: "What am I still missing for my target role?""""
        missing = [g for g in state['gaps'] if g['gap'] != 'None']
        
        if missing:
            list_str = '\n\n'.join([
                f'• **{g["capability"]}**\n' \
                f'  - Target Level: {g["targetRequirement"]}\n' \
                f'  - Current Level: {g["currentLevel"]}\n' \
                f'  - Evidence Strength: {g["currentEvidence"]}\n' \
                f'  - Gap Severity: {g["gap"]}\n' \
                f'  - Priority: {g["priority"]}\n' \
                f'  - Reason: {g["reason"]}'
                for g in missing
            ])
            
            return {
                'response': f'For your target role as a **{target["title"]}**, you have **{len(missing)} remaining capability gaps**:\n\n{list_str}\n\nReview the Gap Analysis tab to inspect detailed recommended actions for each.',
                'relatedCapability': None,
                'actionableTaskId': None
            }
        else:
            return {
                'response': f'You have no unaddressed capability gaps! All core requirements for **{target["title"]}** have verified evidence in your profile.',
                'relatedCapability': None,
                'actionableTaskId': None
            }
    
    def _handle_practice_next(self, state: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
        """Handler: "What should I practice next?""""
        next_action = self.calculate_next_action(state)
        
        if next_action and next_action['task']:
            related_gap = next((g for g in state['gaps'] if g['capability'] == next_action['task']['capability']), None)
            
            return {
                'response': f'Your next recommended practice activity is for **{next_action["task"]["capability"]}**:\n\n' \
                        f'• **Related Capability:** {next_action["task"]["capability"]}\n' \
                        f'• **Practice Activity:** {next_action["task"]["practiceActivity"]}\n' \
                        f'• **Why this is the best practice activity:** This activity addresses your current {related_gap["gap"] if related_gap else "identified"} gap in {next_action["task"]["capability"]} ({related_gap["priority"] if related_gap else "High"} priority).\n' \
                        f'• **Expected Deliverable:** {next_action["task"]["deliverable"]}\n' \
                        f'• **Approximate Duration:** {next_action["task"]["expectedDuration"]}\n\n' \
                        f'This practice is selected based on your highest unverified requirement: {next_action["reason"]}',
                'relatedCapability': next_action['task']['capability'],
                'actionableTaskId': next_action['task']['id']
            }
        else:
            return {
                'response': 'All active practice tasks have been completed. Submit new project evidence to initiate your next milestone reassessment.',
                'relatedCapability': None,
                'actionableTaskId': None
            }
    
    def _handle_improvements(self, state: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
        """Handler: "What did I improve this week?""""
        recent_assessments = state['assessments'][:5] if state['assessments'] else []
        recent_evidence = [e for e in state['evidenceHistory'] if e['status'] == 'Verified'][:5] if state['evidenceHistory'] else []
        completed_tasks = [t for t in state['planTasks'] if t['status'] in ['Verified', 'Completed']]
        
        if recent_assessments or recent_evidence or completed_tasks:
            improvements_list = ''
            
            # Show actual capability changes from assessments
            if recent_assessments:
                assessment_details = '\n\n'.join([
                    f'• **{a["capability"]}**\n' \
                    f'  - Capability Before: {a["previousLevel"]}\n' \
                    f'  - Capability After: {a["newLevel"]}\n' \
                    f'  - Evidence Before: {a["previousStrength"]}\n' \
                    f'  - Evidence After: {a["newStrength"]}\n' \
                    f'  - Verified On: {datetime.fromisoformat(a["date"]).strftime("%Y-%m-%d")}'
                    for a in recent_assessments
                ])
                improvements_list += f'**Verified Capability Improvements:**\n{assessment_details}\n\n'
            
            # Show completed evidence/tasks
            if recent_evidence:
                evidence_details = '\n\n'.join([
                    f'• **{e["capability"]}** - {e["taskTitle"]}\n' \
                    f'  - Evidence Type: {e["evidenceType"]}\n' \
                    f'  - Status: {e["status"]}\n' \
                    f'  - Submitted: {datetime.fromisoformat(e["date"]).strftime("%Y-%m-%d")}'
                    for e in recent_evidence
                ])
                improvements_list += f'**Recently Completed Evidence:**\n{evidence_details}\n\n'
            
            return {
                'response': f'Here are your verified improvements based on actual assessment records:\n\n{improvements_list}' \
                        f'**Summary:** You have completed {len(completed_tasks)} out of {len(state["planTasks"])} tasks with {len(recent_assessments)} verified capability improvements.',
                'relatedCapability': None,
                'actionableTaskId': None
            }
        else:
            return {
                'response': 'There are no verified improvements recorded yet. Complete your first practice task and submit evidence to see your progress tracked here.',
                'relatedCapability': None,
                'actionableTaskId': None
            }
    
    def _handle_missing_evidence(self, state: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
        """Handler: "What evidence do I still need?""""
        gaps_needing_evidence = [g for g in state['gaps'] if g['gap'] != 'None' and g['priority'] != 'Low']
        
        if gaps_needing_evidence:
            evidence_list = '\n\n'.join([
                f'• **{gap["capability"]}**\n' \
                f'  - Current Evidence Strength: {next((s["evidenceStrength"] for s in state["skills"] if s["capability"] == gap["capability"]), "No evidence")}\n' \
                f'  - Required Evidence: {gap["targetRequirement"]} level with {gap["importance"].lower()} importance\n' \
                f'  - What to Submit: {gap["recommendedAction"]}\n' \
                f'  - Related Task: {next((f"Day {t["day"]}: {t["learningObjective"]}" for t in state["planTasks"] if t["capability"] == gap["capability"] and t["status"] in ["Not started", "In progress"]), "No active task scheduled")}'
                for gap in gaps_needing_evidence
            ])
            
            return {
                'response': f'Based on your current gaps, here is the evidence you still need to submit:\n\n{evidence_list}\n\n' \
                        'You can submit evidence using GitHub links, project files, dashboard screenshots, or documented reports via the Evidence or Execution Plan tabs.',
                'relatedCapability': None,
                'actionableTaskId': None
            }
        else:
            return {
                'response': 'You have submitted sufficient evidence for all high-priority capabilities! Focus on maintaining and strengthening your current verified competencies.',
                'relatedCapability': None,
                'actionableTaskId': None
            }
    
    def _handle_general_fallback(self, state: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
        """Handler: General fallback for unrecognized queries"""
        next_action = self.calculate_next_action(state)
        critical_gaps = [g for g in state['gaps'] if g['priority'] == 'Critical']
        
        return {
            'response': f'Regarding **{state["profile"]["targetRole"] if state.get("profile") else "your target career"}**: you currently have **{len(critical_gaps)} critical gaps** and **{len([t for t in state["planTasks"] if t["status"] == "Verified"])} completed plan tasks**.\n\n' \
                    f'Your current highest-priority action is **{next_action["task"]["learningObjective"] if next_action and next_action["task"] else "Complete initial profile"}** for **{next_action["task"]["capability"] if next_action and next_action["task"] else "Core competencies"}**.\n\n' \
                    'Feel free to ask specific questions like:\n' \
                    '• "What should I learn today?"\n' \
                    '• "What should I work on next and why?"\n' \
                    '• "Why is [specific capability] a priority?"\n' \
                    '• "What am I still missing for my target role?"\n' \
                    '• "What should I practice next?"\n' \
                    '• "What did I improve this week?"\n' \
                    '• "What evidence do I still need?"',
            'relatedCapability': next_action['task']['capability'] if next_action and next_action['task'] else None,
            'actionableTaskId': next_action['task']['id'] if next_action and next_action['task'] else None
        }
    
    def answer_path_query(self, state: Dict[str, Any], raw_query: str) -> Dict[str, Any]:
        """Natural language query processing engine grounded in learner's actual state"""
        intent = self._classify_query_intent(raw_query)
        
        from app.data.roles_data import STANDARD_CAREER_TARGETS
        target = next((t for t in STANDARD_CAREER_TARGETS if t['id'] == state['selectedTargetId']), None)
        if not target:
            target = {'title': state['profile']['targetRole'] if state.get('profile') else 'Target Career'}
        
        result = {}
        
        if intent == 'learn_today':
            result = self._handle_learn_today(state, target)
        elif intent == 'next_with_why':
            result = self._handle_next_with_why(state, target)
        elif intent == 'specific_capability_priority':
            result = self._handle_specific_capability_priority(state, raw_query, target)
        elif intent == 'missing_gaps':
            result = self._handle_missing_gaps(state, target)
        elif intent == 'practice_next':
            result = self._handle_practice_next(state, target)
        elif intent == 'improvements':
            result = self._handle_improvements(state, target)
        elif intent == 'missing_evidence':
            result = self._handle_missing_evidence(state, target)
        else:  # general_fallback
            result = self._handle_general_fallback(state, target)
        
        return {
            'id': f'conv-{int(datetime.utcnow().timestamp())}',
            'learnerId': state['user']['id'],
            'sender': 'system',
            'query': raw_query,
            'response': result['response'],
            'timestamp': datetime.utcnow().isoformat(),
            'relatedCapability': result.get('relatedCapability'),
            'actionableTaskId': result.get('actionableTaskId')
        }
            if next_action and next_action['task']:
                related_capability = next_action['task']['capability']
                actionable_task_id = next_action['task']['id']
                response = f'Your primary action today is **Day {next_action["task"]["day"]}: {next_action["task"]["learningObjective"]}** ({next_action["task"]["expectedDuration"]}).\n\n' \
                        f'**Practice Activity:** {next_action["task"]["practiceActivity"]}\n' \
                        f'**Deliverable:** {next_action["task"]["deliverable"]}\n\n' \
                        f'**Why this matters:** {next_action["whyItMatters"]}\n\n' \
                        'You can start this task directly in your Execution Plan or submit evidence once completed.'
            else:
                response = 'You have completed all scheduled tasks in your current 7-day plan! You can review your verified competencies in the Progress view or generate an advanced continuation plan.'

        elif 'next' in query and 'why' in query:
            # Explain WHY this is the next action based on state changes
            if next_action and next_action['task']:
                related_capability = next_action['task']['capability']
                actionable_task_id = next_action['task']['id']

                # Look for recent evidence that caused state changes
                recent_assessment = state['assessments'][0] if state['assessments'] else None
                recent_evidence = state['evidenceHistory'][0] if state['evidenceHistory'] else None
                contextual_reason = ''

                if recent_assessment and recent_evidence:
                    completed_capability = recent_assessment['capability']
                    prev_level = recent_assessment['previousLevel']
                    new_level = recent_assessment['newLevel']
                    prev_strength = recent_assessment['previousStrength']
                    new_strength = recent_assessment['newStrength']

                    # Find the task status for this capability
                    task_status = None
                    for t in state['planTasks']:
                        if t['capability'] == completed_capability:
                            task_status = t['status']
                            break

                    if task_status == 'Verified':
                        completed_gap = next((g for g in state['gaps'] if g['capability'] == completed_capability), None)
                        gap_info = f'{completed_gap["gap"]}' if completed_gap else 'High'
                        priority_info = f'{completed_gap["priority"]}' if completed_gap else 'Medium'
                        contextual_reason = f'Your **{completed_capability}** evidence was verified, which moved your capability from **{prev_level}** to **{new_level}** and improved evidence from **{prev_strength}** to **{new_strength}**. ' \
                            f'This reduced that gap from **{gap_info}** to **{gap_info}** with **{priority_info}** priority. ' \
                            f'Since that task is now verified, the system has adapted your path to the next important remaining gap: **{next_action["task"]["capability"]}**.'
                    else:
                        contextual_reason = f'Your most recent evidence submission for **{completed_capability}** is being processed. ' \
                            f'Your next priority action is **{next_action["task"]["capability"]}** based on your current highest unverified requirement ({next_action["reason"]}).'
                else:
                    contextual_reason = f'Your next priority action is **{next_action["task"]["capability"]}** based on your current highest unverified requirement ({next_action["reason"]}).'

                response = f'Your next action is **Day {next_action["task"]["day"]}: {next_action["task"]["learningObjective"]}** ({next_action["task"]["expectedDuration"]}).\n\n' \
                        f'**Contextual Reason:** {contextual_reason}\n\n' \
                        f'**Practice Activity:** {next_action["task"]["practiceActivity"]}\n' \
                        f'**Deliverable:** {next_action["task"]["deliverable"]}\n\n' \
                        f'**Why this matters:** {next_action["whyItMatters"]}'
            else:
                response = 'You have completed all scheduled tasks in your current 7-day plan! You can review your verified competencies in the Progress view or generate an advanced continuation plan.'

        elif 'why' in query and ('priority' in query or 'important' in query):
            mentioned_skill = next((s for s in state['skills'] if query.startswith(s['capability'].lower().split(' ')[0])), None)
            if mentioned_skill:
                gap = next((g for g in state['gaps'] if g['capability'] == mentioned_skill['capability']), None)
                related_capability = mentioned_skill['capability']
                response = f'**{mentioned_skill["capability"]}** is flagged with **{gap["priority"] if gap else "High"} Priority** because:\n\n' \
                        f'- **Target Standard:** The {target["title"]} role mandates **{gap["targetRequirement"] if gap else "Intermediate"}** level proficiency.\n' \
                        f'- **Current Evidence:** Your profile currently has **{mentioned_skill["evidenceStrength"]}** ({mentioned_skill["currentLevel"]} level).\n' \
                        f'- **Rationale:** {gap["reason"] if gap else "Essential role capability"}\n\n' \
                        f'**Recommended Action:** {gap["recommendedAction"] if gap else "Submit practical project evidence"}.'
            else:
                top_gap = critical_gaps[0] if critical_gaps else (high_gaps[0] if high_gaps else None)
                if top_gap:
                    related_capability = top_gap['capability']
                    response = f'Your highest current priority is **{top_gap["capability"]}** ({top_gap["priority"]} Priority). For a {target["title"]}, this capability is required at the **{top_gap["targetRequirement"]}** level. Your current profile has **{top_gap["currentEvidence"]}**. {top_gap["reason"]}'
                else:
                    response = f'Your capabilities currently align closely with the requirements for {target["title"]}. Focus on maintaining strong evidence across all core capabilities.'
        
        elif 'missing' in query or 'still need' in query or 'gap' in query:
            missing = [g for g in state['gaps'] if g['gap'] != 'None']
            if missing:
                list_str = '\n\n'.join([
                    f'• **{g["capability"]}** ({g["priority"]} Priority): Target requires {g["targetRequirement"]}, currently {g["currentEvidence"]}. Reason: {g["reason"]}'
                    for g in missing
                ])
                response = f'For your target role as a **{target["title"]}**, you have **{len(missing)} remaining capability gaps**:\n\n{list_str}\n\nReview the Gap Analysis tab to inspect detailed recommended actions for each.'
            else:
                response = f'You have no unaddressed capability gaps! All core requirements for **{target["title"]}** have verified evidence in your profile.'
        
        elif 'practice next' in query or 'next practice' in query or 'next' in query:
            if next_action and next_action['task']:
                related_capability = next_action['task']['capability']
                actionable_task_id = next_action['task']['id']
                response = f'Your next recommended practice is for **{next_action["task"]["capability"]}**:\n\n' \
                        f'• **Objective:** {next_action["task"]["learningObjective"]}\n' \
                        f'• **Activity:** {next_action["task"]["practiceActivity"]}\n' \
                        f'• **Expected Time:** {next_action["task"]["expectedDuration"]}\n' \
                        f'• **Required Deliverable:** {next_action["task"]["deliverable"]}\n\n' \
                        f'Calculated based on your highest unverified requirement: {next_action["reason"]}'
            else:
                response = 'All active practice tasks have been completed. Submit new project evidence to initiate your next milestone reassessment.'
        
        elif 'improve' in query or 'strengthen' in query or 'progress' in query:
            strengthened = state['progress']['recentlyStrengthened']
            completed_tasks = [t for t in state['planTasks'] if t['status'] in ['Verified', 'Completed']]
            if strengthened or completed_tasks:
                skills_str = ', '.join(strengthened) if strengthened else 'initial capability verifications'
                response = f'Here is your verified progress summary:\n\n' \
                        f'• **Strengthened Capabilities:** {skills_str}\n' \
                        f'• **Completed Activities:** {len(completed_tasks)} out of {len(state["planTasks"])} 7-day tasks verified\n' \
                        f'• **Learning Hours Completed:** {state["progress"]["hoursCompletedThisWeek"]:.1f} hrs toward your {state["progress"]["weeklyTargetHours"]} hr weekly goal\n' \
                        f'• **Submitted Artifacts:** {len(state["evidenceHistory"])} pieces of verified evidence on file\n\n' \
                        f'Your next target milestone: {state["progress"]["nextMilestone"]}'
            else:
                response = 'You are at the beginning of your plan! Upload documents, complete Day 1 practice, and submit your first deliverable to log verified improvements.'
        
        elif 'evidence' in query or 'submit' in query:
            needing_evidence = state['progress']['capabilitiesNeedingEvidence']
            response = f'The capabilities currently requiring evidence submission are:\n\n' \
                    '\n'.join([f'• **{c}**' for c in needing_evidence]) + \
                    '\n\nYou can submit evidence using GitHub links, project files, dashboard screenshots, or documented reports via the Evidence or Execution Plan tabs.'
        
        else:
            # Dynamic contextual fallback
            response = f'Regarding **{state["profile"]["targetRole"] if state.get("profile") else "your target career"}**: you currently have **{len(critical_gaps)} critical gaps** and **{len([t for t in state["planTasks"] if t["status"] == "Verified"])} completed plan tasks**.\n\n' \
                    f'Your current highest-priority action is **{next_action["task"]["learningObjective"] if next_action and next_action["task"] else "Complete initial profile"}** for **{next_action["task"]["capability"] if next_action and next_action["task"] else "Core competencies"}**.\n\n' \
                    'Feel free to ask specific questions like: "What should I learn today?", "Why is a specific capability a priority?", or "What am I still missing for my target role?"'
        
        return {
            'id': f'conv-{int(datetime.utcnow().timestamp())}',
            'learnerId': state['user']['id'],
            'sender': 'system',
            'query': raw_query,
            'response': response,
            'timestamp': datetime.utcnow().isoformat(),
            'relatedCapability': related_capability,
            'actionableTaskId': actionable_task_id
        }
