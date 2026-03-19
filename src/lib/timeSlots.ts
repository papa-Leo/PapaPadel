// src/lib/timeSlots.ts
import { format, addMinutes, subMinutes, parse, isBefore, isAfter } from 'date-fns'
import 'dotenv/config'
import { Database } from './supabase'

type Booking = Database['public']['Tables']['bookings']['Row']

const OPEN_TIME = process.env.NEXT_PUBLIC_OPEN_TIME || '07:00'
const CLOSE_TIME = process.env.NEXT_PUBLIC_CLOSE_TIME || '20:00'
const SLOT_STEP = parseInt(process.env.NEXT_PUBLIC_SLOT_STEP || '30')
const SLOT_DURATION = parseInt(process.env.NEXT_PUBLIC_SLOT_DURATION || '60')

/** Generate all possible start times for a day */
export function generateTimeSlots(): string[] {
  const slots: string[] = []
  let current = parse(OPEN_TIME, 'HH:mm', new Date())
  const close = parse(CLOSE_TIME, 'HH:mm', new Date())

  while (isBefore(addMinutes(current, SLOT_DURATION), close) ||
         format(addMinutes(current, SLOT_DURATION), 'HH:mm') === CLOSE_TIME) {
    slots.push(format(current, 'HH:mm'))
    current = addMinutes(current, SLOT_STEP)
  }
  return slots
}

export function getEndTime(startTime: string): string {
  const start = parse(startTime, 'HH:mm', new Date())
  return format(addMinutes(start, SLOT_DURATION), 'HH:mm')
}

export function getUnavailableSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = []
  let current = parse(startTime, 'HH:mm', new Date())
  const open = parse(startTime, 'HH:mm', new Date())
  const close = parse(endTime, 'HH:mm', new Date())

  while (isBefore(current, close)) {
    slots.push(format(current, 'HH:mm'))
    current = addMinutes(current, SLOT_STEP)
  }

  current = subMinutes(open, SLOT_STEP)
  while (isAfter(current, subMinutes(open, SLOT_DURATION))) {
    slots.push(format(current, 'HH:mm'))
    current = subMinutes(current, SLOT_STEP)
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
