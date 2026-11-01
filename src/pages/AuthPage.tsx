import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Flame, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    displayName?: string;
    general?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp, signInDemo, resetPassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email';
    }

    if (!isForgotPassword) {
      if (!password) {
        errs.password = 'Password is required';
      } else if (password.length < 6) {
        errs.password = 'Password must be at least 6 characters';
      }

      if (!isLogin && !displayName.trim()) {
        errs.displayName = 'Display name is required';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      if (isForgotPassword) {
        const msg = await resetPassword(email.trim());
        addToast(msg, 'info');
        setIsForgotPassword(false);
      } else if (isLogin) {
        await signIn(email.trim(), password);
        addToast('Welcome back!', 'success');
        navigate('/');
      } else {
        await signUp(email.trim(), password, displayName.trim());
        addToast('Account created successfully!', 'success');
        navigate('/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrors({ general: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setSubmitting(true);
    try {
      await signInDemo();
      addToast('Logged in to StreakBoard!', 'success');
      navigate('/');
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : 'Demo sign in failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '32px 28px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            className="brand-logo"
            style={{ width: '44px', height: '44px', margin: '0 auto 12px auto' }}
          >
            <Flame size={26} fill="#0d1117" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-bright)' }}>
            StreakBoard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Daily task planning & GitHub-style consistency tracker
          </p>
        </div>

        {/* Tab Toggle (Log in vs Sign Up) */}
        {!isForgotPassword && (
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              padding: '3px',
              marginBottom: '20px',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${isLogin ? 'btn-primary' : ''}`}
              style={{ flex: 1, border: 'none' }}
              onClick={() => {
                setIsLogin(true);
                setErrors({});
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={`btn btn-sm ${!isLogin ? 'btn-primary' : ''}`}
              style={{ flex: 1, border: 'none' }}
              onClick={() => {
                setIsLogin(false);
                setErrors({});
              }}
            >
              Create account
            </button>
          </div>
        )}

        {isForgotPassword && (
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-bright)' }}>
              Reset Password
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Enter your email and we'll send you recovery instructions.
            </p>
          </div>
        )}

        {errors.general && (
          <div
            className="form-error"
            style={{
              padding: '12px',
              backgroundColor: 'rgba(248, 81, 73, 0.12)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(248, 81, 73, 0.35)',
              marginBottom: '16px',
              fontSize: '13px',
              lineHeight: '1.4',
            }}
          >
            <div>{errors.general}</div>
            {errors.general.toLowerCase().includes('rate limit') && (
              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(248, 81, 73, 0.25)',
                  fontSize: '12px',
                  color: 'var(--text-bright)',
                }}
              >
                <strong>💡 Quick Fix in Supabase:</strong>
                <ol style={{ paddingLeft: '18px', margin: '4px 0 8px 0' }}>
                  <li>Open <strong>Authentication → Providers → Email</strong></li>
                  <li>Turn <strong>OFF</strong> <em>"Confirm email"</em> & Save</li>
                </ol>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ width: '100%', marginTop: '6px' }}
                  onClick={handleDemoLogin}
                >
                  ⚡ Skip & Continue in Demo Mode
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && !isForgotPassword && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Display Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Rivera"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                />
                <User
                  size={16}
                  style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
                />
              </div>
              {errors.displayName && <div className="form-error">{errors.displayName}</div>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '34px' }}
                autoComplete="email"
              />
              <Mail
                size={16}
                style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
              />
            </div>
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          {!isForgotPassword && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" htmlFor="auth-password" style={{ margin: 0 }}>Password</label>
                {isLogin && (
                  <button
                    type="button"
                    style={{ fontSize: '11px', color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrors({});
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '34px', paddingRight: '36px' }}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '8px',
                    color: 'var(--text-muted)',
                    padding: '2px',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', marginTop: '8px' }}
            disabled={submitting}
          >
            {submitting
              ? 'Processing...'
              : isForgotPassword
              ? 'Send Reset Link'
              : isLogin
              ? 'Sign In to StreakBoard'
              : 'Create Account'}
          </button>

          {isForgotPassword && (
            <button
              type="button"
              className="btn"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => {
                setIsForgotPassword(false);
                setErrors({});
              }}
            >
              Back to Login
            </button>
          )}
        </form>

        {/* Quick Demo Access */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-default)', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Instant Evaluation:
          </div>
          <button
            type="button"
            className="btn btn-sm"
            style={{ width: '100%', backgroundColor: 'var(--bg-canvas)' }}
            onClick={handleDemoLogin}
            disabled={submitting}
          >
            ⚡ Quick Demo Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
