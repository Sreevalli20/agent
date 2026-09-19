import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { authService, validatePasswordStrength } from '../../services/authService';
import { STANDARD_CAREER_TARGETS } from '../../data/rolesData';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'reset';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTargetRole, setRegTargetRole] = useState('Data Analyst');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedCodeNotice, setGeneratedCodeNotice] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  // Status & error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const passwordEvaluation = validatePasswordStrength(regPassword);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.login(loginEmail, loginPassword);
      if (res.success) {
        setSuccessMessage('Successfully signed in.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 500);
      } else {
        setErrorMessage(res.error || 'Unable to authenticate.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!passwordEvaluation.isValid) {
      setErrorMessage(passwordEvaluation.errors[0]);
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.register(
        regEmail,
        regName,
        regPassword,
        regTargetRole
      );
      if (res.success) {
        setSuccessMessage('Account registered successfully! Signed in.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 600);
      } else {
        setErrorMessage(res.error || 'Failed to register account.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (email: string, role: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    const res = await authService.login(email, 'EduPath2026!');
    setIsLoading(false);
    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      // If password was changed or demo account needs seeding, use demo direct
      setLoginEmail(email);
      setLoginPassword('EduPath2026!');
    }
  };

  const handleRequestResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = authService.requestPasswordReset(resetEmail);
    if (res.success && res.code) {
      setGeneratedCodeNotice(res.code);
      setResetCode(res.code);
      setResetStep(2);
      setSuccessMessage('Password reset code generated.');
    } else {
      setErrorMessage(res.error || 'Email not found.');
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const res = await authService.resetPasswordWithCode(resetEmail, resetCode, newPassword);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage('Password reset successfully. You may now sign in.');
      setTimeout(() => {
        setMode('login');
        setLoginEmail(resetEmail);
        setResetStep(1);
        setGeneratedCodeNotice(null);
      }, 1200);
    } else {
      setErrorMessage(res.error || 'Failed to reset password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8 text-left">
        {/* Modal Top Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Security & Authentication
              </span>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {mode === 'login' ? 'Sign in to EduPath' : (mode === 'register' ? 'Create Learner Account' : 'Reset Account Password')}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        {mode !== 'reset' ? (
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                mode === 'login'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                mode === 'register'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className="text-indigo-700 hover:text-indigo-900 font-semibold"
            >
              ← Back to Sign In
            </button>
            <span className="text-slate-500 font-medium">Credential Recovery</span>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-login-email"
                  type="email"
                  required
                  placeholder="alex.chen@example.edu"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white text-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setResetEmail(loginEmail);
                    setErrorMessage(null);
                  }}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white text-slate-900 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="auth-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Logins Helper */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Fast Demo Profiles
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('alex.chen@example.edu', 'Data Analyst')}
                  className="p-2 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 rounded-lg text-left transition-colors group"
                >
                  <div className="font-bold text-slate-800 group-hover:text-indigo-900 text-xs">
                    Alex Chen
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Data Analyst Track
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('marcus.vance@example.edu', 'Cloud Engineer')}
                  className="p-2 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 rounded-lg text-left transition-colors group"
                >
                  <div className="font-bold text-slate-800 group-hover:text-indigo-900 text-xs">
                    Marcus Vance
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Cloud Engineer Track
                  </div>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Demo credentials default password: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-600">EduPath2026!</code>
              </p>
            </div>
          </form>
        )}

        {/* REGISTRATION FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-register-name"
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-register-email"
                  type="email"
                  required
                  placeholder="jordan.miller@domain.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Target Career Role
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={regTargetRole}
                  onChange={e => setRegTargetRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden text-slate-900 font-medium"
                >
                  {STANDARD_CAREER_TARGETS.map(t => (
                    <option key={t.id} value={t.title}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-register-password"
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 8 chars, mixed case, number"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Live Password Strength Meter */}
              {regPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500">Security Strength:</span>
                    <span className={`font-bold ${
                      passwordEvaluation.score <= 2 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {passwordEvaluation.score <= 1 ? 'Weak' : (passwordEvaluation.score <= 3 ? 'Medium' : 'Strong')}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all ${
                        passwordEvaluation.score <= 1
                          ? 'w-1/4 bg-rose-500'
                          : passwordEvaluation.score === 2
                          ? 'w-2/4 bg-amber-500'
                          : passwordEvaluation.score === 3
                          ? 'w-3/4 bg-blue-500'
                          : 'w-full bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-register-confirm-password"
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>Credentials encrypted using PBKDF2 Web Cryptography with SHA-256 and unique 16-byte random salts.</span>
            </div>

            <button
              id="auth-register-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating Account...' : 'Register & Start Plan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* PASSWORD RESET FLOW */}
        {mode === 'reset' && (
          <div className="space-y-4 text-xs">
            {resetStep === 1 ? (
              <form onSubmit={handleRequestResetCode} className="space-y-3">
                <p className="text-slate-600 leading-relaxed">
                  Enter your registered email address to receive a secure recovery code.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="alex.chen@example.edu"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Generate Reset Code</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmResetPassword} className="space-y-3">
                {generatedCodeNotice && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                    <span className="font-bold block text-xs mb-0.5">Verification Code Generated:</span>
                    <span className="font-mono text-base font-bold tracking-widest text-indigo-700 bg-white px-2 py-0.5 rounded border border-amber-200 inline-block">
                      {generatedCodeNotice}
                    </span>
                    <span className="block text-[11px] text-amber-700 mt-1">
                      (Code is auto-filled for immediate verification)
                    </span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    6-Digit Security Code
                  </label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold tracking-widest text-center text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? 'Updating Password...' : 'Save New Password & Log In'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
