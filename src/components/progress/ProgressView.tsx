import React from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Award, 
  ShieldCheck, 
  RefreshCw, 
  Calendar,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { LearnerState, CapabilityProgressStatus, EvidenceStrength } from '../../types';

interface ProgressViewProps {
  state: LearnerState;
  onNavigate: (tab: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ state, onNavigate }) => {
  const getProgressStatus = (strength: EvidenceStrength): CapabilityProgressStatus => {
    switch (strength) {
      case 'Strong evidence':
        return 'Strong evidence';
      case 'Moderate evidence':
        return 'Developing';
      case 'Limited evidence':
      case 'Needs validation':
        return 'Needs evidence';
      case 'No evidence':
      default:
        return 'Needs improvement';
    }
  };

  const getProgressBadge = (status: CapabilityProgressStatus) => {
    switch (status) {
      case 'Strong evidence':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Developing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Needs evidence':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Needs improvement':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Verified Milestone Tracker</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Competency Growth & Reassessment Log
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Capability maturity derived from submitted deliverables, verified artifacts, and dynamic reassessments against target role standards.
          </p>
        </div>

        <button
          onClick={() => onNavigate('plan')}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <span>Continue 7-Day Plan</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 5 Core Metric Cards: Completed activities, Current activities, Remaining gaps, Recently strengthened, Next milestone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Completed activities */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] uppercase font-bold text-slate-500 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed Activities</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {state.progress.completedActivities}
            </span>
            <span className="text-xs text-slate-500 ml-1">/ {state.progress.totalActivities} tasks</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Verified with artifacts</div>
        </div>

        {/* Current activities */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] uppercase font-bold text-slate-500 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Current Activities</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {state.progress.currentActivities}
            </span>
            <span className="text-xs text-slate-500 ml-1">in progress</span>
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">Active practice cycle</div>
        </div>

        {/* Remaining gaps */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] uppercase font-bold text-slate-500 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Remaining Gaps</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {state.progress.remainingGaps}
            </span>
            <span className="text-xs text-slate-500 ml-1">unclosed</span>
          </div>
          <div className="text-[11px] text-rose-700 font-semibold mt-1">Prioritized to resolve</div>
        </div>

        {/* Recently strengthened */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] uppercase font-bold text-slate-500 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Strengthened</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-indigo-900">
              {state.progress.recentlyStrengthened.length}
            </span>
            <span className="text-xs text-slate-500 ml-1">capabilities</span>
          </div>
          <div className="text-[11px] text-indigo-700 font-semibold mt-1 truncate">
            {state.progress.recentlyStrengthened[0] || 'Initial assessment'}
          </div>
        </div>

        {/* Next milestone */}
        <div className="bg-indigo-900 text-white p-4 rounded-xl border border-indigo-950 shadow-xs flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="text-[11px] uppercase font-bold text-indigo-300">
            Next Target Milestone
          </div>
          <div className="text-xs font-semibold text-white mt-1 leading-snug line-clamp-3">
            {state.progress.nextMilestone}
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-[10px] text-indigo-300 hover:text-white font-bold uppercase tracking-wider flex items-center space-x-1 mt-2"
          >
            <span>View Action</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Capability-Level Progress Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Capability-Level Progress & Verification Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.skills.map(skill => {
            const status = getProgressStatus(skill.evidenceStrength);
            return (
              <div
                key={skill.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{skill.capability}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Target: {skill.targetLevel} level • Current: {skill.currentLevel}
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getProgressBadge(status)}`}>
                    {status}
                  </span>
                </div>

                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  <strong className="text-slate-900">Evidence Record:</strong> {skill.evidenceFound}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Source: {skill.source}</span>
                  <span className="font-semibold text-indigo-700">{skill.validationStatus}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Reassessment Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              <span>Reassessment Log (Before vs. After)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditable record of how capabilities and plans dynamically updated following deliverable reviews.
            </p>
          </div>
        </div>

        {state.assessments.length > 0 ? (
          <div className="space-y-3">
            {state.assessments.map(assess => (
              <div
                key={assess.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <span>{assess.capability}</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-xs font-semibold text-emerald-700">Reassessment Applied</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(assess.date).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Before Evidence:</span>
                    <span className="text-slate-700 font-semibold">{assess.previousStrength} ({assess.previousLevel})</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 block">After Reassessment:</span>
                    <span className="text-emerald-700 font-bold">{assess.newStrength} ({assess.newLevel})</span>
                  </div>
                </div>

                <div className="text-slate-700">
                  <strong className="text-slate-900">Summary: </strong>
                  {assess.actionSummary}
                </div>

                {assess.demonstratedCapabilities.length > 0 && (
                  <div className="text-slate-600">
                    <strong className="text-slate-800">Capabilities Demonstrated: </strong>
                    {assess.demonstratedCapabilities.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No reassessments recorded yet. Submitting practice deliverables triggers capability reassessment.
          </div>
        )}
      </div>
    </div>
  );
};
