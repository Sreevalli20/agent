import React, { useState } from 'react';
import { 
  SplitSquareVertical, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Filter, 
  CalendarDays,
  HelpCircle,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { LearnerState, SkillGap, GapPriority } from '../../types';
import { generateExecutionPlan } from '../../services/evaluationEngine';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/api';

interface GapAnalysisViewProps {
  state: LearnerState;
  onNavigate: (tab: string) => void;
}

export const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({ state, onNavigate }) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const filteredGaps = state.gaps.filter(g => {
    if (priorityFilter === 'all') return true;
    return g.priority === priorityFilter;
  });

  const criticalCount = state.gaps.filter(g => g.priority === 'Critical').length;
  const highCount = state.gaps.filter(g => g.priority === 'High').length;
  const mediumCount = state.gaps.filter(g => g.priority === 'Medium').length;

  const handleConvertToPlan = async () => {
    try {
      // Try to use API service
      const updatedPlan = await apiService.generatePlan(state.user.id, state.selectedTargetId);
      
      setNotification('7-day execution plan successfully refreshed from prioritized gaps!');
      setTimeout(() => {
        onNavigate('plan');
      }, 800);
    } catch (error) {
      // Fallback to localStorage
      console.warn('API call failed, using localStorage fallback:', error);
      
      const updatedPlan = generateExecutionPlan(state.gaps, state.user.id, state.selectedTargetId);
      
      storageService.updateActiveState({
        ...state,
        planTasks: updatedPlan,
        progress: {
          ...state.progress,
          totalActivities: updatedPlan.length,
          currentActivities: updatedPlan.filter(t => t.status === 'In progress').length,
          nextMilestone: `Focus on Day 1 practice activity: ${updatedPlan[0]?.learningObjective || 'Initial deliverable'}`,
        }
      });

      setNotification('7-day execution plan successfully refreshed from prioritized gaps!');
      setTimeout(() => {
        onNavigate('plan');
      }, 800);
    }
  };

  const getPriorityBadge = (priority: GapPriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Low':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Context Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Evidence-Based Capability Diagnostics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Prioritized Capability Gap Analysis
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Target: <strong>{state.profile.targetRole}</strong>. Each gap contrasts verified baseline evidence against standard role requirements, with concrete explanations of why the capability is unfulfilled.
          </p>
        </div>

        <button
          id="gap-convert-to-plan-btn"
          onClick={handleConvertToPlan}
          className="inline-flex items-center space-x-2 px-5 py-3 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <CalendarDays className="w-4 h-4" />
          <span>Convert Gaps Into Execution Plan</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Priority Summary Cards & Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setPriorityFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all ${
            priorityFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-bold opacity-80">Total Evaluated</div>
          <div className="text-2xl font-extrabold mt-1">{state.gaps.length}</div>
          <div className="text-xs opacity-70 mt-0.5">All capabilities</div>
        </button>

        <button
          onClick={() => setPriorityFilter('Critical')}
          className={`p-4 rounded-xl border text-left transition-all ${
            priorityFilter === 'Critical'
              ? 'bg-rose-900 text-white border-rose-900 shadow-xs'
              : 'bg-rose-50/50 text-rose-900 border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-bold text-rose-700">Critical Priority</div>
          <div className="text-2xl font-extrabold text-rose-900 mt-1">{criticalCount}</div>
          <div className="text-xs text-rose-700 mt-0.5">Essential shortfalls</div>
        </button>

        <button
          onClick={() => setPriorityFilter('High')}
          className={`p-4 rounded-xl border text-left transition-all ${
            priorityFilter === 'High'
              ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
              : 'bg-amber-50/50 text-amber-900 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-bold text-amber-700">High Priority</div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">{highCount}</div>
          <div className="text-xs text-amber-700 mt-0.5">Key requirement gaps</div>
        </button>

        <button
          onClick={() => setPriorityFilter('Medium')}
          className={`p-4 rounded-xl border text-left transition-all ${
            priorityFilter === 'Medium'
              ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
              : 'bg-blue-50/50 text-blue-900 border-blue-200 hover:border-blue-300'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-bold text-blue-700">Medium / Supporting</div>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">{mediumCount}</div>
          <div className="text-xs text-blue-700 mt-0.5">Developing capabilities</div>
        </button>
      </div>

      {/* Gap Cards List */}
      <div className="space-y-4">
        {filteredGaps.length > 0 ? (
          filteredGaps.map(gap => (
            <div
              key={gap.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors space-y-4"
            >
              {/* Header row: Capability & Priority Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    gap.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{gap.capability}</h3>
                    <span className="text-xs text-slate-500 font-medium">
                      Estimated to close: ~{gap.estimatedHoursToClose} learning hours
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPriorityBadge(gap.priority)}`}>
                    {gap.priority} Priority
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    Gap: {gap.gap}
                  </span>
                </div>
              </div>

              {/* Matrix of Current Evidence vs Target Requirement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                    Current Demonstrated Evidence
                  </span>
                  <div className="text-slate-800 font-semibold text-sm">
                    {gap.currentEvidence} ({gap.currentLevel} level)
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                    Target Requirement Standard
                  </span>
                  <div className="text-indigo-900 font-bold text-sm">
                    {gap.targetRequirement} level ({gap.importance} requirement)
                  </div>
                </div>
              </div>

              {/* RATIONALE: Explains WHY this is a gap */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Reason for Gap Classification:
                </span>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {gap.reason}
                </p>
              </div>

              {/* RECOMMENDED ACTION */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Recommended Action: </span>
                  <span className="text-slate-600">{gap.recommendedAction}</span>
                </div>

                <button
                  onClick={() => onNavigate('plan')}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 shrink-0"
                >
                  <span>Practice in Execution Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No Gaps Matching Filter</h3>
            <p className="text-xs text-slate-500 mt-1">Select "Total Evaluated" above to view all capability diagnoses.</p>
          </div>
        )}
      </div>
    </div>
  );
};
