import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Link, 
  Github, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { LearnerState, PlanTask, EvidenceType } from '../../types';
import { submitAndReassessEvidence } from '../../services/evaluationEngine';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/api';
import { RichTextEditor } from '../common/RichTextEditor';

interface EvidenceSubmissionModalProps {
  state: LearnerState;
  task?: PlanTask | null;
  onClose: () => void;
  onSubmittedSuccess?: () => void;
}

export const EvidenceSubmissionModal: React.FC<EvidenceSubmissionModalProps> = ({
  state,
  task,
  onClose,
  onSubmittedSuccess,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    task ? task.id : (state.planTasks[0]?.id || '')
  );
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('GitHub link');
  const [evidenceInput, setEvidenceInput] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');
  const [simulatedAttachment, setSimulatedAttachment] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultAssessment, setResultAssessment] = useState<any | null>(null);

  const activeTask = state.planTasks.find(t => t.id === selectedTaskId) || task || state.planTasks[0];

  const handleSampleFill = () => {
    if (evidenceType === 'GitHub link') {
      setEvidenceInput('https://github.com/alexchen-data/retail-analytics/blob/main/powerbi_dashboard.pbix');
      setSummaryNotes('Completed interactive retail sales dashboard with YoY growth DAX metrics and regional drill-down filters.');
      setSimulatedAttachment('powerbi_retail_sales.pbix');
    } else if (evidenceType === 'Screenshot') {
      setEvidenceInput('Dashboard screenshot showing executive KPI grid, 3-year revenue trend, and regional profit variance.');
      setSummaryNotes('Implemented DAX calculate measures: [Total Revenue YTD], [YoY Growth %], and [Unit Margin].');
      setSimulatedAttachment('powerbi_executive_view.png');
    } else if (evidenceType === 'Project link') {
      setEvidenceInput('https://app.powerbi.com/view?r=eyJrIjoiMDY2OWU1ODEtNTk2OS00Zjk3LWJiMTAtNzY2OTY1Njc4NGJhIiwidCI6IjQ5OGJkNTQ5LWJiNWMtNDc0Yy05ZjE3LTk5');
      setSummaryNotes('Live interactive dashboard deployment verified against dataset requirements.');
    } else {
      setEvidenceInput('<h3>Executive Deliverable & Findings Analysis</h3><p><strong>Deliverable Context:</strong> Built comprehensive performance analysis model resolving regional inventory variances.</p><p><strong>Key Insights & Evidence:</strong></p><ul><li><strong>West Region:</strong> Demonstrated <em>+18.4% YoY</em> margin expansion following logistics optimization.</li><li><strong>Product Category B:</strong> Return rate dropped from <em>8.2% to 2.1%</em> after packaging redesign.</li><li><strong>Pricing Elasticity:</strong> Promotional discounting preserved net contribution margin above <em>24%</em>.</li></ul><blockquote>Verification Criteria: Metrics cross-validated against warehouse shipment reconciliation data.</blockquote>');
      setSummaryNotes('Structured written deliverable formatted with headings, bold takeaways, and bulleted performance indicators.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSimulatedAttachment(file.name);
      if (!evidenceInput) {
        setEvidenceInput(`Uploaded file: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceInput.trim() && !simulatedAttachment) return;

    setIsSubmitting(true);

    try {
      // Try to use API service
      const result = await apiService.submitEvidence(
        state.user.id,
        selectedTaskId,
        evidenceType,
        evidenceInput,
        summaryNotes,
        simulatedAttachment || undefined
      );

      setIsSubmitting(false);
      setResultAssessment(result.assessment);

      if (onSubmittedSuccess) {
        onSubmittedSuccess();
      }
    } catch (error) {
      // Fallback to localStorage
      console.warn('API call failed, using localStorage fallback:', error);
      
      setTimeout(() => {
        const { updatedState, assessment, feedback } = submitAndReassessEvidence(
          state,
          selectedTaskId,
          evidenceType,
          evidenceInput,
          summaryNotes,
          simulatedAttachment || undefined
        );

        storageService.updateActiveState(updatedState);
        setIsSubmitting(false);
        setResultAssessment(assessment);

        if (onSubmittedSuccess) {
          onSubmittedSuccess();
        }
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8 relative z-[10000] max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Deliverable Verification
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Submit Capability Evidence</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If assessment result is ready, show reassessment summary */}
        {resultAssessment ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Evidence Verified & Capability Reassessed!</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                {resultAssessment.actionSummary}
              </p>
            </div>

            {/* Reassessment Before / After Comparison */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                  Previous Capability State:
                </span>
                <div className="text-slate-700 font-bold mt-1">
                  {resultAssessment.previousStrength} ({resultAssessment.previousLevel})
                </div>
              </div>
              <div>
                <span className="text-indigo-700 font-semibold block uppercase tracking-wider text-[10px]">
                  Reassessed Capability State:
                </span>
                <div className="text-emerald-700 font-bold mt-1 text-sm flex items-center space-x-1">
                  <span>{resultAssessment.newStrength} ({resultAssessment.newLevel})</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
                </div>
              </div>
            </div>

            {/* Reassessment Insights: Demonstrated & Still Missing */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-800 block mb-1">Capabilities Demonstrated:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                  {resultAssessment.demonstratedCapabilities.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {resultAssessment.capabilitiesStillMissing.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Capabilities Still Missing for Target Standard:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                    {resultAssessment.capabilitiesStillMissing.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-indigo-950">
                <span className="font-bold block mb-0.5">Recommended Next Practice:</span>
                <div>{resultAssessment.recommendedNextPractice}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl"
              >
                Done & Return to Workspace
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Associated Execution Task
              </label>
              <select
                value={selectedTaskId}
                onChange={e => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-hidden"
              >
                {state.planTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    Day {t.day}: {t.capability} - {t.learningObjective} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Task Requirement Banner */}
            {activeTask && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">
                  Target Deliverable: <span className="font-normal text-slate-600">{activeTask.deliverable}</span>
                </div>
                <div className="text-slate-500">
                  Evidence Requirement: {activeTask.evidenceRequirement}
                </div>
              </div>
            )}

            {/* Evidence Type Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Evidence Type
                </label>
                <button
                  type="button"
                  onClick={handleSampleFill}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
                >
                  Fill Realistic Sample Deliverable
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { type: 'GitHub link', icon: Github },
                  { type: 'File upload', icon: Upload },
                  { type: 'Project link', icon: Link },
                  { type: 'Screenshot', icon: ImageIcon },
                  { type: 'Text response', icon: FileText },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setEvidenceType(item.type as EvidenceType)}
                      className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center space-y-1 transition-colors text-xs ${
                        evidenceType === item.type
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-indigo-600" />
                      <span className="truncate w-full text-[11px]">{item.type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Input based on evidence type */}
            {evidenceType === 'File upload' || evidenceType === 'Screenshot' ? (
              <div className="space-y-2">
                <label className="block border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-slate-700 block">
                    {simulatedAttachment ? `Selected: ${simulatedAttachment}` : 'Click to select project file or screenshot'}
                  </span>
                  <span className="text-[11px] text-slate-400">PBIX, SQL, IPYNB, PNG, PDF</span>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Artifact Notes / Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief description of deliverable content..."
                    value={evidenceInput}
                    onChange={e => setEvidenceInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {evidenceType === 'GitHub link' ? 'GitHub Repository / File URL' : (evidenceType === 'Project link' ? 'Published Project / Dashboard URL' : 'Written Deliverable Response')}
                </label>
                {evidenceType === 'Text response' ? (
                  <div className="space-y-1.5">
                    <RichTextEditor
                      id="evidence-submission-rich-editor"
                      value={evidenceInput}
                      onChange={setEvidenceInput}
                      placeholder="Write your solution, analysis findings, business insights, or methodology using rich formatting..."
                      minHeight="170px"
                    />
                  </div>
                ) : (
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={evidenceInput}
                    onChange={e => setEvidenceInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                )}
              </div>
            )}

            {/* Summary notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deliverable Highlights & Three Key Insights (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Detail specific measures implemented, results achieved, or executive takeaways..."
                value={summaryNotes}
                onChange={e => setSummaryNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
              />
            </div>

            {/* Footer buttons */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="modal-submit-evidence-confirm-btn"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Deliverable...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit & Reassess Capability</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
