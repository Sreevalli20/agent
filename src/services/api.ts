import { LearnerState, User, LearnerProfile, DocumentUpload, SkillCapability, SkillGap, PlanTask, EvidenceRecord, AssessmentRecord, LearnerProgress, PathConversationMessage, TaskStatus } from '../types';
import { storageService } from './storageService';

// API base URL from environment or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private isBackendAvailable: boolean = false;
  
  constructor() {
    this.checkBackendAvailability();
  }
  
  private async checkBackendAvailability(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      this.isBackendAvailable = response.ok;
    } catch {
      this.isBackendAvailable = false;
    }
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.isBackendAvailable) {
      throw new Error('Backend unavailable - using localStorage fallback');
    }
    
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Helper method to use localStorage when backend is unavailable
  private async withFallback<T>(
    apiCall: () => Promise<T>,
    localStorageFallback: () => T
  ): Promise<T> {
    try {
      await this.checkBackendAvailability();
      if (this.isBackendAvailable) {
        return await apiCall();
      }
    } catch (error) {
      console.warn('Backend unavailable, using localStorage fallback:', error);
    }
    return localStorageFallback();
  }
  
  // Learner operations
  async createLearner(userData: { name: string; email: string; is_demo: boolean }): Promise<User> {
    return this.withFallback(
      () => this.request<User>('/api/v1/learners/', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
      () => {
        const state = storageService.createNewLearner(userData.name, userData.email);
        return state.user;
      }
    );
  }
  
  async getLearner(learnerId: string): Promise<User> {
    return this.withFallback(
      () => this.request<User>(`/api/v1/learners/${learnerId}`),
      () => {
        const state = storageService.getActiveState();
        if (state.user.id !== learnerId) {
          throw new Error('Learner not found in localStorage');
        }
        return state.user;
      }
    );
  }
  
  async getLearnerState(learnerId: string): Promise<LearnerState> {
    return this.withFallback(
      () => {
        // For demo learners, use the demo endpoint
        if (learnerId === 'demo-learner-alex' || learnerId === 'demo-learner-marcus') {
          return this.request<LearnerState>(`/api/v1/learners/demo/${learnerId === 'demo-learner-alex' ? 'alex' : 'marcus'}/state`);
        }
        return this.request<LearnerState>(`/api/v1/learners/${learnerId}/state`);
      },
      () => {
        const state = storageService.getActiveState();
        if (state.user.id !== learnerId) {
          throw new Error('Learner not found in localStorage');
        }
        return state;
      }
    );
  }
  
  async updateLearnerState(learnerId: string, state: LearnerState): Promise<LearnerState> {
    return this.withFallback(
      () => this.request<LearnerState>(`/api/v1/learners/${learnerId}/state`, {
        method: 'PUT',
        body: JSON.stringify(state),
      }),
      () => {
        storageService.updateActiveState(state);
        return state;
      }
    );
  }
  
  // Profile operations
  async updateProfile(learnerId: string, profile: LearnerProfile): Promise<LearnerProfile> {
    return this.withFallback(
      () => this.request<LearnerProfile>(`/api/v1/profile/${learnerId}`, {
        method: 'POST',
        body: JSON.stringify(profile),
      }),
      () => {
        const state = storageService.getActiveState();
        const updatedState = { ...state, profile };
        storageService.updateActiveState(updatedState);
        return updatedState.profile;
      }
    );
  }
  
  // Document operations
  async uploadDocument(learnerId: string, document: DocumentUpload): Promise<DocumentUpload> {
    return this.withFallback(
      () => this.request<DocumentUpload>(`/api/v1/documents/${learnerId}`, {
        method: 'POST',
        body: JSON.stringify(document),
      }),
      () => {
        const state = storageService.getActiveState();
        const updatedState = {
          ...state,
          documents: [...state.documents, document]
        };
        storageService.updateActiveState(updatedState);
        return document;
      }
    );
  }
  
  async getDocuments(learnerId: string): Promise<DocumentUpload[]> {
    return this.withFallback(
      () => this.request<DocumentUpload[]>(`/api/v1/documents/${learnerId}`),
      () => {
        const state = storageService.getActiveState();
        return state.documents;
      }
    );
  }
  
  async deleteDocument(learnerId: string, documentId: string): Promise<void> {
    return this.withFallback(
      () => this.request<void>(`/api/v1/documents/${learnerId}/${documentId}`, {
        method: 'DELETE',
      }),
      () => {
        const state = storageService.getActiveState();
        const updatedState = {
          ...state,
          documents: state.documents.filter(doc => doc.id !== documentId)
        };
        storageService.updateActiveState(updatedState);
      }
    );
  }
  
  // Analysis operations
  async analyzeProfile(learnerId: string, targetRoleId: string): Promise<SkillCapability[]> {
    return this.withFallback(
      () => this.request<SkillCapability[]>('/api/v1/analysis/profile', {
        method: 'POST',
        body: JSON.stringify({ learner_id: learnerId, target_role_id: targetRoleId }),
      }),
      () => {
        const state = storageService.getActiveState();
        const { buildSkillProfileFromInput } = require('./evaluationEngine');
        const skills = buildSkillProfileFromInput(state.profile, state.documents, targetRoleId);
        const updatedState = { ...state, skills };
        storageService.updateActiveState(updatedState);
        return skills;
      }
    );
  }
  
  async computeGaps(learnerId: string, targetRoleId: string): Promise<SkillGap[]> {
    return this.withFallback(
      () => this.request<SkillGap[]>('/api/v1/analysis/gaps', {
        method: 'POST',
        body: JSON.stringify({ learner_id: learnerId, target_role_id: targetRoleId }),
      }),
      () => {
        const state = storageService.getActiveState();
        const { computeGapAnalysis } = require('./evaluationEngine');
        const gaps = computeGapAnalysis(state.skills, targetRoleId);
        const updatedState = { ...state, gaps };
        storageService.updateActiveState(updatedState);
        return gaps;
      }
    );
  }
  
  async getGaps(learnerId: string): Promise<SkillGap[]> {
    return this.withFallback(
      () => this.request<SkillGap[]>(`/api/v1/analysis/${learnerId}/gaps`),
      () => {
        const state = storageService.getActiveState();
        return state.gaps;
      }
    );
  }
  
  // Plan operations
  async generatePlan(learnerId: string, targetRoleId: string): Promise<PlanTask[]> {
    return this.withFallback(
      () => this.request<PlanTask[]>('/api/v1/plans/generate', {
        method: 'POST',
        body: JSON.stringify({ learner_id: learnerId, target_role_id: targetRoleId }),
      }),
      () => {
        const state = storageService.getActiveState();
        const { generateExecutionPlan } = require('./evaluationEngine');
        const plan = generateExecutionPlan(state.gaps, learnerId, targetRoleId);
        const updatedState = { ...state, planTasks: plan };
        storageService.updateActiveState(updatedState);
        return plan;
      }
    );
  }
  
  async getPlan(learnerId: string): Promise<PlanTask[]> {
    return this.withFallback(
      () => this.request<PlanTask[]>(`/api/v1/plans/${learnerId}`),
      () => {
        const state = storageService.getActiveState();
        return state.planTasks;
      }
    );
  }
  
  // Task operations
  async updateTaskStatus(taskId: string, status: string): Promise<PlanTask> {
    return this.withFallback(
      () => this.request<PlanTask>(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
      () => {
        const state = storageService.getActiveState();
        const updatedTasks = state.planTasks.map(task => 
          task.id === taskId ? { ...task, status: status as TaskStatus } : task
        );
        const updatedState = { ...state, planTasks: updatedTasks };
        storageService.updateActiveState(updatedState);
        return updatedTasks.find(t => t.id === taskId)!;
      }
    );
  }
  
  // Evidence operations
  async submitEvidence(
    learnerId: string,
    taskId: string,
    evidenceType: string,
    submittedEvidence: string,
    summaryNotes: string,
    attachmentName?: string
  ): Promise<{ assessment: AssessmentRecord; feedback: string }> {
    return this.withFallback(
      () => this.request<{ assessment: AssessmentRecord; feedback: string }>('/api/v1/evidence/submit', {
        method: 'POST',
        body: JSON.stringify({
          learner_id: learnerId,
          task_id: taskId,
          evidence_type: evidenceType,
          submitted_evidence: submittedEvidence,
          summary_notes: summaryNotes,
          attachment_name: attachmentName
        }),
      }),
      () => {
        const state = storageService.getActiveState();
        const { submitAndReassessEvidence } = require('./evaluationEngine');
        const result = submitAndReassessEvidence(
          state,
          taskId,
          evidenceType,
          submittedEvidence,
          summaryNotes,
          attachmentName
        );
        storageService.updateActiveState(result.updatedState);
        return { assessment: result.assessment, feedback: result.feedback };
      }
    );
  }
  
  async getEvidenceHistory(learnerId: string): Promise<EvidenceRecord[]> {
    return this.withFallback(
      () => this.request<EvidenceRecord[]>(`/api/v1/evidence/${learnerId}`),
      () => {
        const state = storageService.getActiveState();
        return state.evidenceHistory;
      }
    );
  }
  
  // Dashboard operations
  async getDashboardProgress(learnerId: string): Promise<LearnerProgress> {
    return this.withFallback(
      () => this.request<LearnerProgress>(`/api/v1/dashboard/${learnerId}/progress`),
      () => {
        const state = storageService.getActiveState();
        return state.progress;
      }
    );
  }
  
  async getNextAction(learnerId: string): Promise<any> {
    return this.withFallback(
      () => this.request<any>(`/api/v1/dashboard/${learnerId}/next-action`),
      () => {
        const state = storageService.getActiveState();
        const { calculateNextAction } = require('./evaluationEngine');
        return calculateNextAction(state);
      }
    );
  }
  
  // Conversation operations
  async askPathQuery(learnerId: string, query: string): Promise<PathConversationMessage> {
    return this.withFallback(
      () => this.request<PathConversationMessage>('/api/v1/conversations/ask', {
        method: 'POST',
        body: JSON.stringify({ learner_id: learnerId, query }),
      }),
      () => {
        const state = storageService.getActiveState();
        const { answerPathQuery } = require('./evaluationEngine');
        const response = answerPathQuery(state, query);
        const updatedState = {
          ...state,
          conversations: [response, ...state.conversations]
        };
        storageService.updateActiveState(updatedState);
        return response;
      }
    );
  }
  
  async getConversations(learnerId: string): Promise<PathConversationMessage[]> {
    return this.withFallback(
      () => this.request<PathConversationMessage[]>(`/api/v1/conversations/${learnerId}`),
      () => {
        const state = storageService.getActiveState();
        return state.conversations;
      }
    );
  }
}

export const apiService = new ApiService();
