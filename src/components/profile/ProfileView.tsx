import React, { useState } from 'react';
import { 
  User, 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Plus, 
  X, 
  Sparkles, 
  Layers, 
  Briefcase, 
  Award,
  ChevronRight,
  RefreshCw,
  FolderUp,
  ShieldCheck,
  KeyRound,
  Lock,
  Tag
} from 'lucide-react';
import { LearnerState, ExperienceLevel, DocumentUpload, AuthSession } from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/api';
import { authService } from '../../services/authService';
import { buildSkillProfileFromInput, computeGapAnalysis, generateExecutionPlan } from '../../services/evaluationEngine';
import { STANDARD_CAREER_TARGETS } from '../../data/rolesData';
import { PasswordManagementModal } from '../auth/PasswordManagementModal';
import { AuthModal } from '../auth/AuthModal';

interface ProfileViewProps {
  state: LearnerState;
  onNavigate: (tab: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ state, onNavigate }) => {
  const [fullName, setFullName] = useState(state.profile.fullName || state.user.name);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(state.profile.experienceLevel || 'Entry');
  const [currentRole, setCurrentRole] = useState(state.profile.currentRole || '');
  const [careerGoal, setCareerGoal] = useState(state.profile.careerGoal || '');
  const [targetRole, setTargetRole] = useState(state.profile.targetRole || 'Data Analyst');
  const [weeklyHours, setWeeklyHours] = useState(state.profile.weeklyAvailableHours || 10);
  
  // Skills tags
  const [skillsList, setSkillsList] = useState<string[]>(() => {
    if (state.profile.initialSkillsText) {
      return state.profile.initialSkillsText.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
    }
    return ['SQL', 'Excel', 'Data Reporting', 'Communication'];
  });
  const [newSkillInput, setNewSkillInput] = useState('');

  // Documents
  const [documents, setDocuments] = useState<DocumentUpload[]>(state.documents);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<'Resume/CV' | 'Certificates' | 'Project descriptions' | 'Portfolio documents'>('Resume/CV');
  const [notification, setNotification] = useState<string | null>(null);

  // Authentication & Security modal state
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => authService.getCurrentSession());
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  React.useEffect(() => {
    return authService.subscribe(s => setAuthSession(s));
  }, []);

  const categorizedSuggestions = [
    { category: 'Technical', tags: ['SQL', 'Python', 'Power BI / Tableau', 'Data Modeling', 'Docker'] },
    { category: 'Soft Skills', tags: ['Executive Communication', 'Storytelling', 'Stakeholder Management'] },
    { category: 'Management', tags: ['Agile & Scrum', 'Project Delivery', 'Prioritization Frameworks'] },
  ];

  const handleAddSkill = () => {
    if (newSkillInput.trim() && !skillsList.includes(newSkillInput.trim())) {
      setSkillsList([...skillsList, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove));
  };

  const handleSimulatedFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0];

    // Simulate reading and processing
    setTimeout(async () => {
      let inferredSkills: string[] = ['Documentation', 'Applied Case'];
      if (file.name.toLowerCase().includes('sql')) {
        inferredSkills = ['SQL & Relational Querying', 'Database Modeling'];
      } else if (file.name.toLowerCase().includes('python') || file.name.toLowerCase().includes('data')) {
        inferredSkills = ['Python Data Analysis (pandas/numpy)', 'Exploratory Analysis'];
      } else if (file.name.toLowerCase().includes('resume') || file.name.toLowerCase().includes('cv')) {
        inferredSkills = ['Executive Communication & Storytelling', 'SQL & Relational Querying', 'Operations Analysis'];
      } else if (file.name.toLowerCase().includes('cert')) {
        inferredSkills = ['SQL & Relational Querying', 'Verified Standard'];
      }

      const newDoc: DocumentUpload = {
        id: 'doc-' + Date.now(),
        learnerId: state.user.id,
        filename: file.name,
        fileType: file.type || 'application/pdf',
        sizeBytes: file.size || 215000,
        uploadDate: new Date().toISOString(),
        status: 'Verified',
        extractedSkills: inferredSkills,
        notes: `Processed under ${uploadCategory}. Extracted ${inferredSkills.length} capability indicators.`,
      };

      try {
        // Try to use API service
        await apiService.uploadDocument(state.user.id, newDoc);
        const updatedDocs = await apiService.getDocuments(state.user.id);
        setDocuments(updatedDocs);
      } catch (error) {
        // Fallback to localStorage
        console.warn('API call failed, using localStorage fallback:', error);
        const updatedDocs = [newDoc, ...documents];
        setDocuments(updatedDocs);
      }

      setIsUploading(false);
      setNotification(`Successfully processed "${file.name}" with extracted competencies.`);
      setTimeout(() => setNotification(null), 4000);
    }, 600);
  };

  const handleLoadSampleDocuments = () => {
    const sampleDocs: DocumentUpload[] = [
      {
        id: 'doc-sample-1',
        learnerId: state.user.id,
        filename: 'Professional_Career_Resume.pdf',
        fileType: 'application/pdf',
        sizeBytes: 284000,
        uploadDate: new Date().toISOString(),
        status: 'Verified',
        extractedSkills: ['SQL & Relational Querying', 'Executive Communication & Storytelling', 'Reporting'],
        notes: 'Verified professional experience artifact.',
      },
      {
        id: 'doc-sample-2',
        learnerId: state.user.id,
        filename: 'Advanced_SQL_Specialization_Certificate.pdf',
        fileType: 'application/pdf',
        sizeBytes: 198000,
        uploadDate: new Date().toISOString(),
        status: 'Verified',
        extractedSkills: ['SQL & Relational Querying', 'Data Modeling & ETL Pipelines'],
        notes: 'Accredited database querying credential.',
      },
      {
        id: 'doc-sample-3',
        learnerId: state.user.id,
        filename: 'Sales_Performance_Portfolio_Project.pdf',
        fileType: 'application/pdf',
        sizeBytes: 420000,
        uploadDate: new Date().toISOString(),
        status: 'Processed',
        extractedSkills: ['Business Statistics & Hypothesis Testing', 'Power BI / Tableau Dashboarding'],
        notes: 'Project deliverable analysis report.',
      },
    ];

    setDocuments(sampleDocs);
    setNotification('Loaded 3 realistic sample documents for verification.');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRemoveDoc = async (id: string) => {
    try {
      await apiService.deleteDocument(state.user.id, id);
      const updatedDocs = await apiService.getDocuments(state.user.id);
      setDocuments(updatedDocs);
    } catch (error) {
      console.warn('API call failed, using localStorage fallback:', error);
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  const handleBuildSkillProfile = async () => {
    // 1. Update profile
    const updatedProfile = {
      ...state.profile,
      fullName,
      experienceLevel,
      currentRole,
      careerGoal,
      targetRole,
      weeklyAvailableHours: Number(weeklyHours),
      initialSkillsText: skillsList.join(', '),
      updatedAt: new Date().toISOString(),
    };

    // Find matched role ID
    const matchedTarget = STANDARD_CAREER_TARGETS.find(
      t => t.title.toLowerCase() === targetRole.toLowerCase() || t.id === targetRole.toLowerCase().replace(/\s+/g, '-')
    );
    const targetRoleId = matchedTarget ? matchedTarget.id : (state.selectedTargetId || 'data-analyst');

    try {
      // Try to use API service first
      await apiService.updateProfile(state.user.id, updatedProfile);
      
      // 2. Build skill profile using API
      const generatedSkills = await apiService.analyzeProfile(state.user.id, targetRoleId);

      // 3. Generate gap analysis using API
      const generatedGaps = await apiService.computeGaps(state.user.id, targetRoleId);

      // 4. Generate execution plan using API
      const generatedPlan = await apiService.generatePlan(state.user.id, targetRoleId);

      // 5. Update state from API
      const updatedState = await apiService.getLearnerState(state.user.id);
      
      setNotification('Skill Profile, Gap Analysis, and 7-Day Plan successfully generated!');
      setTimeout(() => {
        onNavigate('skills');
      }, 1000);
    } catch (error) {
      // Fallback to localStorage if API fails
      console.warn('API call failed, using localStorage fallback:', error);
      
      // 2. Build skill profile
      const generatedSkills = buildSkillProfileFromInput(updatedProfile, documents, targetRoleId);

      // 3. Generate gap analysis
      const generatedGaps = computeGapAnalysis(generatedSkills, targetRoleId);

      // 4. Generate execution plan
      const generatedPlan = generateExecutionPlan(generatedGaps, state.user.id, targetRoleId);

      // 5. Update state
      const updatedState: LearnerState = {
        ...state,
        user: {
          ...state.user,
          name: fullName,
        },
        profile: updatedProfile,
        documents,
        skills: generatedSkills,
        selectedTargetId: targetRoleId,
        gaps: generatedGaps,
        planTasks: generatedPlan,
        progress: {
          ...state.progress,
          remainingGaps: generatedGaps.filter(g => g.gap !== 'None').length,
          totalActivities: generatedPlan.length,
          capabilitiesNeedingEvidence: generatedGaps.filter(g => g.priority === 'Critical' || g.priority === 'High').map(g => g.capability),
          weeklyTargetHours: Number(weeklyHours),
        }
      };

      storageService.updateActiveState(updatedState);
      setNotification('Skill Profile, Gap Analysis, and 7-Day Plan successfully generated!');
      setTimeout(() => {
        onNavigate('skills');
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Learner Profile Builder</h1>
          <p className="text-sm text-slate-600 mt-1">
            Specify your professional background, active skills, and target career. Attach supporting documentation to extract verified capability evidence.
          </p>
        </div>

        <button
          id="profile-view-skills-nav-btn"
          onClick={() => onNavigate('skills')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors shrink-0"
        >
          <span>View Current Capability Matrix</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Learner Details & Goals</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name
                </label>
                <input
                  id="profile-full-name-input"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  placeholder="e.g. Alex Chen"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Experience Level
                </label>
                <select
                  id="profile-exp-level-select"
                  value={experienceLevel}
                  onChange={e => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="Entry">Entry Level (&lt; 2 yrs)</option>
                  <option value="Mid-Level">Mid-Level (2-5 yrs)</option>
                  <option value="Senior">Senior Level (5+ yrs)</option>
                  <option value="Career Switcher">Career Switcher</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Current Role
                </label>
                <input
                  id="profile-current-role-input"
                  type="text"
                  value={currentRole}
                  onChange={e => setCurrentRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  placeholder="e.g. Operations Specialist"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Target Role
                </label>
                <select
                  id="profile-target-role-select"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-indigo-900"
                >
                  {STANDARD_CAREER_TARGETS.map(t => (
                    <option key={t.id} value={t.title}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Career Goal Statement
              </label>
              <textarea
                id="profile-career-goal-input"
                rows={2}
                value={careerGoal}
                onChange={e => setCareerGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                placeholder="What specific outcome or career milestone are you working toward?"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Weekly Available Learning Hours: <span className="text-indigo-700 font-bold">{weeklyHours} hours/week</span>
              </label>
              <input
                id="profile-weekly-hours-slider"
                type="range"
                min="4"
                max="40"
                step="2"
                value={weeklyHours}
                onChange={e => setWeeklyHours(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Part-time (4h)</span>
                <span>Balanced (12h)</span>
                <span>Intensive (20h+)</span>
                <span>Full-time (40h)</span>
              </div>
            </div>

            {/* Current Skills Tags Management */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Current Demonstrated Skills (Multiple entries allowed)
              </label>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {skillsList.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium border border-slate-200"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  id="profile-new-skill-input"
                  type="text"
                  value={newSkillInput}
                  onChange={e => setNewSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="grow px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  placeholder="Type a skill and press Enter or Add (e.g. SQL, Tableau, Python, Git)..."
                />
                <button
                  type="button"
                  id="profile-add-skill-btn"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Skill
                </button>
              </div>

              {/* Categorized Quick Tag Suggestions */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>Suggested Categorized Tags (click to add):</span>
                </div>
                <div className="space-y-1.5">
                  {categorizedSuggestions.map(group => (
                    <div key={group.category} className="flex items-center flex-wrap gap-1.5 text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        group.category === 'Technical' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : (group.category === 'Soft Skills'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-purple-50 text-purple-700 border border-purple-200/60')
                      }`}>
                        {group.category}
                      </span>
                      {group.tags.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            if (!skillsList.includes(t)) {
                              setSkillsList([...skillsList, t]);
                            }
                          }}
                          disabled={skillsList.includes(t)}
                          className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-colors ${
                            skillsList.includes(t)
                              ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
                              : 'bg-white text-slate-700 hover:text-indigo-700 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          + {t}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Account & Password Security Card */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <h3 className="text-sm font-bold text-slate-900">Credential & Access Security</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                PBKDF2 SHA-256
              </span>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              {authSession ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 block">{authSession.fullName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{authSession.email}</span>
                    </div>
                    <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Authenticated</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Manage Password & Credentials</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-slate-500">
                    Register or sign in with your learner account to ensure persistent encryption and multi-device synchronization.
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="flex-1 py-2 px-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg transition-colors text-center"
                    >
                      Sign In / Register
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400">
              Passwords hashed using native PBKDF2 Web Cryptography (100,000 iterations, 16-byte random salts).
            </div>
          </div>
        </div>

        {/* Right Column: Supporting Documents Upload Engine */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Supporting Documents</span>
              </h2>
              <button
                type="button"
                id="profile-load-samples-btn"
                onClick={handleLoadSampleDocuments}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
              >
                Load Sample Docs
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Upload documents to ground your capability profile in verifiable evidence:
            </p>

            {/* Document category selector */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              {[
                'Resume/CV',
                'Certificates',
                'Project descriptions',
                'Portfolio documents',
              ].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setUploadCategory(cat as any)}
                  className={`px-2.5 py-1.5 rounded-lg border text-left truncate transition-colors ${
                    uploadCategory === cat
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Upload Dropzone */}
            <label className="block border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/60 group">
              <input
                id="profile-doc-upload-input"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleSimulatedFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <FolderUp className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
              <div className="text-xs font-semibold text-slate-800">
                {isUploading ? 'Processing document competencies...' : `Upload ${uploadCategory} (PDF, DOCX, TXT)`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Drag and drop file or click to browse
              </div>
            </label>

            {/* Uploaded Documents List */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Uploaded Artifacts ({documents.length})
              </div>

              {documents.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 truncate">
                        <div className="font-semibold text-slate-800 truncate flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{doc.filename}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                          <span>{doc.fileType.replace('application/', '')}</span>
                          <span>•</span>
                          <span>{(doc.sizeBytes / 1024).toFixed(0)} KB</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">{doc.status}</span>
                        </div>
                        {doc.extractedSkills.length > 0 && (
                          <div className="text-[10px] text-slate-600 line-clamp-1">
                            Skills: {doc.extractedSkills.join(', ')}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                        title="Remove document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 border border-slate-100 rounded-lg">
                  No documents attached. You can click "Load Sample Docs" above to test immediately.
                </div>
              )}
            </div>
          </div>

          {/* PRIMARY ACTION BUTTON: Build My Skill Profile */}
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-5 space-y-3">
            <div className="text-xs text-indigo-950 font-medium leading-relaxed">
              Evaluating your current inputs and documents will generate your evidence-based skill profile, compare requirements against <strong>{targetRole}</strong>, and construct your 7-day plan.
            </div>

            <button
              id="profile-build-skill-profile-btn"
              onClick={handleBuildSkillProfile}
              className="w-full py-3.5 px-5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 focus:outline-hidden"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Build My Skill Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode="login"
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* Password Management Modal */}
      {isPasswordModalOpen && (
        <PasswordManagementModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}
    </div>
  );
};
