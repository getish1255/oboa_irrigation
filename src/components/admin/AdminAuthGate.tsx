/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import oromiaLogo from '../../assets/logo.png';
import { fetchServerAdminPassword, saveServerAdminPassword } from '../../services/campaignStorageService';
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  LogOut,
  Send,
  UserCheck,
} from 'lucide-react';

interface AdminAuthGateProps {
  children: React.ReactNode;
  lang: Language;
}

type AuthMode = 'login' | 'forgot_request' | 'forgot_verify' | 'forgot_new_password';

const AUTH_STORAGE_KEY = 'oromia_boa_admin_session_auth';
const PASSWORD_STORAGE_KEY = 'oromia_boa_admin_pwd_hash';
const DEFAULT_AUTHORIZED_EMAIL = 'oboa2026@gmail.com';
const INITIAL_DEFAULT_PASSWORD = 'Oboa@1255';

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ children, lang }) => {
  const isOromo = lang === 'om';

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [mode, setMode] = useState<AuthMode>('login');

  // Login Form Fields
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Recovery Form Fields
  const [recoveryEmailInput, setRecoveryEmailInput] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [simulatedEmailSent, setSimulatedEmailSent] = useState(false);

  // Sync custom password from server on mount
  useEffect(() => {
    fetchServerAdminPassword().then((pwd) => {
      if (pwd) {
        try {
          localStorage.setItem(PASSWORD_STORAGE_KEY, pwd);
        } catch (err) {
          console.warn('Could not write server password to localStorage', err);
        }
      }
    });
  }, []);

  // Helper to get active password
  const getCurrentPassword = (): string => {
    try {
      return localStorage.getItem(PASSWORD_STORAGE_KEY) || INITIAL_DEFAULT_PASSWORD;
    } catch {
      return INITIAL_DEFAULT_PASSWORD;
    }
  };

  // Handle Login Submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const enteredUsername = usernameInput.trim().toLowerCase();
    const enteredPassword = passwordInput;
    const currentPassword = getCurrentPassword();

    if (!enteredUsername || !enteredPassword) {
      setErrorMessage(
        isOromo
          ? 'Maaloo maqaa fayyadamaa fi jecha darbii guutaa.'
          : 'Please enter both administrative username and password.'
      );
      return;
    }

    if (enteredUsername === DEFAULT_AUTHORIZED_EMAIL.toLowerCase() && enteredPassword === currentPassword) {
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      } catch (err) {
        console.warn('Could not persist session to sessionStorage', err);
      }
      setIsAuthenticated(true);
      setErrorMessage(null);
    } else {
      setErrorMessage(
        isOromo
          ? 'Maqaan fayyadamaa ykn jechi darbii sirrii miti. Maaloo irra-deebi\'aa yaalaa.'
          : 'Invalid username or password. Please verify your credentials or use the recovery flow.'
      );
    }
  };

  // Step 1: Send Recovery Code to oboa2026@gmail.com
  const handleRequestRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const enteredEmail = recoveryEmailInput.trim().toLowerCase();

    if (!enteredEmail) {
      setErrorMessage(
        isOromo
          ? 'Maaloo teessoo imeelii mirkaneeffamee galchaa.'
          : 'Please enter the registered administrative recovery email address.'
      );
      return;
    }

    // Strictly enforce recovery only to oboa2026@gmail.com
    if (enteredEmail !== DEFAULT_AUTHORIZED_EMAIL.toLowerCase()) {
      setErrorMessage(
        isOromo
          ? `Imeeliin kun hin heyyamamne. Imeelii bulchiinsaa galmaa'e qofatu deebisiisa fudhata.`
          : `Unauthorized recovery address. Reset codes can only be requested by the designated administrator email (${DEFAULT_AUTHORIZED_EMAIL}).`
      );
      return;
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setSimulatedEmailSent(true);
    setMode('forgot_verify');
    setSuccessMessage(
      isOromo
        ? `Koodiin mirkaneessaa 6 gara ${DEFAULT_AUTHORIZED_EMAIL} ergameera. Saanduqa keessan ilaalaa.`
        : `A 6-digit security verification code has been dispatched to ${DEFAULT_AUTHORIZED_EMAIL}.`
    );
  };

  // Step 2: Verify Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (verificationCodeInput.trim() !== generatedCode) {
      setErrorMessage(
        isOromo
          ? 'Koodiin mirkaneessaa sirrii miti. Maaloo koodii saanduqa imeelii keessanitti ergame galchaa.'
          : 'Invalid verification code. Please check the 6-digit security code sent to the email.'
      );
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(
      isOromo
        ? 'Koodiin mirkanaa\'eera. Amma jecha darbii haaraa galchuu dandeessu.'
        : 'Security code verified successfully. Please enter your new administrative password.'
    );
    setMode('forgot_new_password');
  };

  // Step 3: Set New Password & Log In
  const handleSetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPasswordInput.length < 6) {
      setErrorMessage(
        isOromo
          ? 'Jechi darbii haaraan yoo xiqqaate qubee fi lakkoofsa 6 qabaachuu qaba.'
          : 'New password must be at least 6 characters long.'
      );
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setErrorMessage(
        isOromo
          ? 'Jechoonni darbii lamaan wal hin simne. Maaloo irra-deebi\'aa mirkaneeffadhaa.'
          : 'Passwords do not match. Please ensure both fields are identical.'
      );
      return;
    }

    try {
      localStorage.setItem(PASSWORD_STORAGE_KEY, newPasswordInput);
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      saveServerAdminPassword(newPasswordInput).catch((e) => console.warn('Could not sync password to server:', e));
    } catch (err) {
      console.warn('Could not save new password to localStorage', err);
    }

    setIsAuthenticated(true);
    setMode('login');
    setUsernameInput('');
    setPasswordInput('');
    setErrorMessage(null);
  };

  // Handle Log Out
  const handleLogout = () => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not remove auth session', err);
    }
    setIsAuthenticated(false);
    setMode('login');
    setUsernameInput('');
    setPasswordInput('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // If authenticated, render children with top authorized admin session bar
  if (isAuthenticated) {
    return (
      <div className="space-y-4">
        {/* Persistent Admin Session Header Bar */}
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100 tracking-wide">
                  {isOromo ? 'Eeyyama Bulchiinsaa Hojiirra Jira' : 'Authorized Administrator Session'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isOromo ? 'Mirkanaa\'aa' : 'Active'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {DEFAULT_AUTHORIZED_EMAIL}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 hidden md:inline">
              {isOromo ? 'Ittifayyadama: Karoora & Ragaa Kobo' : 'Scope: Plan Insertion & Kobo Sync'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-200 border border-slate-700 hover:border-rose-700/50 transition-colors cursor-pointer"
              title="End administrative session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isOromo ? 'Ba\'i (Logout)' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

        {/* Protected Admin Content */}
        {children}
      </div>
    );
  }

  // Not Authenticated: Render Authentication & Recovery Screen
  return (
    <div className="min-h-[600px] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-emerald-800 via-slate-900 to-slate-950 p-6 text-white text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-2 bg-white/95 rounded-xl shadow-md mb-3">
              <img
                src={oromiaLogo}
                alt="Oromia Bureau of Agriculture"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            <div className="text-[10px] tracking-wider font-mono text-emerald-300 font-semibold uppercase">
              BIIROO QONNAA OROMIYAA
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1">
              {isOromo ? 'Seensa Bulchiinsa & Kobo' : 'Admin & Kobo Portal'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              {isOromo
                ? 'Karaan kun ogeeyyii fi hooggantoota karooraa qofaaf kan eeyyamameedha.'
                : 'Restricted administrative access for campaign coordinators & data managers.'}
            </p>
          </div>
        </div>

        {/* Alerts / Error & Success banners */}
        <div className="p-6 pt-4 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Simulated Email Dispatch Alert (so admin sees the sent code) */}
          {simulatedEmailSent && generatedCode && (mode === 'forgot_verify' || mode === 'forgot_new_password') && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <Mail className="w-3.5 h-3.5" />
                  {isOromo ? 'Imeelii Ergame (oboa2026@gmail.com)' : 'Dispatched Security Code (oboa2026@gmail.com)'}
                </span>
                <span className="text-[10px] bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">
                  ONE-TIME CODE
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {isOromo
                  ? `Koodiin mirkaneessaa deebisii jecha darbii keessanii:`
                  : `Administrative reset code for account recovery:`}{' '}
                <strong className="font-mono text-sm tracking-widest bg-amber-200/80 dark:bg-amber-900/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 ml-1">
                  {generatedCode}
                </strong>
              </p>
              <button
                type="button"
                onClick={() => setVerificationCodeInput(generatedCode)}
                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {isOromo ? 'Koodii kana guuti (Auto-fill)' : 'Auto-fill this code into field'}
              </button>
            </div>
          )}

          {/* MODE 1: STANDARD LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Imeelii / Maqaa Fayyadamaa' : 'Administrator Email / Username'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder={isOromo ? 'Imeelii galchaa...' : 'Enter administrative email or username'}
                    autoComplete="username"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isOromo ? 'Jecha Darbii' : 'Administrative Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_request');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {isOromo ? 'Jecha darbii dagattee?' : 'Forgot credentials?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={isOromo ? 'Jecha darbii galchaa...' : 'Enter secure password'}
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{isOromo ? 'Seeni (Sign In)' : 'Sign In to Admin Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* MODE 2: REQUEST PASSWORD RESET VIA oboa2026@gmail.com */}
          {mode === 'forgot_request' && (
            <form onSubmit={handleRequestRecoveryCode} className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {isOromo
                  ? 'Imeelii bulchiinsaa galmaa\'e galchuun koodii mirkaneessaa argadhaa. Imeelii eeyyamameen ala deebisuun hin danda\'amu.'
                  : 'Enter the registered administrative email address to verify your identity. A 6-digit security code will be sent to the authorized account.'}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Imeelii Mirkaneeffame' : 'Registered Recovery Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={recoveryEmailInput}
                    onChange={(e) => setRecoveryEmailInput(e.target.value)}
                    placeholder="e.g. oboa2026@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {isOromo ? 'Gara Duubaa' : 'Back to Login'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isOromo ? 'Koodii Ergi' : 'Send Code'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: ENTER 6-DIGIT VERIFICATION CODE */}
          {mode === 'forgot_verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {isOromo
                  ? `Koodii lakkoofsa 6 gara ${DEFAULT_AUTHORIZED_EMAIL} ergame galchaa:`
                  : `Enter the 6-digit verification code sent to ${DEFAULT_AUTHORIZED_EMAIL}:`}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Koodii Mirkaneessaa (6 Digits)' : '6-Digit Verification Code'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCodeInput}
                    onChange={(e) => setVerificationCodeInput(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-sm tracking-widest font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_request');
                    setErrorMessage(null);
                  }}
                  className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {isOromo ? 'Gara Duubaa' : 'Back'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isOromo ? 'Mirkaneessi' : 'Verify Code'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: SET NEW PASSWORD */}
          {mode === 'forgot_new_password' && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {isOromo
                  ? `Jecha darbii haaraa fayyadamaa ${DEFAULT_AUTHORIZED_EMAIL} qopheessaa.`
                  : `Create a new administrative password for ${DEFAULT_AUTHORIZED_EMAIL}.`}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Jecha Darbii Haaraa' : 'New Administrative Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isOromo ? 'Jecha Darbii Mirkaneessi' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isOromo ? 'Jecha Darbii Haaromsi & Seeni' : 'Save New Password & Sign In'}</span>
              </button>
            </form>
          )}

          {/* Secure footnote */}
          <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
            Oromia Bureau of Agriculture · Directorate of Irrigation & Agricultural Mechanization
          </div>
        </div>
      </div>
    </div>
  );
};
