import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Cpu, 
  Calendar,
  LogOut
} from 'lucide-react';
import { authService, validatePasswordStrength } from '../../services/authService';

interface PasswordManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export const PasswordManagementModal: React.FC<PasswordManagementModalProps> = ({
  isOpen,
  onClose,
  onLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const session = authService.getCurrentSession();
  const passwordEvaluation = validatePasswordStrength(newPassword);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (!passwordEvaluation.isValid) {
      setStatusMessage({ type: 'error', text: passwordEvaluation.errors[0] });
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to update password.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8 text-left relative z-[10000] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Credential & Security Settings
              </span>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                Password & Access Management
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

        {/* Feedback Alert */}
        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Current Active Identity */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Authenticated Account:</span>
            <span className="font-bold text-slate-900">{session?.fullName || 'Active Learner'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Email Address:</span>
            <span className="font-mono text-slate-700">{session?.email || 'learner@domain.edu'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Career Focus:</span>
            <span className="font-semibold text-indigo-700">{session?.targetRole || 'Data Analyst'}</span>
          </div>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">
              Update Password
            </span>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-indigo-700 hover:text-indigo-900 font-semibold flex items-center space-x-1 text-[11px]"
            >
              {showPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showPasswords ? 'Hide characters' : 'Show characters'}</span>
            </button>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Current Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              New Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              placeholder="At least 8 chars, uppercase, lowercase, number"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
            />

            {/* Password strength bar */}
            {newPassword && (
              <div className="mt-1.5 space-y-1">
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
                <div className="text-[10px] text-slate-500">
                  Requirements: 8+ chars, uppercase, lowercase, digit/symbol
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Confirm New Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{isLoading ? 'Updating Hash...' : 'Update Password'}</span>
          </button>
        </form>

        {/* Cryptographic Proof & Security Standards */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-600">
          <div className="flex items-center space-x-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Credential Storage & Cryptographic Standard</span>
          </div>
          <p className="leading-relaxed">
            All user credentials are protected via standard Web Crypto PBKDF2 with HMAC-SHA256, 100,000 hashing iterations, and cryptographically random salts. Plaintext passwords are never persisted.
          </p>
        </div>

        {/* Footer & Sign Out */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              authService.logout();
              if (onLogout) onLogout();
              onClose();
            }}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Current Session</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
