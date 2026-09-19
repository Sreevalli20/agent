import React from 'react';
import { 
  LayoutDashboard, 
  User, 
  Target, 
  SplitSquareVertical, 
  CalendarDays, 
  TrendingUp, 
  FolderCheck, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { LearnerState } from '../../types';

interface NavigationProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  state: LearnerState;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onNavigate, state }) => {
  const criticalGapsCount = state.gaps.filter(g => g.priority === 'Critical').length;
  const inProgressCount = state.planTasks.filter(t => t.status === 'In progress').length;
  const verifiedTasksCount = state.planTasks.filter(t => t.status === 'Verified' || t.status === 'Completed').length;
  const evidenceCount = state.evidenceHistory.length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      badge: state.documents.length > 0 ? `${state.documents.length} docs` : undefined,
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: Sparkles,
      badge: `${state.skills.length}`,
    },
    {
      id: 'target',
      label: 'Career Target',
      icon: Target,
    },
    {
      id: 'gap',
      label: 'Gap Analysis',
      icon: SplitSquareVertical,
      badge: criticalGapsCount > 0 ? `${criticalGapsCount} critical` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'plan',
      label: 'Execution Plan',
      icon: CalendarDays,
      badge: inProgressCount > 0 ? `${inProgressCount} active` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: TrendingUp,
      badge: `${verifiedTasksCount}/${state.planTasks.length || 7}`,
    },
    {
      id: 'evidence',
      label: 'Evidence',
      icon: FolderCheck,
      badge: evidenceCount > 0 ? `${evidenceCount}` : undefined,
    },
    {
      id: 'ask-path',
      label: 'Ask Your Path',
      icon: HelpCircle,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar scroll-smooth">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 focus:outline-hidden ${
                  isActive
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full tracking-tight ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : (item.badgeColor || 'bg-slate-200 text-slate-700')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
