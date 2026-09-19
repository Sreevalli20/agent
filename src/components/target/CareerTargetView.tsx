import React, { useState } from 'react';
import { 
  Target, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  HelpCircle, 
  AlertTriangle,
  Compass,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { LearnerState, CareerRequirement, RequirementImportance } from '../../types';
import { STANDARD_CAREER_TARGETS, CAREER_REQUIREMENTS } from '../../data/rolesData';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/api';
import { computeGapAnalysis, generateExecutionPlan } from '../../services/evaluationEngine';

interface CareerTargetViewProps {
  state: LearnerState;
  onNavigate: (tab: string) => void;
}

export const CareerTargetView: React.FC<CareerTargetViewProps> = ({ state, onNavigate }) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(state.selectedTargetId || 'data-analyst');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const activeTarget = STANDARD_CAREER_TARGETS.find(t => t.id === selectedRoleId) || {
    id: selectedRoleId,
    title: state.profile.targetRole || 'Target Career',
    category: 'Custom Role',
    description: 'Customized target career pathway specified by learner.',
    typicalHoursNeeded: 120,
  };

  const requirements: CareerRequirement[] = CAREER_REQUIREMENTS[selectedRoleId] || CAREER_REQUIREMENTS['data-analyst'];

  const handleSelectRole = async (roleId: string) => {
    setSelectedRoleId(roleId);
    const targetObj = STANDARD_CAREER_TARGETS.find(t => t.id === roleId);
    const title = targetObj ? targetObj.title : roleId;

    try {
      // Try to use API service
      await apiService.computeGaps(state.user.id, roleId);
      await apiService.generatePlan(state.user.id, roleId);
      
      // Update profile
      const updatedProfile = {
        ...state.profile,
        targetRole: title,
        updatedAt: new Date().toISOString(),
      };
      await apiService.updateProfile(state.user.id, updatedProfile);
      
      // Get updated state
      const updatedState = await apiService.getLearnerState(state.user.id);
      
      setNotification(`Target career updated to "${title}". Requirement map and execution plan refreshed.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (error) {
      // Fallback to localStorage
      console.warn('API call failed, using localStorage fallback:', error);
      
      // Recalculate gaps and plan
      const updatedGaps = computeGapAnalysis(state.skills, roleId);
      const updatedPlan = generateExecutionPlan(updatedGaps, state.user.id, roleId);

      const updatedState: LearnerState = {
        ...state,
        selectedTargetId: roleId,
        profile: {
          ...state.profile,
          targetRole: title,
          updatedAt: new Date().toISOString(),
        },
        gaps: updatedGaps,
        planTasks: updatedPlan,
        progress: {
          ...state.progress,
          remainingGaps: updatedGaps.filter(g => g.gap !== 'None').length,
          totalActivities: updatedPlan.length,
          capabilitiesNeedingEvidence: updatedGaps.filter(g => g.priority === 'Critical' || g.priority === 'High').map(g => g.capability),
        }
      };

      storageService.updateActiveState(updatedState);
      setNotification(`Target career updated to "${title}". Requirement map and execution plan refreshed.`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const customId = 'custom-' + customTitle.toLowerCase().replace(/\s+/g, '-');
    setSelectedRoleId(customId);
    setIsCustomMode(false);

    const updatedGaps = computeGapAnalysis(state.skills, 'data-analyst');
    const updatedPlan = generateExecutionPlan(updatedGaps, state.user.id, 'data-analyst');

    const updatedState: LearnerState = {
      ...state,
      selectedTargetId: customId,
      customTargetTitle: customTitle,
      profile: {
        ...state.profile,
        targetRole: customTitle,
        careerGoal: customDesc || state.profile.careerGoal,
        updatedAt: new Date().toISOString(),
      },
      gaps: updatedGaps,
      planTasks: updatedPlan,
    };

    storageService.updateActiveState(updatedState);
    setNotification(`Created custom career path for "${customTitle}". Requirement map initialized.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const getImportanceBadge = (imp: RequirementImportance) => {
    switch (imp) {
      case 'Essential':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Supporting':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Industry Benchmark Standards</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Target Career & Requirement Map
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Select a target role or define a custom trajectory. Each standard specifies the exact expected level, verified deliverable criteria, and business justification.
          </p>
        </div>

        <button
          id="target-view-gaps-action-btn"
          onClick={() => onNavigate('gap')}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <span>Evaluate Against My Evidence</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Role Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Select Target Career Role
          </h2>
          <button
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCustomMode ? 'Cancel Custom Role' : 'Enter Custom Role'}</span>
          </button>
        </div>

        {/* Custom Role Form */}
        {isCustomMode && (
          <form onSubmit={handleCreateCustomRole} className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-indigo-950">Define Custom Career Target</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Healthcare Operations Analyst, FinTech Dev"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Career Goal Statement</label>
                <input
                  type="text"
                  placeholder="e.g. Master clinical workflows and regulatory reporting"
                  value={customDesc}
                  onChange={e => setCustomDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
              >
                Activate Custom Path
              </button>
            </div>
          </form>
        )}

        {/* Standard Roles Selector Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {STANDARD_CAREER_TARGETS.map(role => {
            const isSelected = selectedRoleId === role.id;
            return (
              <button
                key={role.id}
                id={`target-role-select-${role.id}`}
                onClick={() => handleSelectRole(role.id)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold leading-tight">{role.title}</div>
                  <div className={`text-[10px] mt-1 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {role.category}
                  </div>
                </div>

                <div className={`mt-3 text-[10px] font-semibold flex items-center space-x-1 ${
                  isSelected ? 'text-indigo-300' : 'text-indigo-700'
                }`}>
                  {isSelected ? <span>Active Benchmark</span> : <span>Select Path</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Requirement Map for Selected Role */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Requirement Map
            </div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 mt-0.5">
              <span>{activeTarget.title}</span>
              <span className="text-xs font-medium text-slate-500">
                ({requirements.length} Core Capabilities)
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">{activeTarget.description}</p>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
              Benchmark Standard
            </span>
          </div>
        </div>

        {/* Requirements Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                <th className="py-2.5 px-3">Capability</th>
                <th className="py-2.5 px-3">Importance</th>
                <th className="py-2.5 px-3">Expected Level</th>
                <th className="py-2.5 px-3">Industry Reason</th>
                <th className="py-2.5 px-3">Current Evidence</th>
                <th className="py-2.5 px-3">Gap Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {requirements.map(req => {
                const matchedSkill = state.skills.find(s => s.capability === req.capability);
                const matchedGap = state.gaps.find(g => g.capability === req.capability);
                const evidenceStrength = matchedSkill?.evidenceStrength || 'No evidence';
                const isSatisfied = matchedGap?.gap === 'None' || (matchedSkill && matchedSkill.currentLevel === req.expectedLevel);

                return (
                  <tr key={req.id} className="hover:bg-slate-50/60">
                    {/* Capability */}
                    <td className="py-3 px-3 font-bold text-slate-900 max-w-[200px]">
                      {req.capability}
                    </td>

                    {/* Importance */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getImportanceBadge(req.importance)}`}>
                        {req.importance}
                      </span>
                    </td>

                    {/* Expected Level */}
                    <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {req.expectedLevel}
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-3 text-slate-600 max-w-sm leading-relaxed">
                      {req.reason}
                    </td>

                    {/* Current Evidence */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                      {evidenceStrength}
                    </td>

                    {/* Gap Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isSatisfied
                          ? 'bg-emerald-100 text-emerald-800'
                          : (matchedGap?.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')
                      }`}>
                        {isSatisfied ? 'Satisfied' : (matchedGap?.gap ? `${matchedGap.gap} Gap` : 'Needs Evidence')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
