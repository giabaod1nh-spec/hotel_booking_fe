import { Link, useSearchParams } from 'react-router-dom';

export function BookingFailed() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'Payment was not completed.';

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>❌</div>
        <h1>Payment Failed</h1>
        <p className="subtitle">{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <Link to="/dashboard" className="link-btn">Go to Dashboard</Link>
          <Link to="/search" className="link-btn" style={{ background: 'var(--booking-teal)' }}>Try again</Link>
        </div>
      </div>
    </div>
  );
}
