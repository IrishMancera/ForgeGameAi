import { useState } from 'react';
import { login, register, saveAuth, UserProfile } from '../services/auth';
import { ArrowRight, Lock, User, Mail } from 'lucide-react';

interface AuthProps {
  onAuthenticated: (user: UserProfile) => void;
  onToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export default function Auth({ onAuthenticated, onToast }: AuthProps) {
  const [mode, setMode] = useState<'sign-in' | 'register'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
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
    } catch (error) {
      onToast('error', 'Authentication failed', error instanceof Error ? error.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(108,59,255,0.16),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(25,198,209,0.12),_transparent_35%),linear-gradient(135deg,_#fff9f2_0%,_#fef8f1_45%,_#f7f0ff_100%)] text-[#17152B] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[20px] border border-[#DED9EA] bg-white/95 p-8 shadow-[0_24px_80px_rgba(108,59,255,0.12)]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6C6880]">GameForge Systems AI</div>
            <h1 className="mt-2 text-3xl font-bold text-[#17152B]">{mode === 'sign-in' ? 'Sign in' : 'Create account'}</h1>
          </div>
          <div className="rounded-2xl bg-[#6C3BFF]/10 px-3 py-2 text-sm font-semibold text-[#6C3BFF]">Secure workspace</div>
        </div>

        <div className="flex gap-2 mb-8 text-sm">
          <button
            onClick={() => setMode('sign-in')}
            className={`flex-1 rounded-[12px] px-4 py-3 transition ${mode === 'sign-in' ? 'bg-[#6C3BFF] text-white' : 'bg-[#F4F1FA] text-[#6C6880]'}`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode('register')}
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
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full bg-transparent text-sm outline-none" />
          </div>
        </label>

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password || (mode === 'register' && (!firstName || !lastName))}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#6C3BFF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5a2fe0] transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mode === 'sign-in' ? 'Sign in' : 'Create account'} <ArrowRight size={16} />
        </button>

        <p className="mt-4 text-xs text-[#6C6880]">By continuing, you agree to the Privacy Policy and Terms of Service.</p>
      </div>
    </div>
  );
}
