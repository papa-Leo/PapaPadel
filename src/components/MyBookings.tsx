'use client'
// src/components/MyBookings.tsx
import { useState, useEffect } from 'react'
import { Calendar, Clock, X, CheckCircle } from 'lucide-react'
import { createClient, Database } from '@/lib/supabase'
import { formatTime } from '@/lib/timeSlots'
import { format, isPast, parseISO, subDays } from 'date-fns'
import ConfirmationDialog from '@/components/ConfirmationDialog'

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  courts: { name: string; is_indoor: boolean } | null
}

interface MyBookingsProps {
  userId: string
  onClose: (wasCancellation: boolean) => void
}

// export default function MyBookings({ userId }: { userId: string }) {
export default function MyBookings({
  userId,
  onClose,
}: MyBookingsProps) {
  const supabase = createClient()
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [pastBookings, setPastBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [wasCancellation, setWasCancellation] = useState<boolean>(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState<boolean>(false)

  const fetchBookings = async () => {
    const { data: upcomingData } = await supabase
      .from('bookings')
      .select('*, courts(name, is_indoor)')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    const { data: pastData } = await supabase
      .from('bookings')
      .select('*, courts(name, is_indoor)')
      .eq('user_id', userId)
      .neq('status', 'confirmed')
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })

    setUpcomingBookings((upcomingData as Booking[]) ?? [])
    setPastBookings((pastData as Booking[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchBookings() }, [userId])

  const handleCancel = async (bookingId: string) => {
    // if (!confirm('Are you sure you want to cancel this booking?')) return

    setCancellingId(bookingId)
    setShowConfirmationDialog(true)
  }

  const upcoming = upcomingBookings.filter(b =>
    b.status === 'confirmed' && !isPast(parseISO(`${b.date}T${b.end_time}`))
  )

  const past = pastBookings.filter(b =>
    b.status !== 'confirmed' || isPast(parseISO(`${b.date}T${b.end_time}`))
  )
  .slice(0, 5)

  if (loading) return <div className="my-bookings-loading">Loading your bookings...</div>

  return (
    <div className="my-bookings">
      <h2>My Bookings</h2>

      <section>
        <button className="modal-close" onClick={() => onClose(wasCancellation)}><X size={20} /></button>

        <h3>Upcoming ({upcoming.length})</h3>
        {upcoming.length === 0 ? (
          <p className="empty-state">No upcoming bookings. Go book a session!</p>
        ) : (
          upcoming.map(b => (
            <div key={b.id} className="booking-item upcoming">
              <div className="booking-item-info">
                <strong>{b.courts?.name}</strong>
                <span className={`badge ${b.courts?.is_indoor ? 'indoor' : 'outdoor'}`}>
                  {b.courts?.is_indoor ? 'Indoor' : 'Outdoor'}
                </span>
                <div className="booking-item-meta">
                  <Calendar size={13} />
                  {format(parseISO(b.date), 'EEE, MMM d')}
                  <Clock size={13} />
                  {formatTime(b.start_time.slice(0, 5))} – {formatTime(b.end_time.slice(0, 5))} · {b.player_count} players
                </div>
              </div>
              <button
                className="btn-cancel"
                onClick={() => handleCancel(b.id)}
                disabled={cancellingId === b.id}
              >
                <X size={14} /> {cancellingId === b.id ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          ))
        )}
      </section>

      {past.length > 0 && (
        <section className="past-bookings">
          <h3>Past & Cancelled</h3>
          {past.map(b => (
            <div key={b.id} className={`booking-item ${b.status}`}>
              <div className="booking-item-info">
                <strong>{b.courts?.name}</strong>
                <span className={`status-badge ${b.status}`}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span>
                <div className="booking-item-meta">
                  <Calendar size={13} />
                  {format(parseISO(b.date), 'EEE, MMM d')}
                  <Clock size={13} />
                  {formatTime(b.start_time.slice(0, 5))} – {formatTime(b.end_time.slice(0, 5))}
                </div>
              </div>
              <CheckCircle size={16} className="past-icon" />
            </div>
          ))}
        </section>
      )}

      {showConfirmationDialog && (
        <ConfirmationDialog
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking?"
          onConfirm={async () => {
            await supabase
              .from('bookings')
              .update({ status: 'cancelled' })
              .eq('id', cancellingId!)
            await fetchBookings()
            setCancellingId(null)
            setWasCancellation(true)
            setShowConfirmationDialog(false)
          }}
          onCancel={() => {
            setShowConfirmationDialog(false)
            setCancellingId(null)
          }}
        />
      )}
    </div>
  )
}
