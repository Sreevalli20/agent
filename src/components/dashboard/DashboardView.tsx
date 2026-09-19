import React from 'react';
import { 
  Target, 
  Flame, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Play, 
  Upload, 
  ShieldCheck, 
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { LearnerState, PlanTask } from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/api';

// Helper function to calculate next action locally (avoids circular dependency)
const calculateNextActionLocal = (state: LearnerState) => {
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
};

interface DashboardViewProps {
  state: LearnerState;
  onNavigate: (tab: string) => void;
  onOpenSubmitEvidence: (task?: PlanTask) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onNavigate,
  onOpenSubmitEvidence,
}) => {
  const [nextAction, setNextAction] = React.useState<any>(calculateNextActionLocal(state));
  const criticalGaps = state.gaps.filter(g => g.priority === 'Critical');
  const highestPriorityGap = criticalGaps[0] || state.gaps.filter(g => g.priority === 'High')[0] || state.gaps[0];
  
  // Try to fetch next action from API on mount
  React.useEffect(() => {
    apiService.getNextAction(state.user.id)
      .then(apiNextAction => setNextAction(apiNextAction))
      .catch(() => setNextAction(calculateNextActionLocal(state)));
  }, [state.user.id, state]);

  const inProgressTask = state.planTasks.find(t => t.status === 'In progress');
  const upcomingTasks = state.planTasks
    .filter(t => t.status === 'Not started' || t.status === 'In progress')
    .slice(0, 4);

  const recentEvidence = state.evidenceHistory.slice(0, 3);
  const completedTaskCount = state.planTasks.filter(t => t.status === 'Verified' || t.status === 'Completed').length;
  const totalTasks = state.planTasks.length || 7;
  const progressPercent = Math.round((completedTaskCount / totalTasks) * 100);

  const handleStartTask = async (task: PlanTask) => {
    // If not started, change to in progress
    if (task.status === 'Not started') {
      try {
        await apiService.updateTaskStatus(task.id, 'In progress');
      } catch (error) {
        console.warn('API call failed, using localStorage fallback:', error);
        const updatedTasks = state.planTasks.map(t => 
          t.id === task.id ? { ...t, status: 'In progress' as const } : t
        );
        storageService.updateActiveState({
          ...state,
          planTasks: updatedTasks,
          progress: {
            ...state.progress,
            currentActivities: updatedTasks.filter(t => t.status === 'In progress').length,
          }
        });
      }
    }
    // Navigate to plan view or open submit directly
    onNavigate('plan');
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome / Target Context Banner */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Career Transition Workspace</span>
            <span>•</span>
            <span className="text-indigo-700 font-bold">{state.user.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Target: {state.profile.targetRole || 'Select Target Career'}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {state.profile.careerGoal || 'Build demonstrated competencies and bridge verified capability gaps through targeted execution.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-right">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Weekly Target</div>
            <div className="text-sm font-bold text-slate-800">
              {state.progress.hoursCompletedThisWeek.toFixed(1)} / {state.profile.weeklyAvailableHours} hrs
            </div>
          </div>

          <button
            id="dashboard-view-gaps-btn"
            onClick={() => onNavigate('gap')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
          >
            <span>Inspect Gaps ({state.gaps.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* PROMINENT SECTION: YOUR NEXT ACTION */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-indigo-800/40 relative overflow-hidden">
        {/* Subtle decorative background indicator */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>YOUR NEXT ACTION</span>
            </div>

            {nextAction?.task && (
              <span className="text-xs font-semibold text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-md">
                Day {nextAction.task.day} of 7-Day Plan
              </span>
            )}
          </div>

          {nextAction && nextAction.task ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Capability: {nextAction.task.capability}
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                  {nextAction.task.learningObjective}
                </h2>

                <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed max-w-3xl">
                  <strong className="text-white">Why it matters:</strong> {nextAction.whyItMatters}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-200 pt-1">
                  <div className="flex items-center space-x-1.5 bg-black/20 px-2.5 py-1 rounded">
                    <Clock className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Expected Duration: <strong>{nextAction.expectedTime}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-black/20 px-2.5 py-1 rounded">
                    <FileCheck className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Deliverable: <strong>{nextAction.deliverable}</strong></span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
                <button
                  id="dashboard-start-next-action-btn"
                  onClick={() => handleStartTask(nextAction.task)}
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-sm transition-all focus:outline-hidden"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{nextAction.task.status === 'In progress' ? 'Continue Practice' : 'Start Action'}</span>
                </button>

                <button
                  id="dashboard-submit-evidence-btn"
                  onClick={() => onOpenSubmitEvidence(nextAction.task)}
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 transition-all focus:outline-hidden"
                >
                  <Upload className="w-4 h-4" />
                  <span>Submit Evidence for This Task</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-white">All Scheduled Actions Completed</h3>
              <p className="text-xs text-indigo-200 mt-1 max-w-md mx-auto">
                All prioritized practice activities have been executed and verified. You can update your career target or submit additional advanced evidence.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3 Core Metric Summaries: Focus, Highest Priority Gap, Weekly Execution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Current Focus */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Current Focus</span>
            </div>
            <div className="font-bold text-slate-900 text-base mt-1">
              {inProgressTask ? inProgressTask.capability : (nextAction?.task.capability || 'Initial Setup')}
            </div>
            <div className="text-xs text-slate-600 mt-1 line-clamp-2">
              {inProgressTask ? inProgressTask.learningObjective : 'Select or start scheduled practice task to begin.'}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Status</span>
            <span className={`px-2 py-0.5 rounded ${
              inProgressTask ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {inProgressTask ? 'Active In Progress' : 'Ready to begin'}
            </span>
          </div>
        </div>

        {/* Highest-Priority Gap */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Highest-Priority Gap</span>
            </div>
            <div className="font-bold text-slate-900 text-base mt-1">
              {highestPriorityGap ? highestPriorityGap.capability : 'No critical gaps'}
            </div>
            <div className="text-xs text-slate-600 mt-1 line-clamp-2">
              {highestPriorityGap ? highestPriorityGap.reason : 'All core role requirements have verified evidence.'}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Target Level</span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
              {highestPriorityGap ? `${highestPriorityGap.priority} Priority (${highestPriorityGap.targetRequirement})` : 'Satisfied'}
            </span>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Weekly Plan Progress</span>
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{completedTaskCount}</span>
              <span className="text-xs text-slate-500 font-medium">of {totalTasks} activities verified</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Remaining gaps to close:</span>
            <span className="text-slate-800 font-bold">{state.progress.remainingGaps}</span>
          </div>
        </div>
      </div>

      {/* Capabilities Status Grid: Strengthened vs Needing Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Capabilities Strengthened */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Capabilities Strengthened</span>
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {state.progress.recentlyStrengthened.length} Verified
            </span>
          </div>

          {state.progress.recentlyStrengthened.length > 0 ? (
            <div className="space-y-2">
              {state.progress.recentlyStrengthened.map(cap => {
                const skill = state.skills.find(s => s.capability === cap);
                return (
                  <div 
                    key={cap}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{cap}</div>
                      <div className="text-slate-500 text-[11px]">{skill?.evidenceStrength || 'Strong evidence'}</div>
                    </div>
                    <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                      {skill?.currentLevel || 'Verified'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              No capabilities strengthened yet. Complete and submit practice tasks to advance capability levels.
            </div>
          )}
        </div>

        {/* Capabilities Needing Evidence */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Capabilities Needing Evidence</span>
            </h3>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
              {state.progress.capabilitiesNeedingEvidence.length} Required
            </span>
          </div>

          {state.progress.capabilitiesNeedingEvidence.length > 0 ? (
            <div className="space-y-2">
              {state.progress.capabilitiesNeedingEvidence.slice(0, 4).map(cap => {
                const gap = state.gaps.find(g => g.capability === cap);
                return (
                  <div 
                    key={cap}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/30 border border-amber-100 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{cap}</div>
                      <div className="text-slate-500 text-[11px] line-clamp-1">{gap?.reason || 'Requires verifiable project artifact'}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                      gap?.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {gap?.priority || 'High'} Priority
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              All essential capabilities have baseline evidence recorded.
            </div>
          )}
        </div>
      </div>

      {/* Two-Column: Upcoming Tasks & Recent Evidence Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Tasks */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming 7-Day Execution Tasks</h3>
              <p className="text-xs text-slate-500">Deliverable-oriented practice scheduled for this cycle</p>
            </div>
            <button
              onClick={() => onNavigate('plan')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>Full Plan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingTasks.map(task => (
              <div 
                key={task.id}
                className="p-3.5 rounded-lg border border-slate-200/90 hover:border-indigo-300 transition-colors bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Day {task.day}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate">{task.capability}</span>
                    <span className="text-[11px] text-slate-500">• {task.expectedDuration}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-700">{task.learningObjective}</div>
                  <div className="text-[11px] text-slate-500">Deliverable: {task.deliverable}</div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onOpenSubmitEvidence(task)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded border border-indigo-200 transition-colors"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => handleStartTask(task)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded transition-colors"
                  >
                    {task.status === 'In progress' ? 'Active' : 'Start'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Evidence */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Evidence Submissions</h3>
              <p className="text-xs text-slate-500">Verified project deliverables & assessments</p>
            </div>
            <button
              onClick={() => onNavigate('evidence')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentEvidence.length > 0 ? (
            <div className="space-y-3">
              {recentEvidence.map(ev => (
                <div 
                  key={ev.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{ev.capability}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      ev.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {ev.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 line-clamp-1 font-mono text-[11px]">
                    {ev.evidenceType}: {ev.submittedEvidence}
                  </div>

                  <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                    "{ev.feedback}"
                  </div>

                  <div className="text-[10px] text-slate-400">
                    Submitted on {new Date(ev.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div>No deliverables submitted yet.</div>
              <p className="text-[11px] text-slate-400 mt-1">Submit your first task deliverable to initiate capability verification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
