// src/lib/timeSlots.ts
import { format, addMinutes, parse, isBefore } from 'date-fns'

export const SLOT_DURATION = 60 // minutes
export const SLOT_STEP = 30 // minutes between possible bookings
export const OPEN_TIME = '07:00'
export const CLOSE_TIME = '20:00'
export const MAX_ADVANCE_BOOKING_DAYS = 14 // book up to 2 weeks ahead

/** Generate all possible start times for a day */
export function generateTimeSlots(): string[] {
  const slots: string[] = []
  let current = parse(OPEN_TIME, 'HH:mm', new Date())
  const close = parse(CLOSE_TIME, 'HH:mm', new Date())

  while (isBefore(addMinutes(current, SLOT_DURATION), close) ||
         format(addMinutes(current, SLOT_DURATION), 'HH:mm') === CLOSE_TIME) {
    slots.push(format(current, 'HH:mm'))
    current = addMinutes(current, SLOT_STEP)
    if (!isBefore(addMinutes(current, SLOT_DURATION), close) &&
        format(addMinutes(current, SLOT_DURATION), 'HH:mm') !== CLOSE_TIME) break
  }
  return slots
}

export function getEndTime(startTime: string): string {
  const start = parse(startTime, 'HH:mm', new Date())
  return format(addMinutes(start, SLOT_DURATION), 'HH:mm')
}

export function getBookedSlotsInBooking(startTime: string): string[] {
  const slots: string[] = []
  let current = parse(startTime, 'HH:mm', new Date())
  const close = addMinutes(parse(startTime, 'HH:mm', new Date()), SLOT_DURATION)

  while (isBefore(current, close)) {
    slots.push(format(current, 'HH:mm'))
    current = addMinutes(current, SLOT_STEP)
  }
  return slots
}

export function formatTime(time: string): string {
  const parsed = parse(time, 'HH:mm', new Date())
  return format(parsed, 'HH:mm')
}

// export function isSlotInPeriod(slotTime: string, periodStartTime: string, periodEndTime: string): boolean {
//   const slot = parse(slotTime, 'HH:mm', new Date())
//   const start = parse(periodStartTime, 'HH:mm', new Date())
//   const end = parse(periodEndTime, 'HH:mm', new Date())
//   return isBefore(start, slot) && isBefore(slot, end)
// }

export function isSlotPast(date: string, startTime: string): boolean {
  const slotDateTime = new Date(`${date}T${startTime}`)
  return slotDateTime < new Date()
}
