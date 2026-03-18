'use client'
// src/components/CourtCard.tsx
import { useState, useEffect } from 'react'
import { Wind, Home, Clock } from 'lucide-react'
import { createClient, Database } from '@/lib/supabase'
import { generateTimeSlots, formatTime, getEndTime, isSlotPast, getBookedSlotsInBooking } from '@/lib/timeSlots'

type Court = Database['public']['Tables']['courts']['Row']

interface CourtCardProps {
  court: Court
  selectedDate: string
  onSlotSelect: (court: Court, startTime: string) => void
  isLoggedIn: boolean
}

export default function CourtCard({ court, selectedDate, onSlotSelect, isLoggedIn }: CourtCardProps) {
  const supabase = createClient()
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const allSlots = generateTimeSlots()

  useEffect(() => {
    const fetchBooked = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('court_id', court.id)
        .eq('date', selectedDate)
        .eq('status', 'confirmed')

      setBookedSlots(new Set((data ?? []).map(b => getBookedSlotsInBooking(b.start_time.slice(0, 5))).flat()))
      // setBookedSlots(new Set((data ?? []).map(b => b.start_time.slice(0, 5))))
      setLoading(false)
    }
    fetchBooked()
  }, [court.id, selectedDate])

  return (
    <div className="court-card">
      <div className="court-card-header">
        <div className="court-info">
          {court.is_indoor ? <Home size={18} /> : <Wind size={18} />}
          <div>
            <h3>{court.name}</h3>
            <span className={`badge ${court.is_indoor ? 'indoor' : 'outdoor'}`}>
              {court.is_indoor ? 'Indoor' : 'Outdoor'}
            </span>
          </div>
        </div>
        {court.description && <p className="court-desc">{court.description}</p>}
      </div>

      <div className="slots-label">
        <Clock size={14} />
        Available slots
      </div>

      {loading ? (
        <div className="slots-loading">Loading availability...</div>
      ) : (
        <div className="slots-grid">
          {allSlots.map(slot => {
            const isBooked = bookedSlots.has(slot)
            const isPast = isSlotPast(selectedDate, slot)
            const isAvailable = !isBooked && !isPast

            return (
              <button
                key={slot}
                className={`slot-btn ${isBooked ? 'booked' : ''} ${isPast ? 'past' : ''} ${isAvailable ? 'available' : ''}`}
                disabled={!isAvailable || !isLoggedIn}
                onClick={() => isAvailable && isLoggedIn && onSlotSelect(court, slot)}
                title={
                  !isLoggedIn ? 'Sign in to book' :
                  isBooked ? 'Already booked' :
                  isPast ? 'Time passed' :
                  `Book ${formatTime(slot)} – ${formatTime(getEndTime(slot))}`
                }
              >
                {formatTime(slot)}
              </button>
            )
          })}
        </div>
      )}

      {!isLoggedIn && (
        <p className="login-hint">Sign in to book a slot</p>
      )}
    </div>
  )
}
