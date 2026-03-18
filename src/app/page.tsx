'use client'
// src/app/page.tsx
import { useState, useEffect, useCallback } from 'react'
import { parse, format, addDays, startOfToday, isBefore } from 'date-fns'
import { LogIn, LogOut, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient, Database } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { CLOSE_TIME, SLOT_DURATION, MAX_ADVANCE_BOOKING_DAYS } from '@/lib/timeSlots'
import CourtCard from '@/components/CourtCard'
import BookingModal from '@/components/BookingModal'
import MyBookings from '@/components/MyBookings'
import AuthForm from '@/components/AuthForm'

type Court = Database['public']['Tables']['courts']['Row']

type ActiveModal =
  | { type: 'auth' }
  | { type: 'booking'; court: Court; startTime: string }
  | { type: 'myBookings'; onClose: () => void }
  | null;

export default function Home() {
  const defaultDate = isBefore(Date.now(), parse(CLOSE_TIME, 'HH:mm', new Date())) ? format(startOfToday(), 'yyyy-MM-dd') : format(addDays(startOfToday(), 1), 'yyyy-MM-dd')
  const today = startOfToday()
  const maxDate = addDays(today, MAX_ADVANCE_BOOKING_DAYS)

  const supabase = createClient()
  const { user, loading: authLoading, signOut } = useAuth()
  const [courts, setCourts] = useState<Court[]>([])
  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [courtFilter, setCourtFilter] = useState<'all' | 'indoor' | 'outdoor'>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    supabase.from('courts').select('*').eq('is_active', true).then(({ data }) => {
      setCourts(data ?? [])
    })
  }, [])

  const changeDate = (delta: number) => {
    const current = new Date(selectedDate + 'T00:00')
    const next = addDays(current, delta)
    if (next >= today && next <= maxDate) {
      setSelectedDate(format(next, 'yyyy-MM-dd'))
    }
  }

  const filteredCourts = courts.filter(c =>
    courtFilter === 'all' ? true :
    courtFilter === 'indoor' ? c.is_indoor :
    !c.is_indoor
  )

  const handleBookingSuccess = useCallback(() => {
    setActiveModal(null)
    setRefreshKey(k => k + 1) // re-render CourtCards to refresh slots
  }, [])

  const handleBookingsClose = useCallback((wasCancellation: boolean) => {
    setActiveModal(null)
    wasCancellation && setRefreshKey(k => k + 1) // re-render CourtCards to refresh slots
  }, [])

  return (
    <div className="app">
      {/* NAV */}
      <nav className="navbar">
        <div className="nav-brand">
          <span className="logo-mark">⬡</span>
          AcaPadel
        </div>
        <div className="nav-actions">
          {!authLoading && (
            user ? (
              <>
                <button className="btn-ghost" onClick={() => setActiveModal({ type: 'myBookings' })}>
                  <Calendar size={16} /> My Bookings
                </button>
                <button className="btn-ghost" onClick={signOut}>
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => setActiveModal({ type: 'auth' })}>
                <LogIn size={16} /> Sign In
              </button>
            )
          )}
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <h1>Book A Slot</h1>
        <p>Reserve a padel session instantly. {SLOT_DURATION.toString()}-minute slots, no hassle.</p>
      </header>

      {/* DATE PICKER */}
      <div className="date-strip">
        <button className="date-nav" onClick={() => changeDate(-1)} disabled={selectedDate === format(today, 'yyyy-MM-dd')}>
          <ChevronLeft size={18} />
        </button>
        <div className="date-display" onClick={() => setSelectedDate(defaultDate)}>
          <span className="date-label">
            {selectedDate === format(today, 'yyyy-MM-dd') ? 'Today' :
             selectedDate === format(addDays(today, 1), 'yyyy-MM-dd') ? 'Tomorrow' :
             format(new Date(selectedDate + 'T00:00'), 'EEEE')}
          </span>
          <span className="date-value">{format(new Date(selectedDate + 'T00:00'), 'MMMM d, yyyy')}</span>
        </div>
        <button className="date-nav" onClick={() => changeDate(1)} disabled={selectedDate === format(maxDate, 'yyyy-MM-dd')}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* FILTER */}
      {/*<div className="filter-bar">
        {(['all', 'outdoor', 'indoor'] as const).map(f => (
          <button
            key={f}
            className={`filter-btn ${courtFilter === f ? 'active' : ''}`}
            onClick={() => setCourtFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>*/}

      {/* COURTS */}
      <main className="courts-grid" key={refreshKey}>
        {filteredCourts.map(court => (
          <CourtCard
            key={court.id}
            court={court}
            selectedDate={selectedDate}
            isLoggedIn={!!user}
            onSlotSelect={(court, startTime) =>
              setActiveModal({ type: 'booking', court, startTime })
            }
          />
        ))}
        {filteredCourts.length === 0 && (
          <p className="no-courts">No {courtFilter !== 'all' ? courtFilter : ''} courts found.</p>
        )}
      </main>

      {/* LEGEND */}
      <div className="legend">
        <span className="legend-item available">Available</span>
        <span className="legend-item booked">Booked</span>
        <span className="legend-item past">Past</span>
      </div>

      {/* MODALS */}
      {activeModal?.type === 'auth' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <AuthForm onClose={() => setActiveModal(null)} />
          </div>
        </div>
      )}

      {activeModal?.type === 'booking' && user && (
        <BookingModal
          court={activeModal.court}
          date={selectedDate}
          startTime={activeModal.startTime}
          userId={user.id}
          onClose={() => setActiveModal(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {activeModal?.type === 'myBookings' && user && (
        <div className="modal-overlay" onClick={() => handleBookingsClose(true)}>
          <div className="modal-card wide" onClick={e => e.stopPropagation()}>
            <MyBookings
              userId={user.id}
              onClose={(wasCancellation) => handleBookingsClose(wasCancellation)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
