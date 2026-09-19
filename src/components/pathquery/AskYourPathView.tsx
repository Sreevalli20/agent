import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  ArrowRight, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Target, 
  FileText,
  RotateCcw
} from 'lucide-react';
import { LearnerState, PathConversationMessage } from '../../types';
import { answerPathQuery } from '../../services/evaluationEngine';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/api';

interface AskYourPathViewProps {
  state: LearnerState;
  onNavigate: (tab: string) => void;
}

export const AskYourPathView: React.FC<AskYourPathViewProps> = ({ state, onNavigate }) => {
  const [queryInput, setQueryInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const presetQuestions = [
    'What should I learn today?',
    'Why is Power BI a priority?',
    'What am I still missing for my target role?',
    'What should I practice next?',
    'What did I improve this week?',
    'What evidence do I still need?',
  ];

  const handleRunQuery = async (questionText: string) => {
    if (!questionText.trim()) return;

    setIsProcessing(true);
    const userMsg: PathConversationMessage = {
      id: 'query-' + Date.now(),
      learnerId: state.user.id,
      sender: 'learner',
      query: questionText,
      response: '',
      timestamp: new Date().toISOString(),
    };

    try {
      // Try to use API service
      const responseMsg = await apiService.askPathQuery(state.user.id, questionText);
      
      setIsProcessing(false);
      setQueryInput('');
    } catch (error) {
      // Fallback to localStorage
      console.warn('API call failed, using localStorage fallback:', error);
      
      setTimeout(() => {
        const responseMsg = answerPathQuery(state, questionText);
        const updatedConversations = [responseMsg, ...state.conversations];

        storageService.updateActiveState({
          ...state,
          conversations: updatedConversations,
        });

        setIsProcessing(false);
        setQueryInput('');
      }, 400);
    }
  };

  const handleClearHistory = () => {
    storageService.updateActiveState({
      ...state,
      conversations: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Contextual Path Advisor</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Ask Your Path
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Query your verified learning data, target standards, and current capability gaps in natural language. Every response is computed from your actual stored records.
          </p>
        </div>

        {state.conversations.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Query History</span>
          </button>
        )}
      </div>

      {/* Preset Common Questions Grid */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Standard Pathway Inquiries
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {presetQuestions.map(q => (
            <button
              key={q}
              id={`preset-query-${q.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => handleRunQuery(q)}
              disabled={isProcessing}
              className="p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-xs font-medium text-slate-800 flex items-center justify-between group"
            >
              <span className="group-hover:text-indigo-900 leading-snug">{q}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Query Input Box */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleRunQuery(queryInput);
          }}
          className="flex items-center space-x-2"
        >
          <input
            id="ask-path-query-input"
            type="text"
            placeholder="Ask about your requirements, priority rationale, or schedule (e.g., 'What should I learn today?')..."
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            disabled={isProcessing}
            className="grow px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
          />
          <button
            type="submit"
            id="ask-path-submit-query-btn"
            disabled={!queryInput.trim() || isProcessing}
            className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Submit Query</span>
          </button>
        </form>
      </div>

      {/* Query Responses Stream */}
      <div className="space-y-4">
        {state.conversations.length > 0 ? (
          state.conversations.map(conv => (
            <div
              key={conv.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              {/* Question */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                    Q
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{conv.query}</h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Stored Context Response */}
              <div className="space-y-3 pl-8 text-xs text-slate-700 leading-relaxed">
                <div className="whitespace-pre-line prose prose-slate max-w-none text-xs">
                  {conv.response}
                </div>

                {/* Direct Action Deep Link */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {conv.actionableTaskId && (
                    <button
                      onClick={() => onNavigate('plan')}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200"
                    >
                      <span>Jump to Scheduled Task in Plan</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={() => onNavigate('gap')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                  >
                    View in Gap Analysis
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No Inquiries Executed Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Select one of the standard pathway questions above or enter a custom query to evaluate your career trajectory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
