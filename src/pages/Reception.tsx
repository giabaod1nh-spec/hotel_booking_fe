import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import { roomApi } from '../api/roomApi';
import type { BookingResponse, BookingRoomItemResponse } from '../types/api';

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending payment',
  CONFIRMED: 'Confirmed',
  CHECK_IN: 'Checked in',
  CHECK_OUT: 'Checked out',
  CANCELLED: 'Cancelled',
};

export function Reception() {
  const [bookingCode, setBookingCode] = useState('');
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSearch = useCallback(async () => {
    const code = bookingCode.trim();
    if (!code) {
      setError('Enter a booking code');
      return;
    }
    setError('');
    setBooking(null);
    setSuccessMsg('');
    setAssignments({});
    setLoading(true);
    try {
      const data = await bookingApi.getByBookingCode(code);
      setBooking(data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr?.response?.data?.message || 'Booking not found');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingCode]);

  const handleAssignRoom = useCallback((bookingRoomId: string, roomId: string) => {
    setAssignments((prev) => ({ ...prev, [bookingRoomId]: roomId }));
  }, []);

  const handleCheckIn = useCallback(async () => {
    if (!booking?.bookingId) return;
    const rooms: { bookingRoomId: string; roomId: string }[] = [];
    for (const [brId, roomId] of Object.entries(assignments)) {
      if (roomId) rooms.push({ bookingRoomId: brId, roomId });
    }
    const items = booking?.bookingRoomItemResponses ?? [];
    const missing = items.filter((r) => r.bookingRoomId && !assignments[r.bookingRoomId]);
    if (missing.length > 0) {
      setError('Assign a room for each booking item');
      return;
    }
    setError('');
    setActionLoading(true);
    try {
      await bookingApi.checkIn(booking.bookingId, rooms);
      setSuccessMsg('Check-in successful');
      handleSearch();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr?.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  }, [booking, assignments, handleSearch]);

  const handleCheckOut = useCallback(async () => {
    if (!booking?.bookingId) return;
    setError('');
    setActionLoading(true);
    try {
      await bookingApi.checkOut(booking.bookingId);
      setSuccessMsg('Check-out successful');
      handleSearch();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr?.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  }, [booking, handleSearch]);

  const status = booking?.status ?? '';
  const canCheckIn = status === 'CONFIRMED';
  const canCheckOut = status === 'CHECK_IN';

  return (
    <div className="reception-page">
      <nav className="reception-nav">
        <Link to="/" className="reception-nav-logo">Hotel Booking</Link>
        <div className="reception-nav-links">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </nav>

      <main className="reception-main">
        <div className="reception-container">
          <h1 className="reception-title">Reception</h1>
          <p className="reception-sub">Look up bookings and process check-in / check-out</p>

          <div className="reception-search">
            <input
              type="text"
              placeholder="Enter booking code (e.g. BK12345678)"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="reception-input"
            />
            <button onClick={handleSearch} disabled={loading} className="reception-btn reception-btn-primary">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {error && <div className="reception-error">{error}</div>}
          {successMsg && <div className="reception-success">{successMsg}</div>}

          {booking && (
            <div className="reception-booking">
              <div className="reception-booking-header">
                <h2>{booking.hotelName}</h2>
                <span className={`reception-status reception-status-${status.toLowerCase()}`}>
                  {STATUS_LABELS[status] ?? status}
                </span>
              </div>

              <div className="reception-booking-grid">
                <div className="reception-booking-card">
                  <h3>Guest details</h3>
                  <dl className="reception-dl">
                    <dt>Guest</dt>
                    <dd>{booking.guestName ?? '—'}</dd>
                    <dt>Email</dt>
                    <dd>{booking.guestEmail ?? '—'}</dd>
                    <dt>Phone</dt>
                    <dd>{booking.guestPhone ?? '—'}</dd>
                    <dt>Check-in</dt>
                    <dd>{formatDate(booking.checkInDate)}</dd>
                    <dt>Check-out</dt>
                    <dd>{formatDate(booking.checkOutDate)}</dd>
                    <dt>Booking code</dt>
                    <dd><strong>{booking.bookingCode}</strong></dd>
                  </dl>
                </div>

                <div className="reception-booking-card">
                  <h3>Rooms & assignment</h3>
                  {canCheckIn && (
                    <RoomAssignmentForm
                      items={booking.bookingRoomItemResponses ?? []}
                      assignments={assignments}
                      onAssign={handleAssignRoom}
                    />
                  )}
                  {!canCheckIn && (
                    <div className="reception-rooms-list">
                      {(booking.bookingRoomItemResponses ?? []).map((r) => (
                        <div key={r.bookingRoomId ?? r.roomTypeId} className="reception-room-row">
                          <span>{r.quantity ?? 1}× {r.roomTypeName ?? 'Room'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="reception-actions">
                {canCheckIn && (
                  <button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="reception-btn reception-btn-primary reception-btn-lg"
                  >
                    {actionLoading ? 'Processing...' : 'Check in'}
                  </button>
                )}
                {canCheckOut && (
                  <button
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                    className="reception-btn reception-btn-success reception-btn-lg"
                  >
                    {actionLoading ? 'Processing...' : 'Check out'}
                  </button>
                )}
                {!canCheckIn && !canCheckOut && status && (
                  <p className="reception-no-action">
                    No action available for status &quot;{STATUS_LABELS[status] ?? status}&quot;
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function RoomAssignmentForm({
  items,
  assignments,
  onAssign,
}: {
  items: BookingRoomItemResponse[];
  assignments: Record<string, string>;
  onAssign: (bookingRoomId: string, roomId: string) => void;
}) {
  return (
    <div className="reception-assign-list">
      {items.map((item, idx) => (
        <RoomAssignmentRow
          key={item.bookingRoomId ?? `${item.roomTypeId}-${idx}`}
          item={item}
          index={idx}
          total={items.length}
          selectedRoomId={item.bookingRoomId ? assignments[item.bookingRoomId] : ''}
          onSelect={(roomId) => item.bookingRoomId && onAssign(item.bookingRoomId, roomId)}
        />
      ))}
    </div>
  );
}

function RoomAssignmentRow({
  item,
  index,
  total,
  selectedRoomId,
  onSelect,
}: {
  item: BookingRoomItemResponse;
  index: number;
  total: number;
  selectedRoomId: string;
  onSelect: (roomId: string) => void;
}) {
  const [rooms, setRooms] = useState<{ roomId?: string; roomNumber?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const roomTypeId = item.roomTypeId;

  useEffect(() => {
    if (!roomTypeId) return;
    setLoading(true);
    roomApi.getAvailableByRoomType(roomTypeId)
      .then(setRooms)
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, [roomTypeId]);

  const label = total > 1 ? `Room ${index + 1}: ${item.roomTypeName ?? 'Room'}` : `${item.roomTypeName ?? 'Room'}`;

  return (
    <div className="reception-assign-row">
      <div className="reception-assign-label">
        <span>{label}</span>
        {loading && <span className="reception-loading-txt">Loading rooms...</span>}
      </div>
      <select
        value={selectedRoomId}
        onChange={(e) => onSelect(e.target.value)}
        className="reception-select"
        disabled={rooms.length === 0}
      >
        <option value="">Select room</option>
        {rooms.map((r) => (
          <option key={r.roomId} value={r.roomId}>
            {r.roomNumber ?? r.roomId}
          </option>
        ))}
      </select>
    </div>
  );
}
