import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import type { BookingResponse } from '../types/api';

/* ---- Reusable primitives ---- */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bc-card ${className}`}>{children}</div>;
}

function InfoBox({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bc-info-box">
      <span className="bc-info-icon">{icon}</span>
      <div className="bc-info-text">{children}</div>
    </div>
  );
}

function Btn({
  children, variant = 'primary', onClick, href, className = '',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const cls = `bc-btn bc-btn-${variant} ${className}`;
  if (href) return <Link to={href} className={cls}>{children}</Link>;
  return <button className={cls} onClick={onClick} type="button">{children}</button>;
}

/* ---- Icons (inline SVG) ---- */
const CheckCircle = (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const ShieldIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const CalendarIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const DownloadIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const PhoneIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
);
const MapPinIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function nightsBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}

function generatePin(code: string): string {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = ((h << 5) - h + code.charCodeAt(i)) | 0;
  return String(Math.abs(h) % 10000).padStart(4, '0');
}

/* ================================================================ */
export function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const bookingCode = searchParams.get('bookingCode') || '';

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBooking = useCallback(async () => {
    if (!bookingCode) { setLoading(false); return; }
    try {
      const data = await bookingApi.getByBookingCode(bookingCode);
      setBooking(data);
    } catch {
      setError('Could not load booking details.');
    } finally {
      setLoading(false);
    }
  }, [bookingCode]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const nights = nightsBetween(booking?.checkInDate, booking?.checkOutDate);
  const pin = generatePin(bookingCode);
  const city = booking?.hotelName ?? 'your destination';

  const roomSummary = booking?.bookingRoomItemResponses?.map(
    r => `${r.quantity ?? 1}× ${r.roomTypeName ?? 'Room'}`
  ).join(', ') || booking?.roomTypeName || 'Standard Room';

  /* ---- Loading / Error states ---- */
  if (loading) {
    return (
      <div className="bc-page">
        <div className="bc-container">
          <div className="bc-loading">
            <div className="hd-loading-spinner" />
            <p>Loading your booking...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  return (
    <div className="bc-page">

      {/* Navbar */}
      <nav className="bc-nav">
        <div className="bc-nav-inner">
          <Link to="/" className="bc-nav-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            Hotel Booking
          </Link>
          <div className="bc-nav-links">
            <Link to="/">Home</Link>
            <Link to="/dashboard">My bookings</Link>
          </div>
        </div>
      </nav>

      <div className="bc-container">

        {/* ============================================================
            SUCCESS HEADER
        ============================================================ */}
        <section className="bc-success-header">
          <div className="bc-success-badge">
            {CheckCircle}
          </div>
          <h1 className="bc-success-title">
            Your booking in {city} has been confirmed
          </h1>
          <p className="bc-success-sub">
            A confirmation email has been sent to <strong>{booking?.guestEmail || 'your email'}</strong>.
            Your booking code is <strong>{bookingCode}</strong>.
          </p>
          <div className="bc-success-actions">
            <Btn variant="primary" onClick={() => window.print()}>
              {DownloadIcon} Download confirmation
            </Btn>
            <Btn variant="secondary" href="/dashboard">
              {PhoneIcon} View my bookings
            </Btn>
          </div>
        </section>

        {/* ============================================================
            MAIN 2-COL LAYOUT
        ============================================================ */}
        <div className="bc-grid">

          {/* ---- LEFT COLUMN ---- */}
          <div className="bc-main">

            {/* Security notice */}
            <InfoBox icon={ShieldIcon}>
              <strong>Protect your booking</strong>
              <p>
                Never share your personal info or booking details with anyone contacting you on behalf of Hotel Booking.
                We'll never ask for your credit card number by phone or email.
              </p>
            </InfoBox>

            {/* Booking summary card */}
            <Card className="bc-summary-card">
              <div className="bc-summary-img">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"
                  alt={booking?.hotelName || 'Hotel'}
                />
              </div>
              <div className="bc-summary-details">
                <h2 className="bc-summary-hotel">{booking?.hotelName || 'Hotel'}</h2>

                <div className="bc-summary-meta">
                  {/* Check-in / Check-out */}
                  <div className="bc-meta-pair">
                    <div className="bc-meta-item">
                      <span className="bc-meta-label">{CalendarIcon} Check-in</span>
                      <span className="bc-meta-value">{formatDate(booking?.checkInDate)}</span>
                      <span className="bc-meta-hint">From 14:00</span>
                    </div>
                    <div className="bc-meta-arrow">→</div>
                    <div className="bc-meta-item">
                      <span className="bc-meta-label">{CalendarIcon} Check-out</span>
                      <span className="bc-meta-value">{formatDate(booking?.checkOutDate)}</span>
                      <span className="bc-meta-hint">Until 12:00</span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="bc-meta-row">
                    <span className="bc-meta-label">Duration</span>
                    <span className="bc-meta-value">{nights} night{nights !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Room */}
                  <div className="bc-meta-row">
                    <span className="bc-meta-label">Room</span>
                    <span className="bc-meta-value">{roomSummary}</span>
                  </div>

                  {/* Guests */}
                  <div className="bc-meta-row">
                    <span className="bc-meta-label">Guests</span>
                    <span className="bc-meta-value">{booking?.numGuest ?? 2} guest{(booking?.numGuest ?? 2) !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Total price */}
                  {booking?.totalPrice != null && (
                    <div className="bc-meta-row bc-meta-total">
                      <span className="bc-meta-label">Total price</span>
                      <span className="bc-meta-value bc-price">
                        VND {Number(booking.totalPrice).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <Btn variant="outline" href={booking?.hotelId ? `/hotel/${booking.hotelId}` : '/dashboard'}>
                  {MapPinIcon} View hotel details
                </Btn>
              </div>
            </Card>

            {/* Guest details */}
            <Card>
              <h3 className="bc-card-title">Guest details</h3>
              <div className="bc-guest-grid">
                <div className="bc-guest-item">
                  <span className="bc-guest-label">Guest name</span>
                  <span className="bc-guest-value">{booking?.guestName || '—'}</span>
                </div>
                <div className="bc-guest-item">
                  <span className="bc-guest-label">Email</span>
                  <span className="bc-guest-value">{booking?.guestEmail || '—'}</span>
                </div>
                <div className="bc-guest-item">
                  <span className="bc-guest-label">Phone</span>
                  <span className="bc-guest-value">{booking?.guestPhone || '—'}</span>
                </div>
                {booking?.specialRequest && (
                  <div className="bc-guest-item bc-guest-full">
                    <span className="bc-guest-label">Special requests</span>
                    <span className="bc-guest-value">{booking.specialRequest}</span>
                  </div>
                )}
              </div>
            </Card>

            {error && (
              <div className="bc-error-note">
                <p>⚠ {error}</p>
                <button onClick={fetchBooking}>Retry</button>
              </div>
            )}
          </div>

          {/* ---- RIGHT SIDEBAR ---- */}
          <aside className="bc-sidebar">

            {/* Confirmation code */}
            <Card className="bc-confirm-box">
              <h4 className="bc-confirm-title">Confirmation</h4>
              <div className="bc-confirm-row">
                <span>Booking number</span>
                <strong className="bc-confirm-code">{bookingCode || '—'}</strong>
              </div>
              <div className="bc-confirm-row">
                <span>PIN code</span>
                <strong className="bc-confirm-pin">{pin}</strong>
              </div>
              <p className="bc-confirm-hint">
                Use your booking code and PIN to manage your reservation.
              </p>
            </Card>

            {/* Manage your trip */}
            <Card>
              <h4 className="bc-card-title">Manage your trip</h4>
              <ul className="bc-manage-list">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>Change dates or cancel your booking any time from your <Link to="/dashboard">dashboard</Link></span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>Update guest details or special requests before check-in</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>Contact the property directly about check-in instructions</span>
                </li>
              </ul>
            </Card>

            {/* Quick links */}
            <div className="bc-quick-links">
              <Btn variant="primary" href="/dashboard" className="bc-btn-full">
                Go to my bookings
              </Btn>
              <Btn variant="outline" href="/" className="bc-btn-full">
                Search for another stay
              </Btn>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bc-footer">
        <p>© 2025 Hotel Booking. Thank you for choosing us.</p>
      </footer>
    </div>
  );
}
