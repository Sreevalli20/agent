import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronRight,
  Plus,
  Tag,
  FolderKanban,
  Edit2,
  X,
  Check,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  SkillCapability,
  EvidenceStrength,
  LearnerState,
  PREDEFINED_SKILL_CATEGORIES
} from '../../types';
import { storageService } from '../../services/storageService';

interface SkillProfileViewProps {
  state: LearnerState;
  onNavigate: (tab: any) => void;
  onSelectCapabilityForEvidence?: (cap: string) => void;
  onOpenAddSkill?: () => void;
  onEditSkill?: (skill: SkillCapability | null) => void;
}

export const SkillProfileView: React.FC<SkillProfileViewProps> = ({
  state,
  onNavigate,
  onSelectCapabilityForEvidence,
  onOpenAddSkill,
  onEditSkill,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStrength, setFilterStrength] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<SkillCapability | null>(null);
  const [quickTagSkillId, setQuickTagSkillId] = useState<string | null>(null);
  const [quickTagInput, setQuickTagInput] = useState('');

  // Collect all unique tags and counts across all skills
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    state.skills.forEach(skill => {
      (skill.tags || []).forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [state.skills]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    state.skills.forEach(skill => {
      const cat = skill.category || 'Technical';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [state.skills]);

  const filteredSkills = state.skills.filter(s => {
    const matchesSearch = 
      s.capability.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.evidenceFound.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesStrength = filterStrength === 'all' || s.evidenceStrength === filterStrength;
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesTag = selectedTag === 'all' || (s.tags && s.tags.includes(selectedTag));

    return matchesSearch && matchesStrength && matchesCategory && matchesTag;
  });

  const getStrengthBadge = (strength: EvidenceStrength) => {
    switch (strength) {
      case 'Strong evidence':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Moderate evidence':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Limited evidence':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'No evidence':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Needs validation':
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getValidationBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      case 'Self-Reported':
        return 'text-amber-800 bg-amber-50 border border-amber-200';
      case 'Needs validation':
      default:
        return 'text-slate-600 bg-slate-100 border border-slate-200';
    }
  };

  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case 'Technical':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Soft Skills':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Management':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Analytics & BI':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Domain Knowledge':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Leadership':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleQuickAddTag = (skillId: string) => {
    const clean = quickTagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean) {
      storageService.addTagToSkill(skillId, clean);
      setQuickTagInput('');
      setQuickTagSkillId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Competency Taxonomy & Demonstration Matrix</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Skill Profile & Evidence Baseline
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Each capability is classified into standard career categories and organized with custom searchable tags reflecting verified portfolio evidence.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="skills-add-new-btn"
            onClick={() => onOpenAddSkill?.()}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Capability</span>
          </button>

          <button
            id="skills-go-to-gaps-btn"
            onClick={() => onNavigate('gap')}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <span>View Prioritized Gaps</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
            <span>Predefined Skill Categories</span>
          </span>
          <span className="text-slate-500">
            {state.skills.length} Total Capabilities Recorded
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Categories ({state.skills.length})
          </button>

          {PREDEFINED_SKILL_CATEGORIES.map(cat => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{cat}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Tag Cloud & Active Filter */}
        {Object.keys(tagCounts).length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center space-x-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Tags:</span>
            </span>

            {selectedTag !== 'all' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white">
                <span>#{selectedTag}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTag('all')}
                  className="hover:text-indigo-200 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {Object.entries(tagCounts).map(([tag, count]) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(isSelected ? 'all' : tag)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                  }`}
                >
                  #{tag} <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="skills-search-input"
            type="text"
            placeholder="Search capabilities, evidence, or #tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Strength:</span>
          </span>
          {['all', 'Strong evidence', 'Moderate evidence', 'Limited evidence', 'No evidence'].map(val => (
            <button
              key={val}
              onClick={() => setFilterStrength(val)}
              className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStrength === val
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {val === 'all' ? 'All' : val.replace(' evidence', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Capabilities Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Capability & Tags</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Current Level</th>
                <th className="py-3 px-3">Evidence Found</th>
                <th className="py-3 px-3">Evidence Strength</th>
                <th className="py-3 px-3">Validation Status</th>
                <th className="py-3 px-3">Target Level</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs">
              {filteredSkills.length > 0 ? (
                filteredSkills.map(skill => (
                  <tr 
                    key={skill.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Capability & Custom Tags */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                      <div className="text-sm font-bold text-slate-900">{skill.capability}</div>
                      
                      {/* Tags chips container */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {(skill.tags || []).map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedTag(t)}
                            title={`Filter by #${t}`}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                          >
                            #{t}
                          </button>
                        ))}

                        {/* Inline quick tag trigger */}
                        {quickTagSkillId === skill.id ? (
                          <div className="inline-flex items-center space-x-1">
                            <input
                              type="text"
                              autoFocus
                              placeholder="tag..."
                              value={quickTagInput}
                              onChange={e => setQuickTagInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleQuickAddTag(skill.id);
                                if (e.key === 'Escape') setQuickTagSkillId(null);
                              }}
                              className="w-16 px-1.5 py-0.5 text-[10px] border border-indigo-300 rounded focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuickAddTag(skill.id)}
                              className="text-indigo-600 hover:text-indigo-800 p-0.5"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickTagSkillId(null)}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickTagSkillId(skill.id);
                              setQuickTagInput('');
                            }}
                            className="text-[10px] text-slate-400 hover:text-indigo-600 hover:underline px-1 py-0.5 rounded flex items-center space-x-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Tag</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Predefined Category Badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${getCategoryBadgeClass(skill.category)}`}>
                        {skill.category || 'Technical'}
                      </span>
                    </td>

                    {/* Current Level */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {skill.currentLevel}
                      </span>
                    </td>

                    {/* Evidence Found */}
                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="text-slate-700 line-clamp-2 leading-relaxed">
                        {skill.evidenceFound}
                      </div>
                    </td>

                    {/* Evidence Strength */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStrengthBadge(skill.evidenceStrength)}`}>
                        {skill.evidenceStrength}
                      </span>
                    </td>

                    {/* Validation Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${getValidationBadge(skill.validationStatus)}`}>
                        {skill.validationStatus}
                      </span>
                    </td>

                    {/* Target Level */}
                    <td className="py-3.5 px-3 font-semibold text-indigo-900 whitespace-nowrap">
                      {skill.targetLevel}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        title="Edit categorization and tags"
                        onClick={() => onEditSkill?.(skill)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors inline-flex items-center"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedSkill(skill)}
                        className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="font-medium text-slate-700">No capabilities match your active filters.</p>
                      <p className="text-xs text-slate-500">Try resetting the category filter, clearing the tag filter, or add a new capability above.</p>
                      {(selectedCategory !== 'all' || selectedTag !== 'all' || searchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('all');
                            setSelectedTag('all');
                            setSearchQuery('');
                            setFilterStrength('all');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Capability Detailed Inspection Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 relative z-[10000] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadgeClass(selectedSkill.category)}`}>
                    {selectedSkill.category || 'Technical'}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Capability Detail
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedSkill.capability}</h3>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Category and Tags Summary */}
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Assigned Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedSkill.tags && selectedSkill.tags.length > 0 ? (
                    selectedSkill.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No custom tags assigned yet.</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-500 font-semibold block">Current Level:</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedSkill.currentLevel}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Target Requirement:</span>
                  <span className="font-bold text-indigo-900 text-sm">{selectedSkill.targetLevel}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block mb-1">Documented Evidence:</span>
                <div className="p-3 bg-slate-50 rounded-lg text-slate-800 leading-relaxed">
                  {selectedSkill.evidenceFound}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 font-semibold block">Evidence Strength:</span>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${getStrengthBadge(selectedSkill.evidenceStrength)}`}>
                    {selectedSkill.evidenceStrength}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Source:</span>
                  <span className="font-medium text-slate-800 block mt-1">{selectedSkill.source}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const s = selectedSkill;
                  setSelectedSkill(null);
                  onEditSkill?.(s);
                }}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Edit Category & Tags</span>
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedSkill(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedSkill(null);
                    onNavigate('gap');
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
                >
                  View in Gap Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
