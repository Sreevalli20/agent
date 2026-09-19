import React, { useState } from 'react';
import { 
  FolderCheck, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Link as LinkIcon, 
  Github, 
  Image as ImageIcon,
  ChevronRight,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { LearnerState, EvidenceRecord, EvidenceStatus } from '../../types';

interface EvidenceViewProps {
  state: LearnerState;
  onOpenSubmitModal: () => void;
  onNavigate: (tab: string) => void;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({
  state,
  onOpenSubmitModal,
  onNavigate,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);

  const filteredEvidence = state.evidenceHistory.filter(ev => {
    if (filterStatus === 'all') return true;
    return ev.status === filterStatus;
  });

  const getStatusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case 'Verified':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Needs improvement':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Submitted':
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'GitHub link':
        return Github;
      case 'Project link':
        return LinkIcon;
      case 'Screenshot':
        return ImageIcon;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Verifiable Artifact Repository</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Evidence Submissions & Audits
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Review all submitted project deliverables, verification feedbacks, and capability upgrade logs.
          </p>
        </div>

        <button
          id="evidence-submit-new-btn"
          onClick={onOpenSubmitModal}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Submit New Evidence</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Filter By Status:</span>
          {['all', 'Verified', 'Submitted', 'Needs improvement'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          {state.evidenceHistory.length} total recorded items
        </div>
      </div>

      {/* Evidence Items Grid/List */}
      <div className="space-y-4">
        {filteredEvidence.length > 0 ? (
          filteredEvidence.map(ev => {
            const Icon = getIconForType(ev.evidenceType);
            return (
              <div
                key={ev.id}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{ev.capability}</span>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500 font-medium">{ev.evidenceType}</span>
                      </div>
                      <div className="text-xs text-slate-600 font-semibold">{ev.taskTitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-slate-400">
                      {new Date(ev.date).toLocaleDateString()}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(ev.status)}`}>
                      {ev.status}
                    </span>
                  </div>
                </div>

                {/* Artifact reference */}
                {ev.evidenceType === 'Text response' && ev.submittedEvidence.includes('<') ? (
                  <div className="text-xs bg-slate-50/80 p-3.5 rounded-lg border border-slate-200 text-slate-800 leading-relaxed prose prose-slate prose-xs max-w-none [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-slate-900 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-400 [&_blockquote]:pl-2.5 [&_blockquote]:italic [&_code]:bg-slate-200 [&_code]:px-1 [&_code]:rounded [&_code]:font-mono">
                    <div dangerouslySetInnerHTML={{ __html: ev.submittedEvidence }} />
                  </div>
                ) : (
                  <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-slate-800 break-all">
                    {ev.submittedEvidence}
                  </div>
                )}

                {ev.summaryNotes && (
                  <div className="text-xs text-slate-700">
                    <strong className="text-slate-900">Notes:</strong> {ev.summaryNotes}
                  </div>
                )}

                {/* Structured Feedback & Next Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
                  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                      Verification Feedback
                    </span>
                    <p className="text-slate-700 leading-relaxed">{ev.feedback}</p>
                  </div>

                  <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block mb-1">
                      Next Step
                    </span>
                    <p className="text-slate-700 leading-relaxed">{ev.nextStep}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <FolderCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No Evidence Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Submit deliverables from the Execution Plan or click "Submit New Evidence" above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
