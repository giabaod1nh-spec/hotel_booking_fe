import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchApi } from '../api/searchApi';
import type { HotelSearchResponse, PageResponse } from '../types/api';

/* ---- helpers ---- */
const PAGE_SIZE = 8;

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=280&fit=crop',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=280&fit=crop',
];

function fallbackImg(idx: number) {
  return FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
}

function reviewLabel(score: number): string {
  if (score >= 9) return 'Wonderful';
  if (score >= 8) return 'Very Good';
  if (score >= 7) return 'Good';
  if (score >= 6) return 'Pleasant';
  return 'Fair';
}

function nightCount(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(diff / 86_400_000));
}

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'rating_desc' | 'score_desc';

const SORT_MAP: Record<SortOption, { sortBy: string; direction: string }> = {
  default:     { sortBy: 'createdAt',  direction: 'desc' },
  price_asc:   { sortBy: 'price',      direction: 'asc'  },
  price_desc:  { sortBy: 'price',      direction: 'desc' },
  rating_desc: { sortBy: 'starRating', direction: 'desc' },
  score_desc:  { sortBy: 'score',      direction: 'desc' },
};

/* ================================================================ */
export function SearchResults() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const city     = searchParams.get('city')     || '';
  const checkIn  = searchParams.get('checkIn')  || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests   = Number(searchParams.get('guests') || '2');
  const rooms    = Number(searchParams.get('rooms')  || '1');

  /* ---------- server state ---------- */
  const [pageData, setPageData] = useState<PageResponse<HotelSearchResponse> | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  /* ---------- filter/sort ---------- */
  const [page, setPage]               = useState(0);
  const [filterStars, setFilterStars] = useState<number[]>([]);
  const [sortBy, setSortBy]           = useState<SortOption>('default');

  /* ---------- fetch ---------- */
  const fetchResults = useCallback(async (targetPage: number) => {
    if (!city.trim() || !checkIn || !checkOut) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await searchApi.searchHotels({
        city:       city.trim(),
        checkIn,
        checkOut,
        totalGuest: guests,
        totalRoom:  rooms,
        starRating: filterStars.length > 0 ? filterStars : undefined,
        page:       targetPage,
        size:       PAGE_SIZE,
        ...SORT_MAP[sortBy],
      });
      setPageData(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg || 'Failed to load results. Please try again.');
      setPageData(null);
    } finally {
      setLoading(false);
    }
  }, [city, checkIn, checkOut, guests, rooms, filterStars, sortBy]);

  /* Re-fetch when filters/sort change → back to page 0 */
  useEffect(() => {
    setPage(0);
    fetchResults(0);
  }, [fetchResults]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchResults(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleStar = (star: number) =>
    setFilterStars(prev =>
      prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
    );

  /* ---------- auth guard ---------- */
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>Sign in required</h1>
          <p className="subtitle">Please sign in to view search results.</p>
          <Link to="/login" className="link-btn">Sign in</Link>
        </div>
      </div>
    );
  }

  const hotels        = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages    = pageData?.totalPages ?? 0;
  const nights        = nightCount(checkIn, checkOut);

  /* ================================================================ */
  return (
    <div className="sr-page">

      {/* ---- Sticky header ---- */}
      <header className="sr-header">
        <div className="sr-header-inner">
          <Link to="/" className="sr-logo">Hotel Booking</Link>
          <div className="sr-header-summary">
            <span className="sr-header-city">{city}</span>
            {checkIn && checkOut && (
              <span className="sr-header-dates">{checkIn} — {checkOut}</span>
            )}
            <span className="sr-header-guests">{guests} guest(s) · {rooms} room(s)</span>
          </div>
          <nav className="sr-header-nav">
            <Link to="/">New search</Link>
            <Link to="/dashboard">Dashboard</Link>
          </nav>
        </div>
      </header>

      <div className="sr-body">

        {/* ---- Sidebar ---- */}
        <aside className="sr-sidebar">
          <div className="sr-filter-card">
            <h3 className="sr-filter-title">Filter by:</h3>

            {/* Star rating — sent to backend */}
            <div className="sr-filter-group">
              <h4 className="sr-filter-label">Star rating</h4>
              <div className="sr-star-options">
                {[5, 4, 3, 2, 1].map(star => (
                  <label key={star} className="sr-checkbox-row">
                    <input
                      type="checkbox"
                      checked={filterStars.includes(star)}
                      onChange={() => toggleStar(star)}
                    />
                    <span className="sr-star-label">
                      {'★'.repeat(star)}{'☆'.repeat(5 - star)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Trip summary */}
            <div className="sr-filter-group">
              <h4 className="sr-filter-label">Your search</h4>
              <div className="sr-trip-summary">
                <div className="sr-trip-row"><span>Destination</span><strong>{city}</strong></div>
                <div className="sr-trip-row"><span>Check-in</span><strong>{checkIn || '—'}</strong></div>
                <div className="sr-trip-row"><span>Check-out</span><strong>{checkOut || '—'}</strong></div>
                <div className="sr-trip-row"><span>Nights</span><strong>{nights}</strong></div>
                <div className="sr-trip-row"><span>Guests</span><strong>{guests}</strong></div>
                <div className="sr-trip-row"><span>Rooms</span><strong>{rooms}</strong></div>
              </div>
              <Link to="/" className="sr-modify-btn">Modify search</Link>
            </div>
          </div>
        </aside>

        {/* ---- Main ---- */}
        <main className="sr-main">

          {/* Toolbar */}
          <div className="sr-toolbar">
            <p className="sr-found">
              <strong>{city}:</strong>{' '}
              {loading
                ? 'Searching...'
                : `${totalElements.toLocaleString()} ${totalElements === 1 ? 'property' : 'properties'} found`}
            </p>
            <div className="sr-sort">
              <label htmlFor="sr-sort-select">Sort by:</label>
              <select
                id="sr-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
              >
                <option value="default">Our top picks</option>
                <option value="price_asc">Price (lowest first)</option>
                <option value="price_desc">Price (highest first)</option>
                <option value="rating_desc">Stars (highest first)</option>
                <option value="score_desc">Review score (highest first)</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {filterStars.length > 0 && (
            <div className="sr-active-filters">
              {[...filterStars].sort((a, b) => b - a).map(s => (
                <span key={s} className="sr-filter-chip">
                  {'★'.repeat(s)}
                  <button onClick={() => toggleStar(s)}>×</button>
                </span>
              ))}
              <button className="sr-clear-filters" onClick={() => setFilterStars([])}>
                Clear all
              </button>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="sr-error-banner">
              <span>⚠ {error}</span>
              <button onClick={() => fetchResults(page)}>Retry</button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="sr-skeleton-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="sr-skeleton-card">
                  <div className="sr-skeleton-img" />
                  <div className="sr-skeleton-body">
                    <div className="sr-skeleton-line sr-skeleton-w60" />
                    <div className="sr-skeleton-line sr-skeleton-w40" />
                    <div className="sr-skeleton-line sr-skeleton-w80" />
                    <div className="sr-skeleton-line sr-skeleton-w30" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && hotels.length === 0 && (
            <div className="sr-empty">
              <div className="sr-empty-icon">🏨</div>
              <h3>No properties found</h3>
              <p>
                We couldn't find any properties in <strong>{city}</strong>
                {filterStars.length > 0 ? ' with the selected star ratings' : ''}.
              </p>
              {filterStars.length > 0 ? (
                <button className="link-btn" onClick={() => setFilterStars([])}>
                  Clear filters
                </button>
              ) : (
                <Link to="/" className="link-btn">New search</Link>
              )}
            </div>
          )}

          {/* Hotel cards */}
          {!loading && hotels.length > 0 && (
            <div className="sr-hotel-list">
              {hotels.map((hotel, idx) => {
                const score   = hotel.adjustedScore ?? 0;
                const imgUrl  = hotel.primaryImageUrl || fallbackImg(page * PAGE_SIZE + idx);
                const price   = hotel.lowestPrice ?? 0;
                const reviews = hotel.totalReview ?? hotel.reviewCount ?? 0;

                return (
                  <article key={hotel.hotelId} className="sr-hotel-card">

                    {/* Image */}
                    <div className="sr-hotel-img-wrap">
                      <img
                        src={imgUrl}
                        alt={hotel.hotelName || 'Hotel'}
                        className="sr-hotel-img"
                        loading="lazy"
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src = fallbackImg(idx);
                        }}
                      />
                    </div>

                    {/* Body */}
                    <div className="sr-hotel-body">
                      <div className="sr-hotel-top">
                        <div className="sr-hotel-info">

                          {/* Name + stars */}
                          <div className="sr-hotel-name-row">
                            <Link
                              to={`/hotel/${hotel.hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`}
                              className="sr-hotel-name"
                            >
                              {hotel.hotelName}
                            </Link>
                            {(hotel.starRating ?? 0) > 0 && (
                              <span className="sr-hotel-stars">
                                {'★'.repeat(hotel.starRating!)}
                              </span>
                            )}
                          </div>

                          {/* Location */}
                          <p className="sr-hotel-location">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {' '}{hotel.hotelCity}{hotel.hotelCountry ? `, ${hotel.hotelCountry}` : ''}
                            {hotel.hotelAddress && (
                              <span className="sr-hotel-address"> · {hotel.hotelAddress}</span>
                            )}
                          </p>

                          {/* Recommended room type */}
                          {hotel.recommendRoomType && (
                            <p className="sr-room-recommend">
                              <strong>{hotel.recommendRoomType}</strong>
                              {hotel.bedSummary && ` · ${hotel.bedSummary}`}
                            </p>
                          )}

                          {/* Amenity tags */}
                          {hotel.amenities && hotel.amenities.length > 0 && (
                            <div className="sr-hotel-tags">
                              {hotel.amenities.slice(0, 4).map(a => (
                                <span key={a.amenityId} className="sr-tag sr-tag-gray">
                                  {a.amenityName}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Description */}
                          {hotel.hotelDesc && (
                            <p className="sr-hotel-desc">
                              {hotel.hotelDesc.length > 140
                                ? `${hotel.hotelDesc.slice(0, 140)}...`
                                : hotel.hotelDesc}
                            </p>
                          )}
                        </div>

                        {/* Score block */}
                        <div className="sr-hotel-score-col">
                          {score > 0 && (
                            <div className="sr-review-block">
                              <div className="sr-review-text">
                                <span className="sr-review-label">{reviewLabel(score)}</span>
                                {reviews > 0 && (
                                  <span className="sr-review-count">
                                    {reviews.toLocaleString()} reviews
                                  </span>
                                )}
                              </div>
                              <span className="sr-review-badge">{score.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price + CTA */}
                      <div className="sr-hotel-bottom">
                        <div className="sr-hotel-price-block">
                          {price > 0 ? (
                            <>
                              <span className="sr-nights-label">
                                {nights} night{nights !== 1 ? 's' : ''}, {guests} guest{guests !== 1 ? 's' : ''}
                              </span>
                              <span className="sr-hotel-price">
                                VND {(price * nights).toLocaleString()}
                              </span>
                              <span className="sr-tax-note">Includes taxes and fees</span>
                            </>
                          ) : (
                            <span className="sr-price-na">Contact for pricing</span>
                          )}
                        </div>
                        <Link
                          to={`/hotel/${hotel.hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`}
                          className="sr-availability-btn"
                        >
                          See availability
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <nav className="sr-pagination">
              <button
                className="sr-page-btn"
                disabled={page === 0}
                onClick={() => goToPage(page - 1)}
              >
                ‹ Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i)
                .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 2)
                .reduce<(number | '...')[]>((acc, i, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) + 1 < i) acc.push('...');
                  acc.push(i);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...'
                    ? <span key={`e-${idx}`} className="sr-page-ellipsis">…</span>
                    : (
                      <button
                        key={item}
                        className={`sr-page-btn ${item === page ? 'sr-page-active' : ''}`}
                        onClick={() => goToPage(item as number)}
                      >
                        {(item as number) + 1}
                      </button>
                    )
                )}

              <button
                className="sr-page-btn"
                disabled={!pageData?.hasNext}
                onClick={() => goToPage(page + 1)}
              >
                Next ›
              </button>
            </nav>
          )}

          {/* Page info */}
          {!loading && totalElements > 0 && (
            <p className="sr-page-info">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} of{' '}
              {totalElements.toLocaleString()} properties
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
