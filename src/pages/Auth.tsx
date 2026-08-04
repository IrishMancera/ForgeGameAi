import { useState, useEffect } from 'react';
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
  const [inviteToken, setInviteToken] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  // Read token/user/inviteToken parameters on mount (redirected from social login)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    const err = params.get('error');
    const inviteTokenParam = params.get('inviteToken');

    if (err) {
      setError(err);
      onToast('error', 'OAuth Sign-in Failed', err);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token && userParam) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userParam));
        saveAuth(parsedUser, token);

        if (inviteTokenParam) {
          fetch('/api/invite/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteTokenParam, userId: parsedUser.id })
          }).then(res => {
            if (!res.ok) console.error('Failed to automatically accept invitation.');
            else onToast('success', 'Invitation Accepted', 'You have successfully joined the project workspace.');
          }).catch(console.error);
        }

        onAuthenticated(parsedUser);
        onToast('success', 'Signed in', `Welcome back, ${parsedUser.firstName || parsedUser.email}`);
        
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error('Error parsing redirected user:', e);
      }
    } else {
      const inviteTokenQuery = params.get('inviteToken');
      if (inviteTokenQuery) {
        setInviteToken(inviteTokenQuery);
        const emailQuery = params.get('email');
        if (emailQuery) {
          setEmail(emailQuery);
        }
      }
    }
  }, []);

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
      let result;
      if (mode === 'sign-in') {
        result = await login(email, password);
        saveAuth(result.user, result.token);
      } else {
        result = await register(email, password, firstName, lastName);
        saveAuth(result.user, result.token);
      }

      if (inviteToken) {
        try {
          await fetch('/api/invite/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken, userId: result.user.id })
          });
          onToast('success', 'Invitation Accepted', 'You have successfully joined the project workspace.');
        } catch (e) {
          console.error('Failed to accept invite:', e);
        }
      }

      onAuthenticated(result.user);
      onToast('success', mode === 'sign-in' ? 'Signed in' : 'Account created', `Welcome back, ${result.user.firstName || result.user.email}`);
    } catch (err) {
      const friendlyMsg = formatErrorMessage(err);
      setError(friendlyMsg);
      onToast('error', 'Authentication failed', friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'linkedin') => {
    window.location.href = `/api/auth/social/${provider}/redirect?inviteToken=${inviteToken}`;
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
          <div style={{ fontFamily: 'Orbitron, sans-serif' }} className="text-lg font-black uppercase tracking-[0.16em] text-[#17152B] leading-tight">
            GameForgeAI
          </div>
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
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ellie" className="w-full bg-transparent text-sm outline-none" />
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

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#DED9EA]"></div>
          </div>
          <span className="relative bg-white px-3 text-xs text-[#6C6880] uppercase tracking-wider font-semibold">Or continue with</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="flex items-center justify-center gap-2.5 rounded-[12px] border border-[#DED9EA] bg-white px-4 py-2.5 text-xs font-semibold text-[#17152B] transition hover:bg-[#F4F1FA] disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            onClick={() => handleSocialLogin('linkedin')}
            disabled={loading}
            className="flex items-center justify-center gap-2.5 rounded-[12px] border border-[#DED9EA] bg-white px-4 py-2.5 text-xs font-semibold text-[#17152B] transition hover:bg-[#F4F1FA] disabled:opacity-50"
          >
            <svg className="h-4 w-4 text-[#0077B5]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            LinkedIn
          </button>
        </div>

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
