import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import { LearnerState, PlanTask } from './types';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProfileView } from './components/profile/ProfileView';
import { SkillProfileView } from './components/skills/SkillProfileView';
import { CareerTargetView } from './components/target/CareerTargetView';
import { GapAnalysisView } from './components/gap/GapAnalysisView';
import { ExecutionPlanView } from './components/plan/ExecutionPlanView';
import { EvidenceView } from './components/evidence/EvidenceView';
import { EvidenceSubmissionModal } from './components/evidence/EvidenceSubmissionModal';
import { ProgressView } from './components/progress/ProgressView';
import { AskYourPathView } from './components/pathquery/AskYourPathView';

export default function App() {
  const [state, setState] = useState<LearnerState>(() => storageService.getActiveState());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeTaskForEvidence, setActiveTaskForEvidence] = useState<PlanTask | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  useEffect(() => {
    // Subscribe to state updates from storage service
    const unsubscribe = storageService.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const handleOpenSubmitModal = (task?: PlanTask) => {
    setActiveTaskForEvidence(task || null);
    setIsEvidenceModalOpen(true);
  };

  const handleCloseSubmitModal = () => {
    setIsEvidenceModalOpen(false);
    setActiveTaskForEvidence(null);
  };

  const handleNewLearner = () => {
    storageService.createNewLearner('New Learner', 'learner@example.com', 'data-analyst');
    setCurrentTab('profile');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'landing':
        return (
          <LandingPage
            onStartFlow={() => setCurrentTab('profile')}
            onExploreDemo={() => {
              storageService.setActiveLearner('demo-learner-alex');
              setCurrentTab('dashboard');
            }}
          />
        );
      case 'dashboard':
        return (
          <DashboardView
            state={state}
            onNavigate={setCurrentTab}
            onOpenSubmitEvidence={handleOpenSubmitModal}
          />
        );
      case 'profile':
        return <ProfileView state={state} onNavigate={setCurrentTab} />;
      case 'skills':
        return <SkillProfileView state={state} onNavigate={setCurrentTab} />;
      case 'target':
        return <CareerTargetView state={state} onNavigate={setCurrentTab} />;
      case 'gap':
        return <GapAnalysisView state={state} onNavigate={setCurrentTab} />;
      case 'plan':
        return (
          <ExecutionPlanView
            state={state}
            onOpenSubmitEvidence={handleOpenSubmitModal}
            onNavigate={setCurrentTab}
          />
        );
      case 'evidence':
        return (
          <EvidenceView
            state={state}
            onOpenSubmitModal={() => handleOpenSubmitModal()}
            onNavigate={setCurrentTab}
          />
        );
      case 'progress':
        return <ProgressView state={state} onNavigate={setCurrentTab} />;
      case 'ask-path':
        return <AskYourPathView state={state} onNavigate={setCurrentTab} />;
      default:
        return (
          <DashboardView
            state={state}
            onNavigate={setCurrentTab}
            onOpenSubmitEvidence={handleOpenSubmitModal}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white antialiased">
      {/* Top Application Header with Learner Switcher & Target Role */}
      <Header
        state={state}
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        onOpenNewLearner={handleNewLearner}
        onShowLanding={() => setCurrentTab('landing')}
      />

      {/* Main Tab Navigation with Real-time Count Badges */}
      {currentTab !== 'landing' && (
        <Navigation
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          state={state}
        />
      )}

      {/* Primary Workspace Viewport */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>

      {/* Footer info bar */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">EduPath</span>
            <span>•</span>
            <span>Evidence-Based Capability Architecture & Execution Platform</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentTab('landing')}
              className="hover:text-slate-800 underline"
            >
              Product Overview
            </button>
            <button
              onClick={() => setCurrentTab('profile')}
              className="hover:text-slate-800 underline"
            >
              Profile Builder
            </button>
            <button
              onClick={() => setCurrentTab('ask-path')}
              className="hover:text-slate-800 underline"
            >
              Ask Your Path
            </button>
          </div>
        </div>
      </footer>

      {/* Modal for Submitting Evidence & Real Reassessment */}
      {isEvidenceModalOpen && (
        <EvidenceSubmissionModal
          state={state}
          task={activeTaskForEvidence}
          onClose={handleCloseSubmitModal}
          onSubmittedSuccess={() => {
            // State automatically refreshes via storageService subscriber
          }}
        />
      )}
    </div>
  );
}
