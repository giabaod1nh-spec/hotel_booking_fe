import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const { login, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitLoading(true);
    clearError();
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch {
      // Error handled in context
    } finally {
      setSubmitLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="login-page auth-page">
      <div className="login-card auth-card">
        <h1>Sign in</h1>
        <p className="subtitle">Welcome back! Enter your details to continue.</p>

        <form onSubmit={handleSubmit} className="login-form auth-form">
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={submitLoading}
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={submitLoading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitLoading}>
            {submitLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
