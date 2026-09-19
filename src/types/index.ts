export type ExperienceLevel = 'Entry' | 'Mid-Level' | 'Senior' | 'Career Switcher';

export type EvidenceStrength = 
  | 'Strong evidence' 
  | 'Moderate evidence' 
  | 'Limited evidence' 
  | 'No evidence' 
  | 'Needs validation';

export type CapabilityLevel = 'None' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type ValidationStatus = 'Verified' | 'Self-Reported' | 'Needs validation' | 'In Review';

export type RequirementImportance = 'Essential' | 'High' | 'Medium' | 'Supporting';

export type GapPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TaskStatus = 
  | 'Not started' 
  | 'In progress' 
  | 'Submitted' 
  | 'Verified' 
  | 'Needs improvement' 
  | 'Completed';

export type EvidenceType = 
  | 'File upload' 
  | 'Project link' 
  | 'GitHub link' 
  | 'Text response' 
  | 'Screenshot';

export type EvidenceStatus = 'Submitted' | 'Verified' | 'Needs improvement';

export type CapabilityProgressStatus = 
  | 'Strong evidence' 
  | 'Developing' 
  | 'Needs evidence' 
  | 'Needs improvement';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isDemo: boolean;
  createdAt: string;
}

export interface DocumentUpload {
  id: string;
  learnerId: string;
  filename: string;
  fileType: string;
  sizeBytes: number;
  uploadDate: string;
  status: 'Processed' | 'Under Review' | 'Verified';
  extractedSkills: string[];
  notes?: string;
  mockDownloadUrl?: string;
}

export const PREDEFINED_SKILL_CATEGORIES = [
  'Technical',
  'Soft Skills',
  'Management',
  'Analytics & BI',
  'Domain Knowledge',
  'Leadership',
] as const;

export type PredefinedSkillCategory = typeof PREDEFINED_SKILL_CATEGORIES[number];

export interface SkillCapability {
  id: string;
  learnerId: string;
  capability: string;
  category: string;
  tags?: string[];
  currentLevel: CapabilityLevel;
  evidenceFound: string;
  evidenceStrength: EvidenceStrength;
  source: string;
  validationStatus: ValidationStatus;
  targetLevel: CapabilityLevel;
  lastUpdated: string;
}

export interface AuthAccount {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  salt: string;
  targetRole: string;
  createdAt: string;
  lastLoginAt: string;
  passwordUpdatedAt: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  targetRole: string;
  loginTimestamp: number;
}

export interface CareerTarget {
  id: string;
  title: string;
  category: string;
  description: string;
  isCustom?: boolean;
  typicalHoursNeeded: number;
}

export interface CareerRequirement {
  id: string;
  roleId: string;
  capability: string;
  importance: RequirementImportance;
  expectedLevel: CapabilityLevel;
  reason: string;
  standardVerificationCriteria: string;
}

export interface SkillGap {
  id: string;
  learnerId: string;
  capability: string;
  category: string;
  currentEvidence: EvidenceStrength;
  currentLevel: CapabilityLevel;
  targetRequirement: CapabilityLevel;
  importance: RequirementImportance;
  gap: 'Critical' | 'High' | 'Medium' | 'Low' | 'None';
  priority: GapPriority;
  reason: string;
  recommendedAction: string;
  estimatedHoursToClose: number;
}

export interface LearningObjective {
  id: string;
  capability: string;
  objective: string;
  deliverableCriteria: string;
}

export interface PlanTask {
  id: string;
  learnerId: string;
  day: number; // 1 to 7
  capability: string;
  learningObjective: string;
  practiceActivity: string;
  expectedDuration: string; // e.g. "90 minutes"
  durationMinutes: number;
  deliverable: string;
  evidenceRequirement: string;
  status: TaskStatus;
  whyItMatters: string;
  priorityScore: number;
  evidenceId?: string;
  completedAt?: string;
}

export interface EvidenceRecord {
  id: string;
  learnerId: string;
  taskId: string;
  taskTitle: string;
  capability: string;
  evidenceType: EvidenceType;
  submittedEvidence: string;
  summaryNotes: string;
  date: string;
  status: EvidenceStatus;
  feedback: string;
  nextStep: string;
  attachmentName?: string;
}

export interface AssessmentRecord {
  id: string;
  learnerId: string;
  capability: string;
  previousLevel: CapabilityLevel;
  newLevel: CapabilityLevel;
  previousStrength: EvidenceStrength;
  newStrength: EvidenceStrength;
  triggeredByEvidenceId: string;
  date: string;
  demonstratedCapabilities: string[];
  capabilitiesStillMissing: string[];
  recommendedNextPractice: string;
  actionSummary: string;
}

export interface LearnerProgress {
  learnerId: string;
  completedActivities: number;
  totalActivities: number;
  currentActivities: number;
  remainingGaps: number;
  recentlyStrengthened: string[];
  capabilitiesNeedingEvidence: string[];
  nextMilestone: string;
  weeklyTargetHours: number;
  hoursCompletedThisWeek: number;
}

export interface LearnerProfile {
  id: string;
  learnerId: string;
  fullName: string;
  experienceLevel: ExperienceLevel;
  currentRole: string;
  careerGoal: string;
  targetRole: string;
  weeklyAvailableHours: number;
  initialSkillsText: string;
  createdAt: string;
  updatedAt: string;
}

export interface PathConversationMessage {
  id: string;
  learnerId: string;
  sender: 'learner' | 'system';
  query: string;
  response: string;
  timestamp: string;
  relatedCapability?: string;
  actionableTaskId?: string;
}

export interface LearnerState {
  user: User;
  profile: LearnerProfile;
  documents: DocumentUpload[];
  skills: SkillCapability[];
  selectedTargetId: string;
  customTargetTitle?: string;
  gaps: SkillGap[];
  planTasks: PlanTask[];
  evidenceHistory: EvidenceRecord[];
  assessments: AssessmentRecord[];
  progress: LearnerProgress;
  conversations: PathConversationMessage[];
}
