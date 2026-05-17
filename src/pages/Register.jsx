import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Building2, AlertTriangle, Zap, Shield } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { DEPARTMENTS } from '../utils/constants';
import './Login.css';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.name || !form.email || !form.password || !form.department) {
      setError('All fields are required.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
    if (!passwordRegex.test(form.password)) {
      setError('Password needs uppercase, lowercase, number, and special character.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!form.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const result = register(form.name, form.email, form.password, form.department);
    setLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-form-wrapper">
          <div className="login-brand">
            <div className="login-logo">
              <Zap size={28} />
            </div>
            <h1 className="login-title">Create Account</h1>
            <p className="login-subtitle">Join AtomQuest and start achieving.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {error && (
              <div className="login-error" role="alert">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="reg-name" className="login-label">Full Name</label>
              <div className="login-input-wrap">
                <User size={16} className="login-input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  className="login-input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="reg-email" className="login-label">Email</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  className="login-input"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="reg-dept" className="login-label">Department</label>
              <div className="login-input-wrap">
                <Building2 size={16} className="login-input-icon" />
                <select
                  id="reg-dept"
                  className="login-input"
                  value={form.department}
                  onChange={e => handleChange('department', e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="login-field">
                <label htmlFor="reg-pass" className="login-label">Password</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="reg-pass"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Strong password"
                    value={form.password}
                    onChange={e => handleChange('password', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="login-field">
                <label htmlFor="reg-confirm" className="login-label">Confirm</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="reg-confirm"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Confirm"
                    value={form.confirmPassword}
                    onChange={e => handleChange('confirmPassword', e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="login-security-note">
              <Shield size={12} />
              <span>Public registration creates <strong>Employee</strong> accounts only. Managers/Admins are assigned by an Admin.</span>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? <span className="login-spinner" /> : 'CREATE ACCOUNT'}
            </button>

            <div className="login-link-row">
              Already have an account? <Link to="/login" className="login-link">Sign In →</Link>
            </div>
          </form>
        </div>
      </div>

      <div className="login-right">
        <div className="login-hero-content">
          <h2 className="login-hero-title">Join Your Team</h2>
          <p className="login-hero-sub">Set quarterly goals. Get manager approval. Track your growth.</p>
        </div>
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>
    </div>
  );
}
