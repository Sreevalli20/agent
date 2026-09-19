import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link as LinkIcon, 
  RemoveFormatting, 
  Undo2, 
  Redo2, 
  Eye, 
  Edit3, 
  FileCode2,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  id?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type deliverable response, analysis findings, or code commentary here...',
  minHeight = '180px',
  id = 'rich-text-editor',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  // Sync internal contentEditable with incoming value when mounted or completely changed externally
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
      updateCounts(editorRef.current.innerText || '');
    }
  }, [value]);

  const updateCounts = (text: string) => {
    const trimmed = text.trim();
    setCharCount(trimmed.length);
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    setWordCount(words);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText || '';
      updateCounts(text);
      onChange(html);
    }
  };

  const executeCmd = (command: string, arg: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleInsertLink = () => {
    const url = prompt('Enter destination URL (e.g. https://github.com/...):', 'https://');
    if (url && url !== 'https://') {
      executeCmd('createLink', url);
    }
  };

  const handleInsertTemplate = (templateHtml: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertHTML', false, templateHtml);
    handleInput();
    setTemplateMenuOpen(false);
  };

  const templates = [
    {
      title: 'STAR Method Deliverable',
      description: 'Situation, Task, Action, and Business Results breakdown',
      html: `
        <h3>Executive Deliverable Summary (STAR Method)</h3>
        <p><strong>1. Situation & Context:</strong> Briefly state the operational problem or business dataset requirement addressed.</p>
        <p><strong>2. Task & Objective:</strong> Defined target deliverable criteria, success metrics, and expected standard.</p>
        <p><strong>3. Action & Execution:</strong></p>
        <ul>
          <li>Engineered primary calculation logic and data transformations.</li>
          <li>Configured validation rules and performance optimizations.</li>
          <li>Conducted cross-checks against edge-case anomalies.</li>
        </ul>
        <p><strong>4. Result & Business Takeaway:</strong> Delivered measurable improvement and actionable insights.</p>
      `,
    },
    {
      title: 'Data Analysis & Insights Report',
      description: 'Business KPIs, formula DAX/SQL snippets, and findings',
      html: `
        <h3>Data Analysis & Core Metric Deliverable</h3>
        <p><strong>Analysis Objective:</strong> Quantify core variances and deliver drill-down dashboards.</p>
        <p><strong>Key Metrics Implemented:</strong></p>
        <ul>
          <li><code>[Total Revenue YoY %] = DIVIDE([Revenue] - [Prev Year Revenue], [Prev Year Revenue], 0)</code></li>
          <li><code>[Variance Margin] = [Gross Profit] / [Net Revenue]</code></li>
        </ul>
        <p><strong>Three Primary Insights:</strong></p>
        <ol>
          <li>Identified high-margin cluster driving 68% of quarterly growth.</li>
          <li>Pinpointed regional inventory bottleneck creating 14-day fulfillment delays.</li>
          <li>Forecasted customer retention uplift following campaign optimization.</li>
        </ol>
      `,
    },
    {
      title: 'Technical Implementation Summary',
      description: 'Architecture decisions, scripts, and validation steps',
      html: `
        <h3>Technical Implementation & Architecture</h3>
        <p><strong>Components Implemented:</strong></p>
        <ul>
          <li><strong>Architecture:</strong> Modular design adhering to project specifications.</li>
          <li><strong>Data Schema:</strong> Star schema with normalized dimension tables and indexed foreign keys.</li>
          <li><strong>Testing & Verification:</strong> Unit tests and query execution plans verified without table scans.</li>
        </ul>
        <blockquote>Evidence verified: Output verified against production test criteria.</blockquote>
      `,
    },
  ];

  return (
    <div id={id} className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
      {/* Top Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-1.5 text-slate-700">
        <div className="flex flex-wrap items-center gap-1">
          {/* Format dropdown */}
          <select
            aria-label="Format Block"
            onChange={e => {
              executeCmd('formatBlock', e.target.value);
              e.target.value = 'p';
            }}
            className="text-xs bg-white border border-slate-200 rounded px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 cursor-pointer focus:outline-hidden"
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="blockquote">Quote Block</option>
          </select>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Text Styles */}
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onClick={() => executeCmd('bold')}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Italic (Ctrl+I)"
            onClick={() => executeCmd('italic')}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Underline (Ctrl+U)"
            onClick={() => executeCmd('underline')}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Strikethrough"
            onClick={() => executeCmd('strikeThrough')}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Lists */}
          <button
            type="button"
            title="Bullet List"
            onClick={() => executeCmd('insertUnorderedList')}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Numbered List"
            onClick={() => executeCmd('insertOrderedList')}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Blockquote"
            onClick={() => executeCmd('formatBlock', 'blockquote')}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Inline Code"
            onClick={() => {
              const sel = window.getSelection();
              if (sel && sel.toString()) {
                executeCmd('insertHTML', `<code>${sel.toString()}</code>`);
              } else {
                executeCmd('insertHTML', '<code>code_example</code>');
              }
            }}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Insert Link"
            onClick={handleInsertLink}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Clear Formatting"
            onClick={() => executeCmd('removeFormat')}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            title="Undo"
            onClick={() => executeCmd('undo')}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Redo"
            onClick={() => executeCmd('redo')}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right side: Templates & Preview Toggle */}
        <div className="flex items-center space-x-2">
          {/* Template Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-800 hover:bg-indigo-100 rounded-md border border-indigo-200/70 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Templates</span>
              <ChevronDown className="w-3 h-3 text-indigo-500" />
            </button>

            {templateMenuOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-30 animate-in fade-in slide-in-from-top-1 text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                  Deliverable Quick Templates
                </div>
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleInsertTemplate(tpl.html)}
                    className="w-full text-left p-2 rounded-lg hover:bg-indigo-50/70 transition-colors group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                      {tpl.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      {tpl.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Tab Toggle */}
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-md text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-2 py-0.5 rounded flex items-center space-x-1 font-semibold ${
                activeTab === 'edit'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2 py-0.5 rounded flex items-center space-x-1 font-semibold ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      {activeTab === 'edit' ? (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          role="textbox"
          aria-multiline="true"
          style={{ minHeight }}
          data-placeholder={placeholder}
          className="p-3.5 text-xs text-slate-800 focus:outline-hidden leading-relaxed prose prose-slate prose-xs max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
        />
      ) : (
        <div 
          style={{ minHeight }}
          className="p-3.5 text-xs text-slate-800 bg-slate-50/50 leading-relaxed overflow-y-auto"
        >
          {value && value.trim() ? (
            <div 
              className="prose prose-slate prose-xs max-w-none [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[11px]"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          ) : (
            <p className="text-slate-400 italic text-xs">No deliverable text entered yet. Switch back to "Write" to add content.</p>
          )}
        </div>
      )}

      {/* Bottom Status & Count Bar */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <div className="flex items-center space-x-2">
          <span>Rich Text Formatted Deliverable</span>
          <span>•</span>
          <span>HTML formatted response</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </div>
  );
};
