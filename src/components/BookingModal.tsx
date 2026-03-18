'use client'
// src/components/BookingModal.tsx
import { useState } from 'react'
import { X, Clock, Users, Calendar, MapPin } from 'lucide-react'
import { createClient, Database } from '@/lib/supabase'
import { formatTime, getEndTime } from '@/lib/timeSlots'
import { format } from 'date-fns'

type Court = Database['public']['Tables']['courts']['Row']

interface BookingModalProps {
  court: Court
  date: string
  startTime: string
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function BookingModal({
  court, date, startTime, userId, onClose, onSuccess,
}: BookingModalProps) {
  const supabase = createClient()
  const [playerCount, setPlayerCount] = useState(4)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const endTime = getEndTime(startTime)
  const MAXIMUM_BOOKINGS = 2

  const handleBook = async () => {
    setLoading(true)
    setError(null)

    // Check availability first
    const { data: available } = await supabase.rpc('is_slot_available', {
      p_court_id: court.id,
      p_date: date,
      p_start: startTime,
      p_end: endTime,
    })

    if (!available) {
      setError('This slot was just booked. Please choose another time.')
      setLoading(false)
      return
    }

    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'confirmed');

    if (countError) {
      setError('Failed to check your bookings. Please try again.')
      setLoading(false)
      return
    }

    console.log(`count: ${count}`)

    if (count === null || count >= 2) {
      setError('You have reached your maximum booking limit. Cancel a previous booking to make a new one.')
      setLoading(false)
      return
    }

    const { error: bookingError } = await supabase.from('bookings').insert({
      court_id: court.id,
      user_id: userId,
      date,
      start_time: startTime,
      end_time: endTime,
      player_count: playerCount || 4,
      notes: notes || undefined,
      status: 'confirmed',
    })

    if (bookingError) {
      setError('Booking failed. The slot may no longer be available.')
      console.log(bookingError)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>

        <div className="modal-header">
          <span className={`court-badge ${court.is_indoor ? 'indoor' : 'outdoor'}`}>
            {court.is_indoor ? 'Indoor' : 'Outdoor'}
          </span>
          <h2>{court.name}</h2>
          <p>{court.description}</p>
        </div>

        <div className="booking-details">
          <div className="detail-item">
            <Calendar size={16} />
            <span>{format(new Date(date + 'T00:00'), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="detail-item">
            <Clock size={16} />
            <span>{formatTime(startTime)} – {formatTime(endTime)} (60 min)</span>
          </div>
          <div className="detail-item">
            <MapPin size={16} />
            <span>{court.name}</span>
          </div>
        </div>

        {/*<div className="form-group">
          <label>
            <Users size={16} />
            Number of players
          </label>
          <div className="player-count">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                className={`count-btn ${playerCount === n ? 'active' : ''}`}
                onClick={() => setPlayerCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>*/}

        {/*<div className="form-group">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            placeholder="Any special requirements..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
          />
        </div>*/}

        {error && <div className="error-msg">{error}</div>}

        <button
          className="btn-confirm"
          onClick={handleBook}
          disabled={loading}
        >
          {loading ? 'Confirming...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  )
}
