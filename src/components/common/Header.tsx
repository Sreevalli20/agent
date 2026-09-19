import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  UserCheck, 
  Users, 
  PlusCircle, 
  RotateCcw, 
  ChevronDown, 
  Target, 
  Menu, 
  X,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';
import { LearnerState, AuthSession } from '../../types';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';
import { AuthModal } from '../auth/AuthModal';
import { PasswordManagementModal } from '../auth/PasswordManagementModal';

interface HeaderProps {
  state: LearnerState;
  onNavigate: (tab: string) => void;
  currentTab: string;
  onOpenNewLearner: () => void;
  onShowLanding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onNavigate,
  currentTab,
  onOpenNewLearner,
  onShowLanding,
}) => {
  const [learnerDropdownOpen, setLearnerDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => authService.getCurrentSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const allLearners = storageService.getAllLearners();

  useEffect(() => {
    const unsub = authService.subscribe(session => {
      setAuthSession(session);
    });
    return unsub;
  }, []);

  const handleSelectLearner = (id: string) => {
    storageService.setActiveLearner(id);
    setLearnerDropdownOpen(false);
  };

  const handleResetDemo = () => {
    if (confirm('Reset demo learners to initial state?')) {
      storageService.resetDemoData();
      setLearnerDropdownOpen(false);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
    setLearnerDropdownOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    setLearnerDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <button
              id="header-brand-button"
              onClick={onShowLanding}
              className="flex items-center space-x-2.5 text-left group focus:outline-hidden"
              title="Return to EduPath Landing"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-700 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-800 transition-colors">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-slate-900 font-sans block leading-none">
                  EduPath
                </span>
                <span className="text-[11px] font-medium tracking-wide uppercase text-slate-500 block mt-0.5">
                  Career Execution Platform
                </span>
              </div>
            </button>

            {/* Target Role Pill */}
            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-200">
              <button
                id="header-target-role-pill"
                onClick={() => onNavigate('target')}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/60 hover:bg-indigo-100/80 transition-colors"
              >
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Target: {state.profile.targetRole || 'Not Selected'}</span>
              </button>
            </div>
          </div>

          {/* Right Controls: Auth, Learner Switcher & Action */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Landing page link */}
            <button
              id="header-landing-link"
              onClick={onShowLanding}
              className="hidden lg:inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
            >
              <span>Platform Overview</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>

            {/* Auth Buttons if Not Logged In */}
            {!authSession ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  id="header-signin-btn"
                  type="button"
                  onClick={() => handleOpenAuth('login')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
                <button
                  id="header-register-btn"
                  type="button"
                  onClick={() => handleOpenAuth('register')}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-2xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            ) : null}

            {/* Learner Profile Switcher / Account Dropdown */}
            <div className="relative">
              <button
                id="header-learner-dropdown-button"
                onClick={() => setLearnerDropdownOpen(!learnerDropdownOpen)}
                className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300/80 rounded-lg transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-700 text-white flex items-center justify-center text-xs font-bold uppercase">
                  {(authSession?.fullName || state.user.name).charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight flex items-center space-x-1.5">
                    <span>{authSession?.fullName || state.user.name}</span>
                    {authSession ? (
                      <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">
                        Secure
                      </span>
                    ) : (
                      state.user.isDemo && (
                        <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded">
                          Demo
                        </span>
                      )
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {learnerDropdownOpen && (
                <div 
                  id="header-learner-dropdown-menu"
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left"
                >
                  {/* Account Status Header */}
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {authSession ? authSession.fullName : state.user.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {authSession ? authSession.email : state.user.email}
                    </div>
                    {authSession && (
                      <div className="mt-1 flex items-center space-x-1 text-[10px] text-emerald-700 font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Authenticated with PBKDF2</span>
                      </div>
                    )}
                  </div>

                  {/* Password & Credential Security Link */}
                  {authSession && (
                    <div className="p-1 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setLearnerDropdownOpen(false);
                          setIsPasswordModalOpen(true);
                        }}
                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Password & Security</span>
                      </button>
                    </div>
                  )}

                  {/* Learner Profile Switching */}
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Active Learner
                  </div>
                  <div className="max-h-48 overflow-y-auto py-1">
                    {allLearners.map(learner => (
                      <button
                        key={learner.id}
                        id={`switch-learner-${learner.id}`}
                        onClick={() => handleSelectLearner(learner.id)}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          learner.id === state.user.id ? 'bg-indigo-50/70 text-indigo-900 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="text-xs font-medium">{learner.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{learner.targetRole}</div>
                        </div>
                        {learner.isDemo && (
                          <span className="shrink-0 px-1 py-0.2 text-[9px] font-semibold bg-amber-100 text-amber-800 rounded">
                            Demo
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Bottom Actions */}
                  <div className="border-t border-slate-100 pt-2 px-2 space-y-1">
                    <button
                      id="header-create-learner-btn"
                      onClick={() => {
                        setLearnerDropdownOpen(false);
                        onOpenNewLearner();
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Create New Learner Profile</span>
                    </button>

                    <button
                      id="header-reset-demo-btn"
                      onClick={handleResetDemo}
                      className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reset Demo Dataset</span>
                    </button>

                    {authSession ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenAuth('login')}
                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In with Account</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                id="header-mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="header-mobile-drawer" className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <div className="py-2 border-b border-slate-100 text-xs font-medium text-slate-500">
            Target Role: <strong className="text-slate-900">{state.profile.targetRole}</strong>
          </div>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'profile', label: 'Profile' },
            { id: 'skills', label: 'Skills & Tags' },
            { id: 'target', label: 'Career Target' },
            { id: 'gap', label: 'Gap Analysis' },
            { id: 'plan', label: 'Execution Plan' },
            { id: 'progress', label: 'Progress' },
            { id: 'evidence', label: 'Evidence' },
            { id: 'ask-path', label: 'Ask Your Path' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                currentTab === item.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* Password Management Modal */}
      {isPasswordModalOpen && (
        <PasswordManagementModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          onLogout={() => {
            setIsPasswordModalOpen(false);
          }}
        />
      )}
    </header>
  );
};
