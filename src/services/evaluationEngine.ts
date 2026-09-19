import {
  LearnerProfile,
  DocumentUpload,
  SkillCapability,
  SkillGap,
  PlanTask,
  EvidenceRecord,
  AssessmentRecord,
  CapabilityLevel,
  EvidenceStrength,
  ValidationStatus,
  GapPriority,
  CareerRequirement,
  LearnerState,
  PathConversationMessage
} from '../types';
import { CAREER_REQUIREMENTS, STANDARD_CAREER_TARGETS } from '../data/rolesData';

// Helper to rank capability levels
export const LEVEL_SCORES: Record<CapabilityLevel, number> = {
  None: 0,
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

export const STRENGTH_SCORES: Record<EvidenceStrength, number> = {
  'No evidence': 0,
  'Needs validation': 1,
  'Limited evidence': 2,
  'Moderate evidence': 3,
  'Strong evidence': 4,
};

/**
 * Parses profile and documents to build the capability profile
 */
export function buildSkillProfileFromInput(
  profile: LearnerProfile,
  documents: DocumentUpload[],
  targetRoleId: string
): SkillCapability[] {
  const requirements = CAREER_REQUIREMENTS[targetRoleId] || CAREER_REQUIREMENTS['data-analyst'];
  const userSkillStrings = profile.initialSkillsText
    .split(/[,;\n]/)
    .map(s => s.trim())
    .filter(Boolean);

  const documentSkillSet = new Set<string>();
  documents.forEach(doc => {
    doc.extractedSkills.forEach(s => documentSkillSet.add(s.toLowerCase()));
  });

  return requirements.map((req, idx) => {
    const reqCapLower = req.capability.toLowerCase();
    
    // Check if matched in verified documents
    let isFoundInDocs = false;
    documents.forEach(doc => {
      doc.extractedSkills.forEach(skill => {
        if (reqCapLower.includes(skill.toLowerCase()) || skill.toLowerCase().includes(reqCapLower.split(' ')[0])) {
          isFoundInDocs = true;
        }
      });
    });

    // Check if user manually listed it
    const isListedBySelf = userSkillStrings.some(s => 
      reqCapLower.includes(s.toLowerCase()) || s.toLowerCase().includes(reqCapLower.split(' ')[0])
    );

    let currentLevel: CapabilityLevel = 'None';
    let evidenceStrength: EvidenceStrength = 'No evidence';
    let validationStatus: ValidationStatus = 'Needs validation';
    let source = 'Initial Assessment';
    let evidenceFound = 'No documented evidence found in uploaded files or profile.';

    if (isFoundInDocs && isListedBySelf) {
      currentLevel = req.expectedLevel === 'Advanced' ? 'Intermediate' : 'Beginner';
      evidenceStrength = 'Strong evidence';
      validationStatus = 'Verified';
      source = `Verified in document records and profile statement`;
      evidenceFound = `Practical competence verified through ${documents.length} uploaded portfolio/resume files.`;
    } else if (isFoundInDocs) {
      currentLevel = 'Beginner';
      evidenceStrength = 'Moderate evidence';
      validationStatus = 'Verified';
      source = `Document extraction`;
      evidenceFound = `Referenced across verified files. Practical depth pending verification.`;
    } else if (isListedBySelf) {
      currentLevel = 'Beginner';
      evidenceStrength = 'Limited evidence';
      validationStatus = 'Self-Reported';
      source = `Learner self-reported entry`;
      evidenceFound = `Self-reported by learner. Requires project or credential artifact.`;
    }

    // Categorize skill into predefined categories and generate tags
    let category = 'Technical';
    const capLower = req.capability.toLowerCase();
    if (capLower.includes('communication') || capLower.includes('storytelling') || capLower.includes('presentation') || capLower.includes('interpersonal')) {
      category = 'Soft Skills';
    } else if (capLower.includes('management') || capLower.includes('agile') || capLower.includes('scrum') || capLower.includes('project') || capLower.includes('leadership')) {
      category = 'Management';
    } else if (capLower.includes('statistics') || capLower.includes('hypothesis') || capLower.includes('bi') || capLower.includes('analytics') || capLower.includes('reporting')) {
      category = 'Analytics & BI';
    }

    const words = req.capability.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const tags = Array.from(new Set(words.slice(0, 4)));

    return {
      id: `skill-${profile.learnerId}-${idx + 1}`,
      learnerId: profile.learnerId,
      capability: req.capability,
      category,
      tags,
      currentLevel,
      evidenceFound,
      evidenceStrength,
      source,
      validationStatus,
      targetLevel: req.expectedLevel,
      lastUpdated: new Date().toISOString(),
    };
  });
}

/**
 * Computes prioritized capability gaps comparing current evidence to requirements
 */
export function computeGapAnalysis(
  skills: SkillCapability[],
  targetRoleId: string
): SkillGap[] {
  const requirements = CAREER_REQUIREMENTS[targetRoleId] || CAREER_REQUIREMENTS['data-analyst'];

  return requirements.map((req, idx) => {
    const matchedSkill = skills.find(s => s.capability === req.capability);
    const currentLevel: CapabilityLevel = matchedSkill ? matchedSkill.currentLevel : 'None';
    const currentEvidence: EvidenceStrength = matchedSkill ? matchedSkill.evidenceStrength : 'No evidence';

    const levelDiff = LEVEL_SCORES[req.expectedLevel] - LEVEL_SCORES[currentLevel];
    const strengthScore = STRENGTH_SCORES[currentEvidence];

    let gap: 'Critical' | 'High' | 'Medium' | 'Low' | 'None' = 'None';
    let priority: GapPriority = 'Low';
    let reason = '';
    let recommendedAction = '';
    let hours = 8;

    if (levelDiff >= 2 || (req.importance === 'Essential' && strengthScore <= 1)) {
      gap = 'Critical';
      priority = 'Critical';
      reason = `Target requires ${req.expectedLevel} level for ${req.importance.toLowerCase()} role function, but current profile shows ${currentEvidence.toLowerCase()}. ${req.reason}`;
      recommendedAction = `Prioritize immediate structured practice deliverable to establish verified baseline evidence.`;
      hours = 16;
    } else if (levelDiff === 1 || (req.importance === 'Essential' && strengthScore === 2)) {
      gap = 'High';
      priority = req.importance === 'Essential' ? 'Critical' : 'High';
      reason = matchedSkill?.evidenceFound && matchedSkill.evidenceFound.length > 10
        ? `Evidence is currently ${currentEvidence.toLowerCase()}. ${req.reason}`
        : `No strong project or practical evidence was found in the submitted profile. ${req.reason}`;
      recommendedAction = `Build and submit a focused project deliverable demonstrating end-to-end execution.`;
      hours = 12;
    } else if (strengthScore === 2 || strengthScore === 3) {
      gap = 'Medium';
      priority = 'Medium';
      reason = `Developing baseline demonstrated, but additional verification required to reach target ${req.expectedLevel} standard.`;
      recommendedAction = `Complete an applied case exercise with measurable business outcomes.`;
      hours = 8;
    } else if (levelDiff <= 0 && strengthScore >= 4) {
      gap = 'None';
      priority = 'Low';
      reason = `Current verified capability satisfies standard target requirement (${req.expectedLevel}).`;
      recommendedAction = `Maintain competency through routine execution and advanced stretch practices.`;
      hours = 4;
    } else {
      gap = 'Low';
      priority = 'Low';
      reason = `Capability has supporting priority for this career path.`;
      recommendedAction = `Review supplementary materials as secondary practice.`;
      hours = 6;
    }

    return {
      id: `gap-${idx + 1}`,
      learnerId: matchedSkill ? matchedSkill.learnerId : 'current',
      capability: req.capability,
      category: targetRoleId,
      currentEvidence,
      currentLevel,
      targetRequirement: req.expectedLevel,
      importance: req.importance,
      gap,
      priority,
      reason,
      recommendedAction,
      estimatedHoursToClose: hours,
    };
  });
}

/**
 * Generates a focused 7-day execution plan from prioritized gaps
 */
export function generateExecutionPlan(
  gaps: SkillGap[],
  learnerId: string,
  targetRoleId: string
): PlanTask[] {
  // Sort gaps by priority: Critical -> High -> Medium -> Low
  const priorityWeight: Record<GapPriority, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const sortedGaps = [...gaps].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  const tasks: PlanTask[] = [];

  const taskTemplates: Record<string, { objective: string; practice: string; duration: string; durationMinutes: number; deliverable: string; evidence: string; why: string }> = {
    'SQL & Relational Querying': {
      objective: 'Write multi-table relational queries with window partitions and cohort analysis.',
      practice: 'Execute SQL queries using SUM() OVER (PARTITION BY customer_id ORDER BY order_date) and DENSE_RANK() on transaction data.',
      duration: '60 minutes',
      durationMinutes: 60,
      deliverable: 'Tested SQL script with 4 analytical queries and output table snapshot.',
      evidence: 'Query file + execution output showing correct running totals and monthly retention cohorts.',
      why: 'Validates your ability to answer analytical questions directly from relational databases without manual spreadsheets.',
    },
    'Power BI / Tableau Dashboarding': {
      objective: 'Build an interactive business dashboard with dynamic calculated measures.',
      practice: 'Create a sales performance dashboard using the provided dataset. Implement Year-over-Year revenue variance and regional drill-down.',
      duration: '90 minutes',
      durationMinutes: 90,
      deliverable: 'Dashboard screenshot or project file with calculated measures.',
      evidence: 'Dashboard + three business insights.',
      why: 'Directly addresses your highest-priority capability gap by demonstrating interactive executive dashboarding proficiency.',
    },
    'Python Data Analysis (pandas/numpy)': {
      objective: 'Clean an anomalous tabular dataset and extract statistical distribution summaries.',
      practice: 'Load messy e-commerce logs in pandas, handle missing categorical values, and normalize skewed distributions.',
      duration: '90 minutes',
      durationMinutes: 90,
      deliverable: 'Documented Jupyter notebook (.ipynb or PDF export) showing clean data pipeline.',
      evidence: 'Notebook showing data before/after cleaning and summary statistics.',
      why: 'Proves you can handle real-world dirty data without failure or manual intervention.',
    },
    'Business Statistics & Hypothesis Testing': {
      objective: 'Evaluate conversion rate variance using two-tailed hypothesis testing.',
      practice: 'Calculate p-values and 95% confidence intervals for a product feature test vs baseline control.',
      duration: '60 minutes',
      durationMinutes: 60,
      deliverable: 'Statistical evaluation memo (PDF or Markdown) with clear decision boundary.',
      evidence: 'Hypothesis statement, sample sizes, test statistic calculation, and business recommendation.',
      why: 'Guarantees that your recommendations are backed by statistical significance rather than random noise.',
    },
    'Executive Communication & Storytelling': {
      objective: 'Synthesize data analysis findings into an actionable executive briefing document.',
      practice: 'Draft a 1-page stakeholder memorandum summarizing quarterly risks and proposing three corrective operational actions.',
      duration: '60 minutes',
      durationMinutes: 60,
      deliverable: '1-page Executive Briefing Memo (PDF).',
      evidence: 'One-page document including executive summary, primary chart visual, and 3 strategic recommendations.',
      why: 'Technical work is only effective when organizational leadership can immediately understand and approve action.',
    },
    'Data Modeling & ETL Pipelines': {
      objective: 'Construct a star-schema dimensional model for an operational business process.',
      practice: 'Map source transaction entities into 1 centralized fact table and 4 dimension tables with clear granularity.',
      duration: '75 minutes',
      durationMinutes: 75,
      deliverable: 'Entity-Relationship Diagram (ERD) with primary and foreign key definitions.',
      evidence: 'Schema diagram + table definitions explaining surrogate keys and SCD strategy.',
      why: 'Establishes the scalable schema foundation needed for robust data warehousing and BI performance.',
    },
    'TypeScript & Modern JavaScript': {
      objective: 'Implement robust type-safe domain models and async error handling.',
      practice: 'Refactor loosely typed interfaces into strict discriminated unions with runtime validation.',
      duration: '75 minutes',
      durationMinutes: 75,
      deliverable: 'Clean TypeScript codebase compiling with zero errors under strict mode.',
      evidence: 'Repository link showing typed interfaces and test assertions.',
      why: 'Ensures application stability and self-documenting code in enterprise development teams.',
    },
    'Frontend Architecture (React)': {
      objective: 'Build modular, decoupled UI components with custom hook state encapsulation.',
      practice: 'Construct a data grid with sorting, pagination, and optimistic state updates without unnecessary re-renders.',
      duration: '90 minutes',
      durationMinutes: 90,
      deliverable: 'Working component with tests and clean separation of concerns.',
      evidence: 'Component source code + video or interactive deployment link.',
      why: 'Demonstrates modern frontend craftsmanship expected of production developers.',
    },
    'RESTful API & Server Design': {
      objective: 'Design and test secure CRUD API endpoints with request schema validation.',
      practice: 'Implement endpoints with input validation middleware, structured error responses, and HTTP headers.',
      duration: '80 minutes',
      durationMinutes: 80,
      deliverable: 'Server route handlers with passing automated integration tests.',
      evidence: 'API repository + OpenAPI/Swagger documentation or curl tests.',
      why: 'Validates that backend interfaces conform to production reliability and security contracts.',
    },
    'Infrastructure as Code (Terraform)': {
      objective: 'Author modular infrastructure configurations with parameterized variables.',
      practice: 'Write a Terraform module declaring a virtual network, public/private subnets, and security boundaries.',
      duration: '90 minutes',
      durationMinutes: 90,
      deliverable: 'Modular Terraform directory with execution plan output.',
      evidence: 'Terraform plan log showing clean resource creation without drift.',
      why: 'Enables deterministic, automated cloud provisioning without manual configuration error.',
    },
    'Figma & Design Systems': {
      objective: 'Create responsive auto-layout components with tokenized color and spacing variables.',
      practice: 'Build a reusable modal and data card system in Figma supporting multiple viewport widths and theme tokens.',
      duration: '75 minutes',
      durationMinutes: 75,
      deliverable: 'Figma component library link with responsive constraints configured.',
      evidence: 'Shared Figma file showing variants, component properties, and layout test cases.',
      why: 'Accelerates design-to-development handoffs and maintains visual consistency across team products.',
    },
  };

  // Generate 7 days
  for (let day = 1; day <= 7; day++) {
    const gapIndex = (day - 1) % sortedGaps.length;
    const gap = sortedGaps[gapIndex] || sortedGaps[0];
    const template = taskTemplates[gap.capability] || {
      objective: `Demonstrate practical competence in ${gap.capability}.`,
      practice: `Execute an applied exercise closing the ${gap.gap.toLowerCase()} gap in ${gap.capability}.`,
      duration: '75 minutes',
      durationMinutes: 75,
      deliverable: `Project deliverable demonstrating verified ${gap.capability} standard.`,
      evidence: `Code or document deliverable fulfilling target ${gap.targetRequirement} standard.`,
      why: gap.reason,
    };

    const priorityScore = Math.max(70, 100 - day * 3 - (gap.priority === 'Critical' ? 0 : 6));

    tasks.push({
      id: `task-${learnerId}-d${day}`,
      learnerId,
      day,
      capability: gap.capability,
      learningObjective: template.objective,
      practiceActivity: template.practice,
      expectedDuration: template.duration,
      durationMinutes: template.durationMinutes,
      deliverable: template.deliverable,
      evidenceRequirement: template.evidence,
      status: day === 1 ? 'In progress' : 'Not started',
      whyItMatters: template.why,
      priorityScore,
    });
  }

  return tasks;
}

/**
 * Calculates the exact NEXT ACTION based on highest priority gap, task state, and progress
 */
export function calculateNextAction(state: LearnerState) {
  // If there's a task currently "In progress", that is first priority
  const inProgressTask = state.planTasks.find(t => t.status === 'In progress');
  if (inProgressTask) {
    return {
      task: inProgressTask,
      whyItMatters: inProgressTask.whyItMatters,
      expectedTime: inProgressTask.expectedDuration,
      deliverable: inProgressTask.deliverable,
      reason: 'This activity is currently underway and is aligned with your active learning focus.',
    };
  }

  // Next, look for the first task that addresses the highest-priority gap
  const criticalGaps = state.gaps.filter(g => g.priority === 'Critical' || g.priority === 'High');
  for (const gap of criticalGaps) {
    const matchingUnfinishedTask = state.planTasks.find(
      t => t.capability === gap.capability && (t.status === 'Not started' || t.status === 'Needs improvement')
    );
    if (matchingUnfinishedTask) {
      return {
        task: matchingUnfinishedTask,
        whyItMatters: matchingUnfinishedTask.whyItMatters,
        expectedTime: matchingUnfinishedTask.expectedDuration,
        deliverable: matchingUnfinishedTask.deliverable,
        reason: `Directly closes your highest priority gap (${gap.capability}: ${gap.priority} priority).`,
      };
    }
  }

  // Fallback to first unfinished task
  const nextUnfinished = state.planTasks.find(t => t.status === 'Not started' || t.status === 'Needs improvement');
  if (nextUnfinished) {
    return {
      task: nextUnfinished,
      whyItMatters: nextUnfinished.whyItMatters,
      expectedTime: nextUnfinished.expectedDuration,
      deliverable: nextUnfinished.deliverable,
      reason: 'Next scheduled sequential activity in your 7-day personalized execution plan.',
    };
  }

  return null;
}

/**
 * Evaluates evidence submission, reassesses capability, and updates the execution plan
 */
export function submitAndReassessEvidence(
  state: LearnerState,
  taskId: string,
  evidenceType: string,
  submittedEvidence: string,
  notes: string,
  attachmentName?: string
): {
  updatedState: LearnerState;
  assessment: AssessmentRecord;
  feedback: string;
} {
  const task = state.planTasks.find(t => t.id === taskId);
  const capabilityName = task ? task.capability : (state.skills[0]?.capability || 'Power BI / Tableau Dashboarding');
  const skill = state.skills.find(s => s.capability === capabilityName);

  const prevLevel = skill ? skill.currentLevel : 'Beginner';
  const prevStrength = skill ? skill.evidenceStrength : 'Limited evidence';

  // Determine realistic advancement based on evidence content quality
  const isSubstantial = submittedEvidence.trim().length > 20 || !!attachmentName;
  let newLevel: CapabilityLevel = prevLevel;
  let newStrength: EvidenceStrength = prevStrength;
  let status: 'Verified' | 'Needs improvement' = 'Verified';
  let feedback = '';
  let nextStep = '';

  if (isSubstantial) {
    if (prevStrength === 'No evidence') {
      newStrength = 'Limited evidence';
      newLevel = 'Beginner';
    } else if (prevStrength === 'Limited evidence' || prevStrength === 'Needs validation') {
      newStrength = 'Moderate evidence';
      newLevel = prevLevel === 'None' ? 'Beginner' : (prevLevel === 'Beginner' ? 'Intermediate' : prevLevel);
    } else if (prevStrength === 'Moderate evidence') {
      newStrength = 'Strong evidence';
      newLevel = prevLevel === 'Beginner' ? 'Intermediate' : 'Advanced';
    } else {
      newStrength = 'Strong evidence';
      newLevel = 'Advanced';
    }

    status = 'Verified';
    feedback = `Evidence verified against deliverable criteria: "${task ? task.deliverable : 'Standard criteria'}". Practical competence demonstrated with clear supporting artifact.`;
    nextStep = `Capability reassessed from ${prevStrength} (${prevLevel}) to ${newStrength} (${newLevel}). Execution plan updated.`;
  } else {
    status = 'Needs improvement';
    feedback = `The submitted response is brief. To verify ${capabilityName}, please attach a screenshot, project repository, or documented work file satisfying: "${task ? task.evidenceRequirement : 'Criteria'}".`;
    nextStep = `Resubmit artifact with complete deliverable details.`;
  }

  const evidenceId = 'ev-' + Date.now();
  const evidenceRecord: EvidenceRecord = {
    id: evidenceId,
    learnerId: state.user.id,
    taskId: task ? task.id : taskId,
    taskTitle: task ? task.learningObjective : capabilityName,
    capability: capabilityName,
    evidenceType: evidenceType as any,
    submittedEvidence,
    summaryNotes: notes || 'Submitted deliverable evidence.',
    date: new Date().toISOString(),
    status,
    feedback,
    nextStep,
    attachmentName,
  };

  // Create assessment audit record
  const assessmentId = 'assess-' + Date.now();
  const assessment: AssessmentRecord = {
    id: assessmentId,
    learnerId: state.user.id,
    capability: capabilityName,
    previousLevel: prevLevel,
    newLevel,
    previousStrength: prevStrength,
    newStrength,
    triggeredByEvidenceId: evidenceId,
    date: new Date().toISOString(),
    demonstratedCapabilities: [
      `Fulfillment of deliverable for ${capabilityName}`,
      `Practical execution: ${task?.practiceActivity || 'Applied practice'}`,
    ],
    capabilitiesStillMissing: newLevel === 'Advanced' ? [] : [
      `Complex edge-case handling under production scale`,
      `Advanced optimization for ${capabilityName}`,
    ],
    recommendedNextPractice: status === 'Verified'
      ? `Proceed to subsequent prioritized gap activities in the execution plan.`
      : `Provide supplementary execution artifacts for ${capabilityName}.`,
    actionSummary: status === 'Verified'
      ? `Capability strengthened from ${prevStrength} to ${newStrength}. Level: ${newLevel}.`
      : `Evidence recorded; additional documentation recommended.`,
  };

  // Update skills in state
  const updatedSkills = state.skills.map(s => {
    if (s.capability === capabilityName && status === 'Verified') {
      return {
        ...s,
        currentLevel: newLevel,
        evidenceStrength: newStrength,
        validationStatus: 'Verified' as ValidationStatus,
        evidenceFound: `Submitted artifact (${evidenceType}): ${submittedEvidence.slice(0, 80)}... Verified on ${new Date().toLocaleDateString()}`,
        lastUpdated: new Date().toISOString(),
      };
    }
    return s;
  });

  // Recompute gaps
  const updatedGaps = computeGapAnalysis(updatedSkills, state.selectedTargetId);

  // Update tasks in plan: mark current task completed/verified, activate next task
  let nextActivated = false;
  const updatedPlanTasks = state.planTasks.map(t => {
    if (t.id === taskId) {
      return {
        ...t,
        status: status === 'Verified' ? ('Verified' as const) : ('Needs improvement' as const),
        completedAt: status === 'Verified' ? new Date().toISOString() : undefined,
        evidenceId,
      };
    }
    if (status === 'Verified' && !nextActivated && t.status === 'Not started') {
      nextActivated = true;
      return {
        ...t,
        status: 'In progress' as const,
      };
    }
    return t;
  });

  // Calculate updated progress
  const completedCount = updatedPlanTasks.filter(t => t.status === 'Verified' || t.status === 'Completed').length;
  const currentCount = updatedPlanTasks.filter(t => t.status === 'In progress').length;
  const remainingGapCount = updatedGaps.filter(g => g.gap !== 'None').length;
  const strengthenedList = Array.from(new Set([...state.progress.recentlyStrengthened, capabilityName]));

  const updatedProgress = {
    ...state.progress,
    completedActivities: completedCount,
    currentActivities: currentCount,
    remainingGaps: remainingGapCount,
    recentlyStrengthened: strengthenedList,
    capabilitiesNeedingEvidence: updatedGaps.filter(g => g.priority === 'Critical' || g.priority === 'High').map(g => g.capability),
    nextMilestone: remainingGapCount === 0
      ? 'All prioritized target capabilities verified!'
      : `Advance next high-priority gap: ${updatedGaps.find(g => g.priority === 'Critical')?.capability || 'Next module'}`,
    hoursCompletedThisWeek: state.progress.hoursCompletedThisWeek + (task ? task.durationMinutes / 60 : 1),
  };

  const updatedState: LearnerState = {
    ...state,
    skills: updatedSkills,
    gaps: updatedGaps,
    planTasks: updatedPlanTasks,
    evidenceHistory: [evidenceRecord, ...state.evidenceHistory],
    assessments: [assessment, ...state.assessments],
    progress: updatedProgress,
  };

  return {
    updatedState,
    assessment,
    feedback,
  };
}

/**
 * Natural language query processing engine grounded in the learner's actual state
 */
export function answerPathQuery(state: LearnerState, rawQuery: string): PathConversationMessage {
  const query = rawQuery.toLowerCase().trim();
  let response = '';
  let relatedCapability: string | undefined;
  let actionableTaskId: string | undefined;

  const nextAction = calculateNextAction(state);
  const criticalGaps = state.gaps.filter(g => g.priority === 'Critical');
  const highGaps = state.gaps.filter(g => g.priority === 'High');
  const target = STANDARD_CAREER_TARGETS.find(t => t.id === state.selectedTargetId) || {
    title: state.profile.targetRole || 'Target Career',
  };

  if (query.includes('learn today') || query.includes('today') || query.includes('what should i do')) {
    if (nextAction && nextAction.task) {
      relatedCapability = nextAction.task.capability;
      actionableTaskId = nextAction.task.id;
      response = `Your primary action today is **Day ${nextAction.task.day}: ${nextAction.task.learningObjective}** (${nextAction.task.expectedDuration}).\n\n` +
        `**Practice Activity:** ${nextAction.task.practiceActivity}\n` +
        `**Deliverable:** ${nextAction.task.deliverable}\n\n` +
        `**Why this matters:** ${nextAction.whyItMatters}\n\n` +
        `You can start this task directly in your Execution Plan or submit evidence once completed.`;
    } else {
      response = `You have completed all scheduled tasks in your current 7-day plan! You can review your verified competencies in the Progress view or generate an advanced continuation plan.`;
    }
  } else if (query.includes('next') && query.includes('why')) {
    // Explain WHY this is the next action based on state changes
    if (nextAction && nextAction.task) {
      relatedCapability = nextAction.task.capability;
      actionableTaskId = nextAction.task.id;

      // Look for recent evidence that caused state changes
      const recentAssessment = state.assessments[0];
      const recentEvidence = state.evidenceHistory[0];
      let contextualReason = '';

      if (recentAssessment && recentEvidence) {
        const completedCapability = recentAssessment.capability;
        const prevLevel = recentAssessment.previousLevel;
        const newLevel = recentAssessment.newLevel;
        const prevStrength = recentAssessment.previousStrength;
        const newStrength = recentAssessment.newStrength;
        const taskStatus = state.planTasks.find(t => t.capability === completedCapability)?.status;

        if (taskStatus === 'Verified') {
          const completedGap = state.gaps.find(g => g.capability === completedCapability);
          contextualReason = `Your **${completedCapability}** evidence was verified, which moved your capability from **${prevLevel}** to **${newLevel}** and improved evidence from **${prevStrength}** to **${newStrength}**. ` +
            `This reduced that gap from **${completedGap?.gap || 'High'}** to **${completedGap?.gap || 'Medium'}** with **${completedGap?.priority || 'Medium'}** priority. ` +
            `Since that task is now verified, the system has adapted your path to the next important remaining gap: **${nextAction.task.capability}**.`;
        } else {
          contextualReason = `Your most recent evidence submission for **${completedCapability}** is being processed. ` +
            `Your next priority action is **${nextAction.task.capability}** based on your current highest unverified requirement (${nextAction.reason}).`;
        }
      } else {
        contextualReason = `Your next priority action is **${nextAction.task.capability}** based on your current highest unverified requirement (${nextAction.reason}).`;
      }

      response = `Your next action is **Day ${nextAction.task.day}: ${nextAction.task.learningObjective}** (${nextAction.task.expectedDuration}).\n\n` +
        `**Contextual Reason:** ${contextualReason}\n\n` +
        `**Practice Activity:** ${nextAction.task.practiceActivity}\n` +
        `**Deliverable:** ${nextAction.task.deliverable}\n\n` +
        `**Why this matters:** ${nextAction.whyItMatters}`;
    } else {
      response = `You have completed all scheduled tasks in your current 7-day plan! You can review your verified competencies in the Progress view or generate an advanced continuation plan.`;
    }
  } else if (query.includes('why') && (query.includes('priority') || query.includes('important'))) {
    // Check if a specific capability was asked
    const mentionedSkill = state.skills.find(s => query.includes(s.capability.toLowerCase().split(' ')[0].toLowerCase()));
    if (mentionedSkill) {
      const gap = state.gaps.find(g => g.capability === mentionedSkill.capability);
      relatedCapability = mentionedSkill.capability;
      response = `**${mentionedSkill.capability}** is flagged with **${gap?.priority || 'High'} Priority** because:\n\n` +
        `- **Target Standard:** The ${target.title} role mandates **${gap?.targetRequirement || 'Intermediate'}** level proficiency.\n` +
        `- **Current Evidence:** Your profile currently has **${mentionedSkill.evidenceStrength}** (${mentionedSkill.currentLevel} level).\n` +
        `- **Rationale:** ${gap?.reason || 'Essential role capability'}\n\n` +
        `**Recommended Action:** ${gap?.recommendedAction || 'Submit practical project evidence'}.`;
    } else {
      const topGap = criticalGaps[0] || highGaps[0];
      if (topGap) {
        relatedCapability = topGap.capability;
        response = `Your highest current priority is **${topGap.capability}** (${topGap.priority} Priority). For a ${target.title}, this capability is required at the **${topGap.targetRequirement}** level. Your current profile has **${topGap.currentEvidence}**. ${topGap.reason}`;
      } else {
        response = `Your capabilities currently align closely with the requirements for ${target.title}. Focus on maintaining strong evidence across all core capabilities.`;
      }
    }
  } else if (query.includes('missing') || query.includes('still need') || query.includes('gap')) {
    const missing = state.gaps.filter(g => g.gap !== 'None');
    if (missing.length > 0) {
      const listStr = missing.map(g => `• **${g.capability}** (${g.priority} Priority): Target requires ${g.targetRequirement}, currently ${g.currentEvidence}. Reason: ${g.reason}`).join('\n\n');
      response = `For your target role as a **${target.title}**, you have **${missing.length} remaining capability gaps**:\n\n${listStr}\n\nReview the Gap Analysis tab to inspect detailed recommended actions for each.`;
    } else {
      response = `You have no unaddressed capability gaps! All core requirements for **${target.title}** have verified evidence in your profile.`;
    }
  } else if (query.includes('practice next') || query.includes('next practice') || query.includes('next')) {
    if (nextAction && nextAction.task) {
      relatedCapability = nextAction.task.capability;
      actionableTaskId = nextAction.task.id;
      response = `Your next recommended practice is for **${nextAction.task.capability}**:\n\n` +
        `• **Objective:** ${nextAction.task.learningObjective}\n` +
        `• **Activity:** ${nextAction.task.practiceActivity}\n` +
        `• **Expected Time:** ${nextAction.task.expectedDuration}\n` +
        `• **Required Deliverable:** ${nextAction.task.deliverable}\n\n` +
        `Calculated based on your highest unverified requirement: ${nextAction.reason}`;
    } else {
      response = `All active practice tasks have been completed. Submit new project evidence to initiate your next milestone reassessment.`;
    }
  } else if (query.includes('improve') || query.includes('strengthen') || query.includes('progress')) {
    const strengthened = state.progress.recentlyStrengthened;
    const completedTasks = state.planTasks.filter(t => t.status === 'Verified' || t.status === 'Completed');
    if (strengthened.length > 0 || completedTasks.length > 0) {
      const skillsStr = strengthened.length > 0 ? strengthened.join(', ') : 'initial capability verifications';
      response = `Here is your verified progress summary:\n\n` +
        `• **Strengthened Capabilities:** ${skillsStr}\n` +
        `• **Completed Activities:** ${completedTasks.length} out of ${state.planTasks.length} 7-day tasks verified\n` +
        `• **Learning Hours Completed:** ${state.progress.hoursCompletedThisWeek.toFixed(1)} hrs toward your ${state.progress.weeklyTargetHours} hr weekly goal\n` +
        `• **Submitted Artifacts:** ${state.evidenceHistory.length} pieces of verified evidence on file\n\n` +
        `Your next target milestone: ${state.progress.nextMilestone}`;
    } else {
      response = `You are at the beginning of your plan! Upload documents, complete Day 1 practice, and submit your first deliverable to log verified improvements.`;
    }
  } else if (query.includes('evidence') || query.includes('submit')) {
    const needingEvidence = state.progress.capabilitiesNeedingEvidence;
    response = `The capabilities currently requiring evidence submission are:\n\n` +
      needingEvidence.map(c => `• **${c}**`).join('\n') +
      `\n\nYou can submit evidence using GitHub links, project files, dashboard screenshots, or documented reports via the Evidence or Execution Plan tabs.`;
  } else {
    // Dynamic contextual fallback
    response = `Regarding **${state.profile.targetRole || 'your target career'}**: you currently have **${state.gaps.filter(g => g.priority === 'Critical').length} critical gaps** and **${state.planTasks.filter(t => t.status === 'Verified').length} completed plan tasks**.\n\n` +
      `Your current highest-priority action is **${nextAction?.task.learningObjective || 'Complete initial profile'}** for **${nextAction?.task.capability || 'Core competencies'}**.\n\n` +
      `Feel free to ask specific questions like: "What should I learn today?", "Why is a specific capability a priority?", or "What am I still missing for my target role?"`;
  }

  return {
    id: 'conv-' + Date.now(),
    learnerId: state.user.id,
    sender: 'system',
    query: rawQuery,
    response,
    timestamp: new Date().toISOString(),
    relatedCapability,
    actionableTaskId,
  };
}
