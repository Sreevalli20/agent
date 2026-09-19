import { AuthAccount, AuthSession } from '../types';
import { storageService } from './storageService';

const STORAGE_KEY_AUTH_ACCOUNTS = 'edupath_auth_accounts_v1';
const STORAGE_KEY_AUTH_SESSION = 'edupath_auth_session_v1';
const STORAGE_KEY_RESET_CODES = 'edupath_password_reset_codes_v1';

interface ResetCodeRecord {
  email: string;
  code: string;
  expiresAt: number;
}

type AuthListener = (session: AuthSession | null) => void;

// Cryptographic salting and hashing using native Web Crypto PBKDF2
async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateCryptoSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number; // 0 to 4
} {
  const errors: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    errors.push('Password must be at least 8 characters long');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Must contain at least one uppercase letter (A-Z)');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Must contain at least one lowercase letter (a-z)');
  }

  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    errors.push('Must contain at least one number (0-9) or special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
    score,
  };
}

class AuthService {
  private accounts: Map<string, AuthAccount> = new Map();
  private currentSession: AuthSession | null = null;
  private listeners: Set<AuthListener> = new Set();
  private resetCodes: Map<string, ResetCodeRecord> = new Map();

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH_ACCOUNTS);
      if (stored) {
        const parsed: AuthAccount[] = JSON.parse(stored);
        parsed.forEach(acc => this.accounts.set(acc.email.toLowerCase(), acc));
      } else {
        // Seed default verified test account for Alex Chen
        const salt = generateCryptoSalt();
        const passwordHash = await hashPasswordWithSalt('EduPath2026!', salt);
        const demoAccount: AuthAccount = {
          id: 'demo-learner-alex',
          email: 'alex.chen@example.edu',
          fullName: 'Alex Chen',
          passwordHash,
          salt,
          targetRole: 'Data Analyst',
          createdAt: '2026-09-12T10:00:00Z',
          lastLoginAt: new Date().toISOString(),
          passwordUpdatedAt: '2026-09-12T10:00:00Z',
        };
        this.accounts.set(demoAccount.email.toLowerCase(), demoAccount);
        this.saveAccounts();
      }

      const sessionStored = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
      if (sessionStored) {
        const session: AuthSession = JSON.parse(sessionStored);
        // Ensure session not older than 7 days
        if (Date.now() - session.loginTimestamp < 7 * 24 * 60 * 60 * 1000) {
          this.currentSession = session;
        } else {
          localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
        }
      }

      const storedCodes = localStorage.getItem(STORAGE_KEY_RESET_CODES);
      if (storedCodes) {
        const parsed: ResetCodeRecord[] = JSON.parse(storedCodes);
        parsed.forEach(r => {
          if (r.expiresAt > Date.now()) {
            this.resetCodes.set(r.email.toLowerCase(), r);
          }
        });
      }
    } catch (err) {
      console.warn('Auth initialization error:', err);
    }
  }

  private saveAccounts() {
    try {
      const arr = Array.from(this.accounts.values());
      localStorage.setItem(STORAGE_KEY_AUTH_ACCOUNTS, JSON.stringify(arr));
    } catch (err) {
      console.warn('Could not persist accounts:', err);
    }
  }

  private saveSession() {
    try {
      if (this.currentSession) {
        localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(this.currentSession));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
      }
    } catch (err) {
      console.warn('Could not persist session:', err);
    }
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.currentSession));
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentSession);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  public isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  public async register(
    email: string,
    fullName: string,
    password: string,
    targetRole: string = 'Data Analyst'
  ): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return { success: false, error: strength.errors[0] };
    }

    if (this.accounts.has(cleanEmail)) {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }

    const salt = generateCryptoSalt();
    const passwordHash = await hashPasswordWithSalt(password, salt);
    const userId = 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    const newAccount: AuthAccount = {
      id: userId,
      email: cleanEmail,
      fullName: cleanName,
      passwordHash,
      salt,
      targetRole,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      passwordUpdatedAt: new Date().toISOString(),
    };

    this.accounts.set(cleanEmail, newAccount);
    this.saveAccounts();

    // Initialize or register learner state in storageService
    storageService.createNewLearner(cleanName, cleanEmail, targetRole.toLowerCase().replace(/\s+/g, '-'));

    const session: AuthSession = {
      token: 'tok-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      userId: newAccount.id,
      email: newAccount.email,
      fullName: newAccount.fullName,
      targetRole: newAccount.targetRole,
      loginTimestamp: Date.now(),
    };

    this.currentSession = session;
    this.saveSession();
    this.notify();

    return { success: true, session };
  }

  public async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    const cleanEmail = email.trim().toLowerCase();

    const account = this.accounts.get(cleanEmail);
    if (!account) {
      return { success: false, error: 'Invalid email or password. Please check your credentials.' };
    }

    const testHash = await hashPasswordWithSalt(password, account.salt);
    if (testHash !== account.passwordHash) {
      return { success: false, error: 'Invalid email or password. Please check your credentials.' };
    }

    account.lastLoginAt = new Date().toISOString();
    this.saveAccounts();

    const session: AuthSession = {
      token: 'tok-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      userId: account.id,
      email: account.email,
      fullName: account.fullName,
      targetRole: account.targetRole,
      loginTimestamp: Date.now(),
    };

    this.currentSession = session;
    this.saveSession();

    // Check if storageService has this learner, or activate it
    const allLearners = storageService.getAllLearners();
    const matched = allLearners.find(l => l.id === account.id || l.name.toLowerCase() === account.fullName.toLowerCase());
    if (matched) {
      storageService.setActiveLearner(matched.id);
    } else {
      // Create their state if not existing
      storageService.createNewLearner(account.fullName, account.email, account.targetRole.toLowerCase().replace(/\s+/g, '-'));
    }

    this.notify();
    return { success: true, session };
  }

  public logout(): void {
    this.currentSession = null;
    this.saveSession();
    this.notify();
  }

  public async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.currentSession) {
      return { success: false, error: 'You must be logged in to change your password.' };
    }

    const account = this.accounts.get(this.currentSession.email.toLowerCase());
    if (!account) {
      return { success: false, error: 'Account not found.' };
    }

    const testHash = await hashPasswordWithSalt(currentPassword, account.salt);
    if (testHash !== account.passwordHash) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      return { success: false, error: strength.errors[0] };
    }

    if (currentPassword === newPassword) {
      return { success: false, error: 'New password cannot be identical to current password.' };
    }

    const newSalt = generateCryptoSalt();
    const newHash = await hashPasswordWithSalt(newPassword, newSalt);

    account.salt = newSalt;
    account.passwordHash = newHash;
    account.passwordUpdatedAt = new Date().toISOString();
    this.saveAccounts();

    return { success: true };
  }

  public requestPasswordReset(email: string): { success: boolean; code?: string; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const account = this.accounts.get(cleanEmail);

    if (!account) {
      return {
        success: false,
        error: 'No EduPath account was found with that email address.',
      };
    }

    // Generate a 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const record: ResetCodeRecord = {
      email: cleanEmail,
      code,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 min expiration
    };

    this.resetCodes.set(cleanEmail, record);
    localStorage.setItem(
      STORAGE_KEY_RESET_CODES,
      JSON.stringify(Array.from(this.resetCodes.values()))
    );

    return { success: true, code };
  }

  public async resetPasswordWithCode(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const record = this.resetCodes.get(cleanEmail);
    if (!record || record.expiresAt < Date.now()) {
      return {
        success: false,
        error: 'The reset verification code has expired or is invalid. Please request a new one.',
      };
    }

    if (record.code !== cleanCode) {
      return { success: false, error: 'Incorrect verification code. Please check and try again.' };
    }

    const account = this.accounts.get(cleanEmail);
    if (!account) {
      return { success: false, error: 'Account record not found.' };
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      return { success: false, error: strength.errors[0] };
    }

    const newSalt = generateCryptoSalt();
    const newHash = await hashPasswordWithSalt(newPassword, newSalt);

    account.salt = newSalt;
    account.passwordHash = newHash;
    account.passwordUpdatedAt = new Date().toISOString();
    this.saveAccounts();

    // Consume reset code
    this.resetCodes.delete(cleanEmail);
    localStorage.setItem(
      STORAGE_KEY_RESET_CODES,
      JSON.stringify(Array.from(this.resetCodes.values()))
    );

    return { success: true };
  }

  public getAccountDetails(): AuthAccount | null {
    if (!this.currentSession) return null;
    return this.accounts.get(this.currentSession.email.toLowerCase()) || null;
  }
}

export const authService = new AuthService();
