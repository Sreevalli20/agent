import React from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Target, 
  SplitSquareVertical, 
  CalendarDays, 
  Award, 
  RefreshCw, 
  Compass,
  Layers,
  FileCheck,
  Briefcase
} from 'lucide-react';

interface LandingPageProps {
  onStartFlow: () => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFlow, onExploreDemo }) => {
  const steps = [
    {
      num: '01',
      title: 'Evidence-Based Profiling',
      desc: 'Upload your resume, verified certificates, and project documentation. Extract your current demonstrated baseline without guesswork.',
      icon: FileText,
    },
    {
      num: '02',
      title: 'Target Career Mapping',
      desc: 'Select your target role. View the complete industry competency benchmark, required depth, and business rationale.',
      icon: Target,
    },
    {
      num: '03',
      title: 'Prioritized Gap Analysis',
      desc: 'Contrast verified evidence directly against role requirements. Understand why each shortfall is classified as critical or developing.',
      icon: SplitSquareVertical,
    },
    {
      num: '04',
      title: '7-Day Execution Plan',
      desc: 'Convert high-priority gaps into structured daily practice activities, duration estimates, deliverables, and evidence criteria.',
      icon: CalendarDays,
    },
    {
      num: '05',
      title: 'Evidence Verification & Reassessment',
      desc: 'Submit project links, code, and screenshots. The system verifies your deliverable, updates capability maturity, and refines the plan.',
      icon: RefreshCw,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Banner Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 text-center border-b border-slate-800">
        <span className="font-semibold text-slate-100">Professional Learning Execution:</span> Evidence-driven career transition platform with continuous capability reassessment.
      </div>

      {/* Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">EduPath</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="landing-demo-btn"
              onClick={onExploreDemo}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Explore Sample Learner
            </button>
            <button
              id="landing-nav-start-btn"
              onClick={onStartFlow}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              Build My Career Path
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/80 mb-6">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Structured Career Competency Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 font-sans leading-[1.15]">
            Turn your current skills into your next career.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Understand what you already know. Discover what you are missing. Execute a focused path. Prove what you can do.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="landing-hero-primary-cta"
              onClick={onStartFlow}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 text-base font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-hidden focus:ring-4 focus:ring-indigo-200"
            >
              <span>Build My Career Path</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="landing-hero-secondary-cta"
              onClick={onExploreDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 text-base font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all focus:outline-hidden"
            >
              <span>Explore How It Works</span>
            </button>
          </div>

          {/* Core Principles */}
          <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900">Evidence Over Claims</div>
                <div className="text-xs text-slate-500">Every competency is backed by verifiable artifacts.</div>
              </div>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900">Role-Grounded Gaps</div>
                <div className="text-xs text-slate-500">Rigorous benchmarks based on industry job standards.</div>
              </div>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900">7-Day Execution</div>
                <div className="text-xs text-slate-500">Focused, deliverable-driven daily practice tasks.</div>
              </div>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900">Dynamic Reassessment</div>
                <div className="text-xs text-slate-500">Plans adjust immediately when new evidence is logged.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Architecture Loop */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              The Continuous Career Execution Loop
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              EduPath replaces speculative self-study with a structured cycle that turns verified practice into career qualification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.num}
                  className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {step.num}
                      </span>
                      <Icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>

                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Target Careers Supported */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Benchmark Standards for Target Roles
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Detailed competency maps detailing expected level, business reasons, and deliverable standards.
              </p>
            </div>
            <button
              onClick={onStartFlow}
              className="mt-4 md:mt-0 text-sm font-semibold text-indigo-700 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>View all 7 standard pathways</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                role: 'Data Analyst',
                essential: 'SQL, Power BI / Tableau, Python, Business Statistics',
                hours: '120 hours needed',
              },
              {
                role: 'Software Developer',
                essential: 'TypeScript, React Architecture, RESTful API, Database Systems',
                hours: '160 hours needed',
              },
              {
                role: 'Cloud Engineer',
                essential: 'Linux Shell, Terraform IaC, Docker Containers, Kubernetes',
                hours: '150 hours needed',
              },
              {
                role: 'Product Manager',
                essential: 'User Discovery, PRD Writing, North Star Metrics, Prioritization',
                hours: '110 hours needed',
              },
            ].map(item => (
              <div 
                key={item.role} 
                className="p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors bg-slate-50/50"
              >
                <div className="font-bold text-base text-slate-900 mb-1">{item.role}</div>
                <div className="text-xs font-semibold text-indigo-700 mb-3">{item.hours}</div>
                <div className="text-xs text-slate-500 mb-1 font-medium">Core Capabilities:</div>
                <div className="text-xs text-slate-700 leading-snug">{item.essential}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-100 text-sm">EduPath</span>
            <span className="text-slate-500">|</span>
            <span>Career Transition & Learning Execution Engine</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <span>Evidence-Based</span>
            <span>•</span>
            <span>Structured Verification</span>
            <span>•</span>
            <span>Dynamic Reassessment</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
