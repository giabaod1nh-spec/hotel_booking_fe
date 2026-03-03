import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hotelApi } from '../api/hotelApi';
import { bookingApi } from '../api/bookingApi';
import { paymentApi } from '../api/paymentApi';
import { reviewApi } from '../api/reviewApi';
import { api } from '../api/axiosInstance';
import type { ApiResponse, HotelResponse, RoomTypeResponse, ReviewResponse } from '../types/api';

/* ---- helpers ---- */
const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=500&fit=crop',
];

function nightsBetween(a: string, b: string): number {
  if (!a || !b) return 1;
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

function scoreLabel(s: number): string {
  if (s >= 9) return 'Wonderful';
  if (s >= 8) return 'Very Good';
  if (s >= 7) return 'Good';
  return 'Pleasant';
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function ratingColor(r: number): string {
  if (r >= 9) return '#007a53';
  if (r >= 7) return '#0071c2';
  if (r >= 5) return '#f4b740';
  return '#c0392b';
}

const ROOM_AMENITIES_LIST = [
  'Free WiFi', 'Air conditioning', 'Flat-screen TV', 'Private bathroom',
  'Minibar', 'Safe', 'Desk', 'Hairdryer',
];
function roomAmenities(idx: number): string[] {
  return ROOM_AMENITIES_LIST.slice(0, 4 + (idx % 4));
}

/* ---- types ---- */
interface RoomSelection { roomTypeId: string; quantity: number; }
type TabId = 'overview' | 'rooms' | 'reviews';

/* ================================================================ */
export function HotelInfo() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = Number(searchParams.get('guests')) || 2;
  const rooms = searchParams.get('rooms') || '1';
  const nights = nightsBetween(checkIn, checkOut);

  /* refs for smooth scroll */
  const overviewRef = useRef<HTMLDivElement>(null);
  const roomsRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  /* data */
  const [hotel, setHotel] = useState<HotelResponse | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [galleryIdx, setGalleryIdx] = useState(0);

  /* reviews */
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  /* reviewable bookings (CHECK_OUT, not yet reviewed, for this hotel) */
  const [reviewableBookings, setReviewableBookings] = useState<{ bookingId: string; bookingCode?: string }[]>([]);

  /* write-review form */
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(8);
  const [reviewPositive, setReviewPositive] = useState('');
  const [reviewNegative, setReviewNegative] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  /* room selections */
  const [selections, setSelections] = useState<RoomSelection[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  /* ---- data fetching ---- */
  useEffect(() => {
    if (!hotelId) return;
    setLoading(true);
    Promise.all([
      hotelApi.getHotelById(hotelId),
      api.get<ApiResponse<RoomTypeResponse[]>>(`/roomType/getByHotelId/${hotelId}`).then((r) => r.data.result ?? []),
    ])
      .then(([h, rt]) => { setHotel(h); setRoomTypes(rt); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hotelId]);

  /* Fetch reviews */
  useEffect(() => {
    if (!hotelId) return;
    setReviewsLoading(true);
    reviewApi.getByHotel(hotelId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [hotelId]);

  /* Fetch reviewable bookings for the current user+hotel */
  useEffect(() => {
    if (!isAuthenticated || !hotelId) return;
    bookingApi.getReviewableBookings()
      .then((list) =>
        setReviewableBookings(
          list
            .filter((b) => b.hotelId === hotelId)
            .map((b) => ({ bookingId: b.bookingId!, bookingCode: b.bookingCode }))
        )
      )
      .catch(() => {});
  }, [isAuthenticated, hotelId]);

  /* ---- tab scroll ---- */
  const scrollTo = useCallback((tab: TabId) => {
    setActiveTab(tab);
    const ref = tab === 'overview' ? overviewRef : tab === 'rooms' ? roomsRef : reviewsRef;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /* ---- room selection ---- */
  const updateSelection = (roomTypeId: string, qty: number) => {
    setSelections((prev) => {
      const filtered = prev.filter((s) => s.roomTypeId !== roomTypeId);
      if (qty > 0) filtered.push({ roomTypeId, quantity: qty });
      return filtered;
    });
  };

  const totalRooms = selections.reduce((sum, s) => sum + s.quantity, 0);

  const totalPrice = useMemo(() =>
    selections.reduce((sum, s) => {
      const rt = roomTypes.find((r) => r.roomTypeId === s.roomTypeId);
      return sum + (rt?.basePrice ?? 0) * s.quantity * nights;
    }, 0),
    [selections, roomTypes, nights]
  );

  /* ---- booking ---- */
  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || selections.length === 0) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await api.post<ApiResponse<{ bookingId?: string }>>(`/booking/create/${hotelId}`, {
        checkInDate: checkIn,
        checkOutDate: checkOut,
        quantity: totalRooms,
        numGuests: guests,
        guestName,
        guestPhone,
        guestEmail,
        specialRequest,
        rooms: selections.map((s) => ({ roomTypeId: s.roomTypeId, quantity: s.quantity })),
      });
      const bid = res.data.result?.bookingId;
      if (bid) {
        const url = await paymentApi.createPayment(bid);
        window.location.href = url;
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setBookingError(msg || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  /* ---- review submit ---- */
  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !selectedBookingId) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const newReview = await reviewApi.create(
        {
          hotelId,
          bookingId: selectedBookingId,
          reviewRating,
          reviewPositiveComment: reviewPositive || undefined,
          reviewNegativeComment: reviewNegative || undefined,
        },
        reviewImages.length > 0 ? reviewImages : undefined,
      );
      setReviews((prev) => [newReview, ...prev]);
      setReviewSuccess(true);
      setShowReviewForm(false);
      setReviewImages([]);
      setReviewableBookings((prev) => prev.filter((b) => b.bookingId !== selectedBookingId));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setReviewError(msg || 'Failed to submit review. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  /* ---- computed review stats ---- */
  const avgScore = useMemo(() => {
    if (hotel?.avgRating && hotel.avgRating > 0) return hotel.avgRating;
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, r) => sum + (r.reviewRating ?? 0), 0) / reviews.length;
  }, [hotel, reviews]);

  const totalReviewCount = hotel?.totalReviews ?? reviews.length;

  /* ================================================================ */
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>Sign in required</h1>
          <p className="subtitle">Please sign in to view hotel details.</p>
          <Link to="/login" className="link-btn">Sign in</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="hd-page">
        <div className="hd-loading">
          <div className="hd-loading-spinner" />
          <p>Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>Hotel not found</h1>
          <Link to="/search" className="link-btn">Back to search</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="hd-page">
      {/* HEADER */}
      <header className="hd-header">
        <div className="hd-header-inner">
          <Link to="/search" className="hd-logo">Hotel Booking</Link>
          <nav className="hd-header-nav">
            <Link to={`/search/results?city=${encodeURIComponent(hotel.hotelCity || '')}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`}>
              Back to results
            </Link>
            <Link to="/dashboard">Dashboard</Link>
          </nav>
        </div>
      </header>

      {/* TABS */}
      <div className="hd-tabs-bar">
        <div className="hd-tabs-inner">
          {(['overview', 'rooms', 'reviews'] as TabId[]).map((t) => (
            <button
              key={t}
              className={`hd-tab ${activeTab === t ? 'hd-tab-active' : ''}`}
              onClick={() => scrollTo(t)}
            >
              {t === 'overview' ? 'Overview' : t === 'rooms' ? 'Rooms' : `Reviews (${totalReviewCount})`}
            </button>
          ))}
        </div>
      </div>

      <div className="hd-body">
        <main className="hd-main">

          {/* ===== OVERVIEW ===== */}
          <section ref={overviewRef} className="hd-section" id="overview">
            <div className="hd-hotel-header">
              <div className="hd-hotel-header-left">
                <div className="hd-name-row">
                  <h1 className="hd-hotel-name">{hotel.hotelName}</h1>
                  {hotel.starRating != null && hotel.starRating > 0 && (
                    <span className="hd-stars">{'★'.repeat(hotel.starRating)}</span>
                  )}
                </div>
                <p className="hd-hotel-address">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {' '}{hotel.hotelAddress && `${hotel.hotelAddress}, `}{hotel.hotelCity}, {hotel.hotelCountry}
                </p>
              </div>
              {avgScore != null && avgScore > 0 && (
                <div className="hd-score-block">
                  <div className="hd-score-text">
                    <span className="hd-score-label">{scoreLabel(avgScore)}</span>
                    <span className="hd-score-count">{totalReviewCount} review{totalReviewCount !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="hd-score-badge" style={{ background: ratingColor(avgScore) }}>
                    {avgScore.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Image Gallery */}
            <div className="hd-gallery">
              <div className="hd-gallery-main">
                <img
                  src={GALLERY_IMAGES[galleryIdx]}
                  alt={hotel.hotelName || 'Hotel'}
                  className="hd-gallery-img"
                />
              </div>
              <div className="hd-gallery-thumbs">
                {GALLERY_IMAGES.map((src, i) => (
                  <button
                    key={i}
                    className={`hd-gallery-thumb ${i === galleryIdx ? 'hd-thumb-active' : ''}`}
                    onClick={() => setGalleryIdx(i)}
                  >
                    <img src={src} alt={`View ${i + 1}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            {hotel.hotelDescription && (
              <div className="hd-description-card">
                <h2>About this property</h2>
                <p>{hotel.hotelDescription}</p>
                <div className="hd-contact-row">
                  {hotel.hotelPhone && (
                    <span className="hd-contact-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      {hotel.hotelPhone}
                    </span>
                  )}
                  {hotel.hotelEmail && (
                    <span className="hd-contact-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      {hotel.hotelEmail}
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ===== ROOMS ===== */}
          <section ref={roomsRef} className="hd-section" id="rooms">
            <h2 className="hd-section-title">Availability</h2>
            {checkIn && checkOut && (
              <p className="hd-dates-summary">
                {nights} night(s): {checkIn} — {checkOut} · {guests} guest(s)
              </p>
            )}

            {roomTypes.length === 0 ? (
              <div className="hd-empty-rooms"><p>No room types available for this hotel.</p></div>
            ) : (
              <div className="hd-room-table">
                <div className="hd-room-thead">
                  <span className="hd-room-th hd-room-th-name">Room type</span>
                  <span className="hd-room-th hd-room-th-guests">Sleeps</span>
                  <span className="hd-room-th hd-room-th-price">Price for {nights} night(s)</span>
                  <span className="hd-room-th hd-room-th-select">Select rooms</span>
                  <span className="hd-room-th hd-room-th-action" />
                </div>

                {roomTypes.map((rt, idx) => {
                  const sel = selections.find((s) => s.roomTypeId === rt.roomTypeId);
                  const qty = sel?.quantity ?? 0;
                  const priceTotal = (rt.basePrice ?? 0) * nights;
                  const roomsLeft = rt.totalRooms ?? 0;

                  return (
                    <div key={rt.roomTypeId} className="hd-room-row">
                      <div className="hd-room-cell hd-room-cell-name">
                        <h3 className="hd-room-name">{rt.roomTypeName}</h3>
                        {rt.roomTypeDesc && <p className="hd-room-desc">{rt.roomTypeDesc}</p>}
                        <ul className="hd-room-amenities">
                          {roomAmenities(idx).map((a) => (
                            <li key={a}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a7c23" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                              {a}
                            </li>
                          ))}
                        </ul>
                        <div className="hd-room-tags">
                          <span className="hd-room-tag hd-room-tag-green">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            Free cancellation
                          </span>
                          <span className="hd-room-tag hd-room-tag-green">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            Breakfast included
                          </span>
                        </div>
                        {roomsLeft > 0 && roomsLeft <= 5 && (
                          <span className="hd-rooms-left">Only {roomsLeft} room(s) left!</span>
                        )}
                      </div>

                      <div className="hd-room-cell hd-room-cell-guests">
                        <span className="hd-guest-icons" title={`Max ${rt.maxOccupy ?? 2} guests`}>
                          {'👤'.repeat(Math.min(rt.maxOccupy ?? 2, 6))}
                        </span>
                      </div>

                      <div className="hd-room-cell hd-room-cell-price">
                        <span className="hd-price-amount">VND {priceTotal.toLocaleString()}</span>
                        <span className="hd-price-note">+ taxes and fees</span>
                        <span className="hd-price-per-night">VND {(rt.basePrice ?? 0).toLocaleString()} / night</span>
                      </div>

                      <div className="hd-room-cell hd-room-cell-select">
                        {checkIn && checkOut ? (
                          <select
                            value={qty}
                            onChange={(e) => updateSelection(rt.roomTypeId, Number(e.target.value))}
                            className="hd-room-qty"
                          >
                            {Array.from({ length: Math.min(roomsLeft + 1, 11) }, (_, i) => (
                              <option key={i} value={i}>{i}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="muted" style={{ fontSize: '0.8rem' }}>Set dates first</span>
                        )}
                      </div>

                      <div className="hd-room-cell hd-room-cell-action">
                        {qty > 0 && (
                          <button className="hd-reserve-inline" onClick={() => scrollTo('overview')}>
                            Reserve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ===== REVIEWS ===== */}
          <section ref={reviewsRef} className="hd-section" id="reviews">
            <div className="hd-reviews-header">
              <h2 className="hd-section-title" style={{ margin: 0 }}>Guest Reviews</h2>
              {/* Show write-review button only if user has eligible bookings */}
              {isAuthenticated && reviewableBookings.length > 0 && !reviewSuccess && !showReviewForm && (
                <button className="hd-write-review-btn" onClick={() => setShowReviewForm(true)}>
                  ✏️ Write a review
                </button>
              )}
            </div>

            {/* Overall score card — only if there are reviews */}
            {(avgScore != null && avgScore > 0) && (
              <div className="hd-review-summary">
                <div className="hd-review-overall">
                  <span className="hd-review-overall-badge" style={{ background: ratingColor(avgScore) }}>
                    {avgScore.toFixed(1)}
                  </span>
                  <div>
                    <span className="hd-review-overall-label">{scoreLabel(avgScore)}</span>
                    <span className="hd-review-overall-count">
                      {totalReviewCount} review{totalReviewCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="hd-review-bars">
                  {[
                    { label: 'Cleanliness', val: Math.min(10, avgScore + 0.3) },
                    { label: 'Comfort', val: Math.min(10, avgScore + 0.1) },
                    { label: 'Location', val: Math.min(10, avgScore + 0.5) },
                    { label: 'Facilities', val: Math.min(10, avgScore - 0.2) },
                    { label: 'Staff', val: Math.min(10, avgScore + 0.4) },
                    { label: 'Value for money', val: Math.min(10, avgScore - 0.1) },
                  ].map((cat) => (
                    <div key={cat.label} className="hd-review-bar-row">
                      <span className="hd-review-bar-label">{cat.label}</span>
                      <div className="hd-review-bar-track">
                        <div className="hd-review-bar-fill" style={{ width: `${Math.max(0, cat.val) * 10}%` }} />
                      </div>
                      <span className="hd-review-bar-val">{cat.val.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Write review success banner */}
            {reviewSuccess && (
              <div className="hd-review-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a7c23" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <p>Your review was submitted successfully. Thank you!</p>
              </div>
            )}

            {/* Write review form */}
            {showReviewForm && !reviewSuccess && (
              <div className="hd-review-form-card">
                <h3>Share your experience</h3>
                <form className="hd-review-form" onSubmit={handleReview}>
                  {reviewError && <div className="error-banner">{reviewError}</div>}

                  <div className="hd-rf-group">
                    <label>Select booking *</label>
                    <select value={selectedBookingId} onChange={(e) => setSelectedBookingId(e.target.value)} required>
                      <option value="">Choose your completed booking...</option>
                      {reviewableBookings.map((b) => (
                        <option key={b.bookingId} value={b.bookingId}>
                          {b.bookingCode || b.bookingId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="hd-rf-group">
                    <label>Overall rating *</label>
                    <div className="hd-rating-picker">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`hd-rating-btn ${n <= reviewRating ? 'hd-rating-active' : ''}`}
                          onClick={() => setReviewRating(n)}
                          title={n.toString()}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <span className="hd-rating-label-text">
                      {reviewRating}/10 — {scoreLabel(reviewRating)}
                    </span>
                  </div>

                  <div className="hd-rf-group">
                    <label>What did you like?</label>
                    <textarea
                      value={reviewPositive}
                      onChange={(e) => setReviewPositive(e.target.value)}
                      rows={3}
                      placeholder="The location was perfect, staff was very friendly..."
                    />
                  </div>

                  <div className="hd-rf-group">
                    <label>What could be improved?</label>
                    <textarea
                      value={reviewNegative}
                      onChange={(e) => setReviewNegative(e.target.value)}
                      rows={3}
                      placeholder="Nothing to complain about!"
                    />
                  </div>

                  <div className="hd-rf-group">
                    <label>Add photos (optional, max 5)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []).slice(0, 5);
                        setReviewImages(files);
                      }}
                      className="hd-rf-file-input"
                    />
                    {reviewImages.length > 0 && (
                      <div className="hd-rf-image-preview">
                        {reviewImages.map((f, i) => (
                          <div key={i} className="hd-rf-preview-item">
                            <img src={URL.createObjectURL(f)} alt={`Preview ${i + 1}`} />
                            <button
                              type="button"
                              className="hd-rf-preview-remove"
                              onClick={() => setReviewImages(prev => prev.filter((_, idx) => idx !== i))}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="hd-rf-actions">
                    <button type="submit" className="hd-rf-submit" disabled={reviewLoading || !selectedBookingId}>
                      {reviewLoading ? 'Submitting...' : 'Submit review'}
                    </button>
                    <button type="button" className="hd-rf-cancel" onClick={() => { setShowReviewForm(false); setReviewError(null); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Review list */}
            {reviewsLoading ? (
              <div className="hd-reviews-loading">
                <div className="hd-loading-spinner" style={{ width: 28, height: 28 }} />
                <span>Loading reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="hd-no-reviews">
                <p>No reviews yet.{isAuthenticated && reviewableBookings.length > 0 ? ' Be the first to share your experience!' : ''}</p>
              </div>
            ) : (
              <div className="hd-review-list">
                {reviews.map((r, idx) => (
                  <div key={r.reviewId ?? idx} className="hd-review-card">
                    <div className="hd-review-card-top">
                      <div className="hd-reviewer-info">
                        <div className="hd-reviewer-avatar">
                          {r.userName ? r.userName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <span className="hd-reviewer-name">{r.userName || 'Anonymous guest'}</span>
                          {r.createdAt && (
                            <span className="hd-review-date">{formatDate(r.createdAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="hd-review-rating-badge" style={{ background: ratingColor(r.reviewRating ?? 0) }}>
                        {r.reviewRating ?? '—'}
                      </div>
                    </div>

                    {r.reviewPositiveComment && (
                      <div className="hd-review-comment hd-review-positive">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#0a7c23" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        <p>{r.reviewPositiveComment}</p>
                      </div>
                    )}
                    {r.reviewNegativeComment && (
                      <div className="hd-review-comment hd-review-negative">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#c53030" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
                        <p>{r.reviewNegativeComment}</p>
                      </div>
                    )}

                    {/* Review images */}
                    {r.reviewImagesList && r.reviewImagesList.length > 0 && (
                      <div className="hd-review-images">
                        {r.reviewImagesList.map((img, i) =>
                          img.reviewImageUrl ? (
                            <img key={i} src={img.reviewImageUrl} alt={`Review image ${i + 1}`} className="hd-review-img" />
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        {/* ===== STICKY SIDEBAR ===== */}
        <aside className="hd-sidebar">
          <div className="hd-sidebar-card">
            <h3 className="hd-sidebar-title">Your booking summary</h3>

            <div className="hd-sidebar-dates">
              <div className="hd-sidebar-date">
                <span className="hd-sidebar-date-label">Check-in</span>
                <span className="hd-sidebar-date-val">{checkIn || '—'}</span>
              </div>
              <div className="hd-sidebar-date">
                <span className="hd-sidebar-date-label">Check-out</span>
                <span className="hd-sidebar-date-val">{checkOut || '—'}</span>
              </div>
            </div>
            <p className="hd-sidebar-nights">{nights} night(s) · {guests} guest(s)</p>

            {selections.length === 0 ? (
              <p className="hd-sidebar-empty">Select rooms from the table above</p>
            ) : (
              <div className="hd-sidebar-selections">
                {selections.map((s) => {
                  const rt = roomTypes.find((r) => r.roomTypeId === s.roomTypeId);
                  return (
                    <div key={s.roomTypeId} className="hd-sidebar-room-row">
                      <span>{s.quantity}× {rt?.roomTypeName}</span>
                      <span>VND {((rt?.basePrice ?? 0) * s.quantity * nights).toLocaleString()}</span>
                    </div>
                  );
                })}
                <div className="hd-sidebar-total-row">
                  <strong>Total</strong>
                  <strong>VND {totalPrice.toLocaleString()}</strong>
                </div>
                <span className="hd-sidebar-tax">+ taxes and fees</span>
              </div>
            )}

            {selections.length > 0 && checkIn && checkOut && (
              <form className="hd-sidebar-form" onSubmit={handleBook}>
                {bookingError && <div className="error-banner" style={{ fontSize: '0.82rem' }}>{bookingError}</div>}
                <div className="hd-sf-group">
                  <label>Full name *</label>
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required placeholder="John Doe" />
                </div>
                <div className="hd-sf-group">
                  <label>Email *</label>
                  <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required placeholder="john@example.com" />
                </div>
                <div className="hd-sf-group">
                  <label>Phone *</label>
                  <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} required placeholder="0123456789" />
                </div>
                <div className="hd-sf-group">
                  <label>Special requests</label>
                  <textarea value={specialRequest} onChange={(e) => setSpecialRequest(e.target.value)} rows={2} placeholder="Late check-in..." />
                </div>
                <button type="submit" className="hd-reserve-btn" disabled={bookingLoading}>
                  {bookingLoading ? 'Processing...' : 'Reserve & Pay'}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
