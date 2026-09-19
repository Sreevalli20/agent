import React, { useState } from 'react';
import { X, Plus, Check, Award, Tag, Sparkles } from 'lucide-react';
import { 
  CapabilityLevel, 
  EvidenceStrength, 
  PREDEFINED_SKILL_CATEGORIES, 
  SkillCapability 
} from '../../types';
import { storageService } from '../../services/storageService';

interface AddSkillModalProps {
  onClose: () => void;
  onAdded?: () => void;
}

export const AddSkillModal: React.FC<AddSkillModalProps> = ({
  onClose,
  onAdded,
}) => {
  const [capability, setCapability] = useState('');
  const [category, setCategory] = useState<string>('Technical');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<CapabilityLevel>('Beginner');
  const [targetLevel, setTargetLevel] = useState<CapabilityLevel>('Intermediate');
  const [evidenceFound, setEvidenceFound] = useState('');
  const [evidenceStrength, setEvidenceStrength] = useState<EvidenceStrength>('Limited evidence');
  const [source, setSource] = useState('User Created');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (newTag: string) => {
    const clean = newTag.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capability.trim()) return;

    const finalCategory = isCustomCategory ? (customCategory.trim() || 'General') : category;

    storageService.addSkill({
      capability: capability.trim(),
      category: finalCategory,
      tags,
      currentLevel,
      targetLevel,
      evidenceFound: evidenceFound.trim() || 'User defined competency entry.',
      evidenceStrength,
      source: source.trim() || 'Direct User Entry',
      validationStatus: 'Self-Reported',
    });

    if (onAdded) onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                New Capability
              </span>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                Add & Categorize Skill
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Capability Title */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Capability Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Prompt Engineering & RAG Architectures..."
              value={capability}
              onChange={e => setCapability(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold uppercase tracking-wider text-slate-600">
                Predefined Category *
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="font-semibold text-indigo-700 hover:text-indigo-900 underline"
              >
                {isCustomCategory ? 'Select Predefined' : '+ Custom Category'}
              </button>
            </div>

            {!isCustomCategory ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PREDEFINED_SKILL_CATEGORIES.map(cat => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-2 rounded-lg border text-left font-semibold flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Enter custom category name..."
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            )}
          </div>

          {/* Custom Tags */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Custom Tags
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 border border-slate-200 rounded-lg mb-1.5">
              {tags.length > 0 ? (
                tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-900 border border-indigo-200"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-indigo-600 hover:text-indigo-900 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">No tags added yet.</span>
              )}
            </div>

            <div className="flex space-x-2">
              <div className="relative grow">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">#</span>
                <input
                  type="text"
                  placeholder="Type tag (e.g. backend, dax, rest-api)..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shrink-0"
              >
                Add
              </button>
            </div>
          </div>

          {/* Levels Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Current Level
              </label>
              <select
                value={currentLevel}
                onChange={e => setCurrentLevel(e.target.value as CapabilityLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
              >
                {['None', 'Beginner', 'Intermediate', 'Advanced', 'Expert'].map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Target Role Requirement
              </label>
              <select
                value={targetLevel}
                onChange={e => setTargetLevel(e.target.value as CapabilityLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-indigo-900"
              >
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Evidence description */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Demonstrated Evidence / Context
            </label>
            <textarea
              rows={2}
              placeholder="Detail projects, certifications, or work experience demonstrating this capability..."
              value={evidenceFound}
              onChange={e => setEvidenceFound(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
            />
          </div>

          {/* Footer actions */}
          <div className="border-t border-slate-100 pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="add-skill-modal-submit-btn"
              className="px-5 py-2 font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs transition-colors"
            >
              Add Capability
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
