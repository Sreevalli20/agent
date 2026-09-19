import React, { useState } from 'react';
import { X, Tag, Plus, Check, FolderKanban, Trash2 } from 'lucide-react';
import { SkillCapability, PREDEFINED_SKILL_CATEGORIES } from '../../types';
import { storageService } from '../../services/storageService';

interface SkillTagModalProps {
  skill: SkillCapability;
  onClose: () => void;
  onSaved?: () => void;
}

export const SkillTagModal: React.FC<SkillTagModalProps> = ({
  skill,
  onClose,
  onSaved,
}) => {
  const [capability, setCapability] = useState(skill.capability);
  const [category, setCategory] = useState(skill.category || 'Technical');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(
    !PREDEFINED_SKILL_CATEGORIES.includes(skill.category as any)
  );
  const [tags, setTags] = useState<string[]>(skill.tags || []);
  const [tagInput, setTagInput] = useState('');

  const suggestedTags = [
    'sql', 'python', 'dax', 'tableau', 'power-bi', 'etl', 'data-modeling',
    'statistics', 'hypothesis-testing', 'communication', 'storytelling',
    'leadership', 'agile', 'scrum', 'docker', 'kubernetes', 'aws', 'git'
  ].filter(t => !tags.includes(t));

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? (customCategory.trim() || 'General') : category;

    storageService.updateSkill(skill.id, {
      capability,
      category: finalCategory,
      tags,
    });

    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Taxonomy & Organization
              </span>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                Categorize & Tag Skill
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

        <form onSubmit={handleSave} className="space-y-4">
          {/* Capability Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Capability Title
            </label>
            <input
              type="text"
              required
              value={capability}
              onChange={e => setCapability(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white font-semibold text-slate-900"
            />
          </div>

          {/* Predefined Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Primary Category
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
              >
                {isCustomCategory ? 'Choose Predefined Category' : '+ Custom Category'}
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
                      className={`px-3 py-2 text-xs rounded-lg border text-left font-semibold flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-1 ring-indigo-400'
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
              <div>
                <input
                  type="text"
                  placeholder="Enter custom category name (e.g. Data Engineering)..."
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}
          </div>

          {/* Custom Tags Section */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Custom Tags
            </label>

            {/* Existing Tags Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 border border-slate-200 rounded-lg mb-2">
              {tags.length > 0 ? (
                tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100/90 text-indigo-900 border border-indigo-200"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-indigo-600 hover:text-indigo-900 ml-1 focus:outline-hidden"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  No tags added yet. Type below and press Enter.
                </span>
              )}
            </div>

            {/* Add Tag Input */}
            <div className="flex space-x-2">
              <div className="relative grow">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                  #
                </span>
                <input
                  type="text"
                  placeholder="Add custom tag (press Enter or comma)..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg shrink-0 transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </div>

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div className="mt-2 text-xs">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Suggested tags:
                </span>
                <div className="flex flex-wrap gap-1">
                  {suggestedTags.slice(0, 6).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleAddTag(st)}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/60 transition-colors"
                    >
                      +{st}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Remove "${skill.capability}" from skill baseline?`)) {
                  storageService.deleteSkill(skill.id);
                  if (onSaved) onSaved();
                  onClose();
                }
              }}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Capability</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="skill-tag-modal-save-btn"
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
