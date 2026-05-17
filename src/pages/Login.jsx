import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Zap, Target, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginAttempts, isLocked, lockUntil } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const testCredentials = [
    { label: 'Admin', email: 'admin@goalportal.com', password: 'Admin@123' },
    { label: 'Manager', email: 'manager@goalportal.com', password: 'Manager@123' },
    { label: 'Employee', email: 'employee@goalportal.com', password: 'Employee@123' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLocked && lockUntil && Date.now() < lockUntil) {
      const mins = Math.ceil((lockUntil - Date.now()) / 60000);
      setError(`Account locked. Try again in ${mins} minute(s).`);
      return;
    }

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    // Simulate network latency
    await new Promise(r => setTimeout(r, 600));

    const result = login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.message);
    }
  };

  const fillCredentials = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  const lockTimeRemaining = isLocked && lockUntil
    ? Math.max(0, Math.ceil((lockUntil - Date.now()) / 60000))
    : 0;

  return (
    <div className="login-page">
      {/* Left Panel — Form */}
      <div className="login-left">
        <div className="login-form-wrapper">
          <div className="login-brand">
            <div className="login-logo">
              <Zap size={28} />
            </div>
            <h1 className="login-title">AtomQuest</h1>
            <p className="login-subtitle">Track. Achieve. Excel.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {error && (
              <div className="login-error" role="alert">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            {isLocked && lockTimeRemaining > 0 && (
              <div className="login-locked">
                <Lock size={14} />
                <span>Too many failed attempts. Locked for {lockTimeRemaining} min.</span>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="login-email" className="login-label">Email</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder="admin@goalportal.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password" className="login-label">Password</label>
              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading || (isLocked && lockTimeRemaining > 0)}
            >
              {loading ? (
                <span className="login-spinner" />
              ) : (
                'SIGN IN'
              )}
            </button>

            <div className="login-link-row">
              <Link to="/register" className="login-link">Create Account →</Link>
            </div>
          </form>

          {/* Test Credentials */}
          <div className="login-test-creds">
            <div className="test-creds-title">TEST CREDENTIALS</div>
            <div className="test-creds-list">
              {testCredentials.map(cred => (
                <button
                  key={cred.label}
                  className="test-cred-btn"
                  onClick={() => fillCredentials(cred)}
                  type="button"
                >
                  <span className="test-cred-role">{cred.label}</span>
                  <span className="test-cred-email">{cred.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Hero */}
      <div className="login-right">
        <div className="login-hero-content">
          <h2 className="login-hero-title">Achieve More</h2>
          <p className="login-hero-sub">Set goals. Track progress. Drive success.</p>

          <div className="login-features">
            <div className="login-feature">
              <Target size={20} />
              <span>Smart Goal Tracking</span>
            </div>
            <div className="login-feature">
              <TrendingUp size={20} />
              <span>Real-Time Analytics</span>
            </div>
            <div className="login-feature">
              <Shield size={20} />
              <span>Enterprise-Grade Security</span>
            </div>
          </div>
        </div>

        {/* Decorative orbs */}
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>
    </div>
  );
}
