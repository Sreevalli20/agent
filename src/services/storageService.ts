import { LearnerState, SkillCapability } from '../types';
import { DEMO_LEARNER_ALEX, DEMO_LEARNER_MARCUS, createBlankLearnerState } from '../data/demoData';

const STORAGE_KEY_LEARNERS = 'edupath_learners_v1';
const STORAGE_KEY_ACTIVE_ID = 'edupath_active_learner_id_v1';

type StateListener = (state: LearnerState) => void;

class StorageService {
  private learners: Map<string, LearnerState> = new Map();
  private activeLearnerId: string = DEMO_LEARNER_ALEX.user.id;
  private listeners: Set<StateListener> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedLearners = localStorage.getItem(STORAGE_KEY_LEARNERS);
      const storedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);

      if (storedLearners) {
        const parsed: LearnerState[] = JSON.parse(storedLearners);
        parsed.forEach(l => this.learners.set(l.user.id, l));
      } else {
        // Seed default demo learners
        this.learners.set(DEMO_LEARNER_ALEX.user.id, DEMO_LEARNER_ALEX);
        this.learners.set(DEMO_LEARNER_MARCUS.user.id, DEMO_LEARNER_MARCUS);
        this.saveToStorage();
      }

      if (storedActiveId && this.learners.has(storedActiveId)) {
        this.activeLearnerId = storedActiveId;
      } else {
        this.activeLearnerId = DEMO_LEARNER_ALEX.user.id;
      }
    } catch {
      // Fallback
      this.learners.set(DEMO_LEARNER_ALEX.user.id, DEMO_LEARNER_ALEX);
      this.learners.set(DEMO_LEARNER_MARCUS.user.id, DEMO_LEARNER_MARCUS);
      this.activeLearnerId = DEMO_LEARNER_ALEX.user.id;
    }
  }

  private saveToStorage() {
    try {
      const array = Array.from(this.learners.values());
      localStorage.setItem(STORAGE_KEY_LEARNERS, JSON.stringify(array));
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, this.activeLearnerId);
    } catch (err) {
      console.warn('Storage write warning:', err);
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getActiveState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getActiveState();
    this.listeners.forEach(fn => fn(currentState));
  }

  public getAllLearners(): { id: string; name: string; targetRole: string; isDemo: boolean }[] {
    return Array.from(this.learners.values()).map(l => ({
      id: l.user.id,
      name: l.user.name,
      targetRole: l.profile.targetRole || 'Target Role',
      isDemo: l.user.isDemo,
    }));
  }

  public getActiveState(): LearnerState {
    const active = this.learners.get(this.activeLearnerId);
    if (!active) {
      return DEMO_LEARNER_ALEX;
    }
    return active;
  }

  public setActiveLearner(id: string) {
    if (this.learners.has(id)) {
      this.activeLearnerId = id;
      this.saveToStorage();
      this.notify();
    }
  }

  public updateActiveState(updated: LearnerState) {
    this.learners.set(updated.user.id, updated);
    this.saveToStorage();
    this.notify();
  }

  public updateSkill(skillId: string, updates: Partial<SkillCapability>) {
    const state = this.getActiveState();
    const updatedSkills = state.skills.map(s => {
      if (s.id === skillId) {
        return {
          ...s,
          ...updates,
          lastUpdated: new Date().toISOString(),
        };
      }
      return s;
    });

    const updatedState: LearnerState = {
      ...state,
      skills: updatedSkills,
    };
    this.updateActiveState(updatedState);
  }

  public addSkill(newSkillData: Omit<SkillCapability, 'id' | 'learnerId' | 'lastUpdated'>): SkillCapability {
    const state = this.getActiveState();
    const newSkill: SkillCapability = {
      ...newSkillData,
      id: 'skill-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      learnerId: state.user.id,
      lastUpdated: new Date().toISOString(),
      tags: newSkillData.tags || [],
    };

    const updatedState: LearnerState = {
      ...state,
      skills: [newSkill, ...state.skills],
    };
    this.updateActiveState(updatedState);
    return newSkill;
  }

  public deleteSkill(skillId: string) {
    const state = this.getActiveState();
    const updatedState: LearnerState = {
      ...state,
      skills: state.skills.filter(s => s.id !== skillId),
    };
    this.updateActiveState(updatedState);
  }

  public addTagToSkill(skillId: string, tag: string) {
    const cleanTag = tag.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;

    const state = this.getActiveState();
    const skill = state.skills.find(s => s.id === skillId);
    if (!skill) return;

    const existingTags = skill.tags || [];
    if (!existingTags.includes(cleanTag)) {
      this.updateSkill(skillId, {
        tags: [...existingTags, cleanTag],
      });
    }
  }

  public removeTagFromSkill(skillId: string, tagToRemove: string) {
    const state = this.getActiveState();
    const skill = state.skills.find(s => s.id === skillId);
    if (!skill || !skill.tags) return;

    this.updateSkill(skillId, {
      tags: skill.tags.filter(t => t !== tagToRemove),
    });
  }

  public createNewLearner(name: string, email: string, targetRoleId = 'data-analyst'): LearnerState {
    const fresh = createBlankLearnerState(name, email, targetRoleId);
    this.learners.set(fresh.user.id, fresh);
    this.activeLearnerId = fresh.user.id;
    this.saveToStorage();
    this.notify();
    return fresh;
  }

  public resetDemoData() {
    this.learners.set(DEMO_LEARNER_ALEX.user.id, { ...DEMO_LEARNER_ALEX });
    this.learners.set(DEMO_LEARNER_MARCUS.user.id, { ...DEMO_LEARNER_MARCUS });
    this.activeLearnerId = DEMO_LEARNER_ALEX.user.id;
    this.saveToStorage();
    this.notify();
  }
}

export const storageService = new StorageService();
