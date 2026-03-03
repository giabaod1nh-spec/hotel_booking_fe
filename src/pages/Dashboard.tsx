import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hotelApi } from '../api/hotelApi';
import { bookingApi } from '../api/bookingApi';
import { paymentApi } from '../api/paymentApi';
import { userApi } from '../api/userApi';
import type { HotelResponse } from '../types/api';
import type { BookingResponse } from '../types/api';

export function Dashboard() {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ userName?: string; firstName?: string } | null>(null);
  const [hotels, setHotels] = useState<HotelResponse[]>([]);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    userApi.getMe()
      .then(setUser)
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    hotelApi.getHotels({ page: 0, size: 6 })
      .then(setHotels)
      .catch(() => setHotels([]))
      .finally(() => setLoadingHotels(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    bookingApi.getMyBookings()
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false));
  }, [isAuthenticated]);

  const handlePay = async (bookingId: string) => {
    try {
      const url = await paymentApi.createPayment(bookingId);
      window.location.href = url;
    } catch {
      // error - could show toast
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const displayName = user?.firstName || user?.userName || 'User';

  return (
    <div className="dashboard-page">
      <header className="header">
        <h1 className="header-logo">Hotel Booking</h1>
        <nav className="header-nav">
          <Link to="/dashboard">Home</Link>
          <Link to="/change-password">Change password</Link>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </nav>
      </header>

      <main className="main">
        <section className="welcome-section">
          <h2>Welcome, {displayName}</h2>
        </section>

        <section className="section">
          <h3>My Bookings</h3>
          {loadingBookings ? (
            <p className="muted">Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <p className="muted">No bookings yet.</p>
          ) : (
            <div className="card-grid">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.bookingId} className="card">
                  <div className="card-header">
                    <span className="badge">{b.status}</span>
                    <strong>{b.bookingCode}</strong>
                  </div>
                  <p>{b.hotelName}</p>
                  <p className="muted">
                    {b.checkInDate} → {b.checkOutDate}
                  </p>
                  <p className="price">{b.totalPrice?.toLocaleString()} VND</p>
                  {b.status === 'PENDING' && b.bookingId && (
                    <button
                      type="button"
                      className="search-result-cta"
                      style={{ marginTop: '0.5rem', width: '100%' }}
                      onClick={() => handlePay(b.bookingId!)}
                    >
                      Pay now
                    </button>
                  )}
                  {b.status === 'CHECK_OUT' && b.hotelId && (
                    <Link
                      to={`/hotel/${b.hotelId}`}
                      className="search-result-cta"
                      style={{ marginTop: '0.5rem', width: '100%', display: 'block', textAlign: 'center' }}
                    >
                      Write review
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <h3>Hotels</h3>
          {loadingHotels ? (
            <p className="muted">Loading hotels...</p>
          ) : hotels.length === 0 ? (
            <p className="muted">No hotels available.</p>
          ) : (
            <div className="card-grid">
              {hotels.map((h) => (
                <div key={h.hotelId} className="card">
                  <div className="card-header">
                    <strong>{h.hotelName}</strong>
                    {h.starRating && (
                      <span className="stars">{'★'.repeat(h.starRating)}</span>
                    )}
                  </div>
                  <p className="muted">{h.hotelCity}, {h.hotelCountry}</p>
                  {h.hotelDescription && (
                    <p className="card-desc">
                      {h.hotelDescription.length > 80
                        ? `${h.hotelDescription.slice(0, 80)}...`
                        : h.hotelDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
