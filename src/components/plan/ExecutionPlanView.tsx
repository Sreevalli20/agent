import React, { useState } from 'react';
import { 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  Play, 
  Upload, 
  FileCheck, 
  AlertCircle, 
  Filter, 
  FileText,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { LearnerState, PlanTask, TaskStatus } from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/api';

interface ExecutionPlanViewProps {
  state: LearnerState;
  onOpenSubmitEvidence: (task: PlanTask) => void;
  onNavigate: (tab: string) => void;
}

export const ExecutionPlanView: React.FC<ExecutionPlanViewProps> = ({
  state,
  onOpenSubmitEvidence,
  onNavigate,
}) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const filteredTasks = state.planTasks.filter(task => {
    const matchesDay = selectedDayFilter === 'all' || task.day === selectedDayFilter;
    const matchesStatus = selectedStatusFilter === 'all' || task.status === selectedStatusFilter;
    return matchesDay && matchesStatus;
  });

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Try to use API service
      await apiService.updateTaskStatus(taskId, newStatus);
      
      setNotification(`Task status updated to "${newStatus}".`);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      // Fallback to localStorage
      console.warn('API call failed, using localStorage fallback:', error);
      
      const updatedTasks = state.planTasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'Completed' || newStatus === 'Verified' ? new Date().toISOString() : t.completedAt,
          };
        }
        return t;
      });

      storageService.updateActiveState({
        ...state,
        planTasks: updatedTasks,
        progress: {
          ...state.progress,
          currentActivities: updatedTasks.filter(t => t.status === 'In progress').length,
          completedActivities: updatedTasks.filter(t => t.status === 'Verified' || t.status === 'Completed').length,
        }
      });

      setNotification(`Task status updated to "${newStatus}".`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Verified':
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Submitted':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Needs improvement':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Not started':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Adaptive Execution Cadence</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            7-Day Personalized Execution Plan
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Each day centers on an applied practice activity, expected duration, concrete deliverable, and verifiable evidence criteria.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Plan Progress</span>
            <span className="text-sm font-bold text-slate-900">
              {state.planTasks.filter(t => t.status === 'Verified' || t.status === 'Completed').length} / {state.planTasks.length} Days Verified
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Day Selector & Status Filter */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Days Filter */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedDayFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              selectedDayFilter === 'all'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All 7 Days
          </button>
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedDayFilter === day
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-500 font-semibold shrink-0">Filter Status:</span>
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Not started">Not started</option>
            <option value="In progress">In progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Verified">Verified</option>
            <option value="Needs improvement">Needs improvement</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => {
            const isVerified = task.status === 'Verified' || task.status === 'Completed';
            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                className={`bg-white rounded-xl p-5 border shadow-xs transition-all space-y-4 ${
                  task.status === 'In progress'
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Task Top Row: Day, Capability, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-sm text-indigo-700 shrink-0">
                      D{task.day}
                    </span>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Capability: <strong className="text-indigo-900">{task.capability}</strong>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {task.learningObjective}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-xs text-slate-500 mr-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{task.expectedDuration}</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                {/* Practice Activity Detail */}
                <div className="text-xs text-slate-700 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <div>
                    <span className="font-bold text-slate-900 block mb-0.5">Practice Activity:</span>
                    <p className="leading-relaxed">{task.practiceActivity}</p>
                  </div>
                </div>

                {/* Deliverable & Evidence Requirement Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Required Deliverable:
                    </span>
                    <div className="font-semibold text-slate-800">{task.deliverable}</div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Evidence Requirement Criteria:
                    </span>
                    <div className="text-slate-700">{task.evidenceRequirement}</div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-semibold">Change Status:</span>
                    <select
                      value={task.status}
                      onChange={e => handleUpdateStatus(task.id, e.target.value as TaskStatus)}
                      className="text-xs px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-700"
                    >
                      <option value="Not started">Not started</option>
                      <option value="In progress">In progress</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Verified">Verified</option>
                      <option value="Needs improvement">Needs improvement</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    {task.status === 'Not started' && (
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'In progress')}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Task</span>
                      </button>
                    )}

                    <button
                      id={`plan-submit-btn-${task.id}`}
                      onClick={() => onOpenSubmitEvidence(task)}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit Evidence</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No Tasks Matching Filters</h3>
            <p className="text-xs text-slate-500 mt-1">Adjust day or status filter to see other scheduled activities.</p>
          </div>
        )}
      </div>
    </div>
  );
};
