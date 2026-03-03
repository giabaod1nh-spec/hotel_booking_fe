import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';

export function ChangePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    userApi.getMe()
      .then((user) => setUserId(user.userId))
      .catch(() => logout());
  }, [isAuthenticated, navigate, logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!userId) return;
    setLoading(true);
    try {
      await userApi.changePassword({
        userId,
        password,
        confirmPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Password updated</h1>
          <p className="subtitle">Your password has been changed successfully.</p>
          <Link to="/dashboard" className="link-btn">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Change password</h1>
        <p className="subtitle">Enter your new password</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-banner">{error}</div>}

          <div className="input-group">
            <label>New password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className="input-group">
            <label>Confirm new password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !userId}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/dashboard">Back to Dashboard</Link>
        </p>
      </div>
    </div>
  );
}
