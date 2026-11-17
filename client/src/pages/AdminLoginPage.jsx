import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../utils/roleHome';
import { Coffee, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { DEMO_MODE } from '../utils/demoMode';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, user, loading: sessionLoading } = useAuth();

  // Demo builds arrive with a filled form; a real deployment starts empty.
  const [email, setEmail] = useState(DEMO_MODE ? 'admin@cafe.com' : '');
  const [password, setPassword] = useState(DEMO_MODE ? 'admin123' : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already signed in: skip the form and go to this role's workspace.
  useEffect(() => {
    if (!sessionLoading && user) navigate(homeForRole(user.role), { replace: true });
  }, [sessionLoading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const signedIn = await login(email, password);
      navigate(homeForRole(signedIn?.role));
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="pixel-screen pixel-login-screen min-h-screen bg-space_indigo-100 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-futura selection:bg-dusty_mauve selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand */}
        <Link to="/" className="flex flex-col items-center group">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-space_indigo to-dusty_mauve flex items-center justify-center text-white shadow-xl shadow-space_indigo/30 group-hover:scale-105 transition-all">
            <Coffee className="w-8 h-8 stroke-2" />
          </div>
          <h2 className="mt-4 text-3xl font-bold font-tenez tracking-tight text-white">
            Little Window Café · Staff Portal
          </h2>
          <p className="mt-1 text-xs text-thistle-500 font-aleo">
            Staff & Management Console Access
          </p>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-space_indigo-200/90 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-space_indigo-400 shadow-2xl space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-aleo">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* One form for every role — the account decides what opens next. */}
          <p className="text-[11px] leading-relaxed text-thistle-500 font-aleo text-center px-1">
            <strong className="text-thistle-300">Counter</strong> — orders &amp; tables ·{' '}
            <strong className="text-thistle-300">Kitchen</strong> — the order queue ·{' '}
            <strong className="text-thistle-300">Owner</strong> — everything
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-thistle-400 font-aleo mb-2">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-thistle-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-space_indigo-100/90 border border-space_indigo-400 text-white text-sm focus:outline-hidden focus:border-dusty_mauve focus:ring-2 focus:ring-dusty_mauve/30 transition-all placeholder:text-thistle-600"
                  placeholder="admin@cafe.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-thistle-400 font-aleo mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-thistle-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-space_indigo-100/90 border border-space_indigo-400 text-white text-sm focus:outline-hidden focus:border-dusty_mauve focus:ring-2 focus:ring-dusty_mauve/30 transition-all placeholder:text-thistle-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-space_indigo via-dusty_mauve to-space_indigo hover:brightness-110 active:scale-98 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-space_indigo/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials — local demos only */}
          {DEMO_MODE && (<div className="pt-4 border-t border-space_indigo-400/50">
            <div className="text-[11px] font-bold uppercase tracking-wider text-thistle-500 font-aleo mb-3 text-center">
              One-Click Demo Credentials
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin@cafe.com', 'admin123')}
                className="p-2.5 rounded-2xl bg-space_indigo-300/60 hover:bg-space_indigo-300 text-left border border-space_indigo-400 hover:border-dusty_mauve text-xs transition-all cursor-pointer shadow-2xs group"
              >
                <div className="font-bold text-dusty_mauve-600 font-aleo">Owner</div>
                <div className="text-[10px] text-thistle-500 truncate">admin@cafe.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('counter@cafe.com', 'counter123')}
                className="p-2.5 rounded-2xl bg-space_indigo-300/60 hover:bg-space_indigo-300 text-left border border-space_indigo-400 hover:border-thistle text-xs transition-all cursor-pointer shadow-2xs group"
              >
                <div className="font-bold text-thistle-300 font-aleo">Counter</div>
                <div className="text-[10px] text-thistle-500 truncate">counter@cafe.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('kitchen@cafe.com', 'kitchen123')}
                className="p-2.5 rounded-2xl bg-space_indigo-300/60 hover:bg-space_indigo-300 text-left border border-space_indigo-400 hover:border-emerald-400 text-xs transition-all cursor-pointer shadow-2xs group"
              >
                <div className="font-bold text-emerald-400 font-aleo">Kitchen</div>
                <div className="text-[10px] text-thistle-500 truncate">kitchen@cafe.com</div>
              </button>
            </div>
          </div>)}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs font-semibold font-aleo text-thistle-500 hover:text-white transition-colors">
            ← Return to the café floor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
