import { useState } from 'react';
import { login, register, saveAuth, UserProfile } from '../services/auth';
import { ArrowRight, Lock, User, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onAuthenticated: (user: UserProfile) => void;
  onToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export default function Auth({ onAuthenticated, onToast }: AuthProps) {
  const [mode, setMode] = useState<'sign-in' | 'register'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const formatErrorMessage = (rawError: unknown): string => {
    const msg = rawError instanceof Error ? rawError.message : String(rawError);
    const lower = msg.toLowerCase();

    if (lower.includes('user-not-found') || lower.includes("account doesn't exist") || lower.includes("not found")) {
      return "We couldn't find an account associated with this email.";
    }
    if (lower.includes('wrong-password') || lower.includes('incorrect password') || lower.includes('invalid password')) {
      return "The password you entered is incorrect.";
    }
    if (lower.includes('invalid-email') || lower.includes('invalid email')) {
      return "Please enter a valid email address.";
    }
    if (lower.includes('email-already-in-use') || lower.includes('already exists')) {
      return "An account with this email already exists. Please sign in instead.";
    }
    if (lower.includes('weak-password') || lower.includes('at least 8 characters')) {
      return "Password must be at least 8 characters long.";
    }
    if (lower.includes('too-many-requests') || lower.includes('too many attempts')) {
      return "Too many sign-in attempts. Please wait a few minutes before trying again.";
    }
    if (lower.includes('network') || lower.includes('failed to fetch')) {
      return "Unable to connect. Please check your internet connection.";
    }
    return msg || "Something went wrong. Please try again later.";
  };

  const validateForm = (): boolean => {
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Password is required.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    if (mode === 'register') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('First name and last name are required.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    try {
      if (mode === 'sign-in') {
        const result = await login(email, password);
        saveAuth(result.user, result.token);
        onAuthenticated(result.user);
        onToast('success', 'Signed in', `Welcome back, ${result.user.firstName || result.user.email}`);
      } else {
        const result = await register(email, password, firstName, lastName);
        saveAuth(result.user, result.token);
        onAuthenticated(result.user);
        onToast('success', 'Account created', `Welcome, ${result.user.firstName || result.user.email}`);
      }
    } catch (err) {
      const friendlyMsg = formatErrorMessage(err);
      setError(friendlyMsg);
      onToast('error', 'Authentication failed', friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotLoading(true);
    setForgotMessage("");
    setForgotError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!forgotEmail.trim() || !emailRegex.test(forgotEmail.trim())) {
      setForgotError("Please enter a valid email address.");
      setForgotLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send reset email.");
      }

      setForgotMessage(data.message);

      onToast(
        "success",
        "Password Reset",
        data.message
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to send reset email.";

      setForgotError(message);

      onToast(
        "error",
        "Password Reset",
        message
      );
    } finally {
      setForgotLoading(false);
    }
  };
  const handleModeSwitch = (newMode: 'sign-in' | 'register') => {
    setMode(newMode);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(108,59,255,0.16),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(25,198,209,0.12),_transparent_35%),linear-gradient(135deg,_#fff9f2_0%,_#fef8f1_45%,_#f7f0ff_100%)] text-[#17152B] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[20px] border border-[#DED9EA] bg-white/95 p-8 shadow-[0_24px_80px_rgba(108,59,255,0.12)]">

        <div className="mb-8 flex h-28 flex-col items-center justify-center text center">
          <div className="text-xs font-semibold uppercase tracking-[0.5em] text-[#6C6880]">GameForge Systems AI</div>
          <h1 className="mt-2 text-3xl font-bold text-[#17152B]">{mode === 'sign-in' ? 'Sign in' : 'Create account'}</h1>
        </div>

        <div className="flex gap-2 mb-8 text-sm">
          <button
            onClick={() => handleModeSwitch('sign-in')}
            className={`flex-1 rounded-[12px] px-4 py-3 transition ${mode === 'sign-in' ? 'bg-[#6C3BFF] text-white' : 'bg-[#F4F1FA] text-[#6C6880]'}`}
          >
            Sign in
          </button>
          <button
            onClick={() => handleModeSwitch('register')}
            className={`flex-1 rounded-[12px] px-4 py-3 transition ${mode === 'register' ? 'bg-[#6C3BFF] text-white' : 'bg-[#F4F1FA] text-[#6C6880]'}`}
          >
            Register
          </button>
        </div>

        {mode === 'register' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="block text-xs font-semibold text-[#6C6880]">
              First name
              <div className="mt-1 flex items-center gap-2 rounded-[12px] border border-[#DED9EA] bg-[#F4F1FA] px-3 py-2">
                <User size={14} className="text-[#6C6880]" />
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jordan" className="w-full bg-transparent text-sm outline-none" />
              </div>
            </label>
            <label className="block text-xs font-semibold text-[#6C6880]">
              Last name
              <div className="mt-1 flex items-center gap-2 rounded-[12px] border border-[#DED9EA] bg-[#F4F1FA] px-3 py-2">
                <User size={14} className="text-[#6C6880]" />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="K." className="w-full bg-transparent text-sm outline-none" />
              </div>
            </label>
          </div>
        )}

        <label className="block text-xs font-semibold text-[#6C6880]">
          Email address
          <div className="mt-1 flex items-center gap-2 rounded-[12px] border border-[#DED9EA] bg-[#F4F1FA] px-3 py-2">
            <Mail size={14} className="text-[#6C6880]" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" className="w-full bg-transparent text-sm outline-none" />
          </div>
        </label>

        <label className="block text-xs font-semibold text-[#6C6880] mt-4">
          Password
          <div className="mt-1 flex items-center gap-2 rounded-[12px] border border-[#DED9EA] bg-[#F4F1FA] px-3 py-2">
            <Lock size={14} className="text-[#6C6880]" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-sm outline-none"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={16} className="text-[#6C6880]" /> : <Eye size={16} className="text-[#6C6880]" />}
            </button>
          </div>
        </label>

        {mode === 'sign-in' && (
          <div className="mt-2 text-right">
            <button
              type="button"
              className="text-xs font-medium text-[#6C3BFF] hover:underline"
              onClick={() => {
                setForgotEmail(email); // optional: prefill with entered email
                setShowForgotPassword(true);
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-6">
              <h2 className="text-xl font-bold">
                Forgot Password
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Enter your email address.
              </p>

              <input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="mt-4 w-full rounded-lg border p-3" />
              <button onClick={handleForgotPassword} disabled={forgotLoading} className="mt-5 w-full rounded-lg bg-[#6C3BFF] py-3 text-white">
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </button>

              {forgotMessage && (
                <p className="mt-3 text-green-600">
                  {forgotMessage}
                </p>
              )}

              {forgotError && (
                <p className="mt-3 text-red-600">
                  {forgotError}
                </p>
              )}

              <button
                className="mt-4 w-full"
                onClick={() => setShowForgotPassword(false)}>
                Close
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#6C3BFF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5a2fe0] transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              {mode === 'sign-in' ? 'Signing in...' : 'Creating account...'}
            </>
          ) : (
            <>
              {mode === 'sign-in' ? 'Sign in' : 'Create account'} <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-[#6C6880]">
          By continuing, you agree to our{" "}
          <a
            href="https://www.termsfeed.com/live/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6C3BFF] hover:underline"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="https://www.termsfeed.com/live/terms-and-conditions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6C3BFF] hover:underline"
          >
            Terms & Conditions
          </a>.
        </p>
      </div>
    </div>
  );
}
