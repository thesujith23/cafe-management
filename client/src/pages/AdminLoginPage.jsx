import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../utils/roleHome';
import {
  Coffee,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ChefHat,
  ClipboardList,
  Crown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DEMO_MODE } from '../utils/demoMode';
import '../styles/login.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, user, loading: sessionLoading } = useAuth();

  // Demo builds arrive with a filled form; a real deployment starts empty.
  const [email, setEmail] = useState(DEMO_MODE ? 'admin@cafe.com' : '');
  const [password, setPassword] = useState(DEMO_MODE ? 'admin123' : '');
  const [showPassword, setShowPassword] = useState(false);
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
    setError('');
  };

  return (
    <div className="staff-login">
      {/* The room: brand, window and the three ways into service. */}
      <section className="staff-login-brand" aria-label="Little Window Café staff">
        <Link to="/" className="staff-login-wordmark">
          <span><Coffee size={19} strokeWidth={1.8} /></span>
          <span>
            <strong>Little Window</strong>
            <small>CAFÉ &amp; GARDEN</small>
          </span>
        </Link>

        <div className="staff-login-window" aria-hidden="true">
          <span className="staff-login-steam"><i /><i /><i /></span>
        </div>

        <div className="staff-login-bottom">
        <div className="staff-login-copy">
          <p className="staff-login-kicker">Staff portal</p>
          <h1>Service starts<br /><em>at the counter.</em></h1>
          <p>
            One door for the whole shift. Your account opens the counter, the kitchen pass
            or the owner's console on its own.
          </p>
        </div>

        <ul className="staff-login-roles">
          <li>
            <ClipboardList aria-hidden="true" />
            <span><strong>Counter</strong>orders, tables &amp; the board</span>
          </li>
          <li>
            <ChefHat aria-hidden="true" />
            <span><strong>Kitchen</strong>the pass and the queue</span>
          </li>
          <li>
            <Crown aria-hidden="true" />
            <span><strong>Owner</strong>menu, reports, everything</span>
          </li>
        </ul>

        <p className="staff-login-foot">Open today · 8:00 – 22:00 · six tables</p>
        </div>
      </section>

      {/* The form. */}
      <section className="staff-login-panel">
        <div className="staff-login-card">
          <div className="staff-login-card-head">
            <h2>Sign in</h2>
            <p>Staff &amp; management access</p>
          </div>

          <p className="staff-login-role-line">
            <strong>Counter</strong> — orders &amp; tables · <strong>Kitchen</strong> — the queue ·{' '}
            <strong>Owner</strong> — everything
          </p>

          {error && (
            <p className="staff-login-error" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          <form className="staff-login-form" onSubmit={handleSubmit}>
            <div className="staff-login-field">
              <label htmlFor="staff-email">Staff email</label>
              <div className="staff-login-input">
                <Mail size={15} aria-hidden="true" />
                <input
                  id="staff-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cafe.com"
                />
              </div>
            </div>

            <div className="staff-login-field">
              <label htmlFor="staff-password">Password</label>
              <div className="staff-login-input">
                <Lock size={15} aria-hidden="true" />
                <input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  className="staff-login-reveal"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="staff-login-submit" disabled={loading}>
              <span>{loading ? 'Signing in…' : 'Sign in to your shift'}</span>
              <ArrowRight aria-hidden="true" />
            </button>
          </form>

          {DEMO_MODE && (
            <div className="staff-login-demo">
              <p>One-click demo accounts</p>
              <div className="staff-login-demo-grid">
                <button
                  type="button"
                  className="staff-login-demo-card"
                  onClick={() => fillQuickCredentials('admin@cafe.com', 'admin123')}
                >
                  <Crown aria-hidden="true" />
                  <b>Owner</b>
                  <span>admin@cafe.com</span>
                </button>
                <button
                  type="button"
                  className="staff-login-demo-card"
                  onClick={() => fillQuickCredentials('counter@cafe.com', 'counter123')}
                >
                  <ClipboardList aria-hidden="true" />
                  <b>Counter</b>
                  <span>counter@cafe.com</span>
                </button>
                <button
                  type="button"
                  className="staff-login-demo-card"
                  onClick={() => fillQuickCredentials('kitchen@cafe.com', 'kitchen123')}
                >
                  <ChefHat aria-hidden="true" />
                  <b>Kitchen</b>
                  <span>kitchen@cafe.com</span>
                </button>
              </div>
            </div>
          )}

          <Link to="/" className="staff-login-back">← Return to the café floor</Link>
        </div>
      </section>
    </div>
  );
};

export default AdminLoginPage;
