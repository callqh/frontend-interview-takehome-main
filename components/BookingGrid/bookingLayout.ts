import { Booking, BookingStatus } from '@/types'
import { COLUMN_WIDTH_PX, MS_PER_DAY } from './constants'

const STATUS_COLORS: Record<BookingStatus, string> = {
  confirmed: '#4CAF50',
  pending: '#FF9800',
  in_house: '#2196F3',
  checked_out: '#9E9E9E',
  cancelled: '#F44336',
}

interface VisibleBooking {
  booking: Booking
  startDay: number
  endDay: number
  color: string
}

export interface PositionedBooking extends VisibleBooking {
  lane: number
  hasOverlap: boolean
}

export interface ClippedBookingPosition {
  left: number
  width: number
  startsBeforeRange: boolean
  endsAfterRange: boolean
}

function getBookingStatus(status: BookingStatus): string {
  return STATUS_COLORS[status] ?? '#ccc'
}

function getDayOffset(date: string, rangeStartTime: number): number {
  return Math.floor((new Date(date).getTime() - rangeStartTime) / MS_PER_DAY)
}

function bookingsOverlap(a: VisibleBooking, b: VisibleBooking): boolean {
  // The current product rule treats checkOut as an occupied day, so ranges are inclusive.
  return a.startDay <= b.endDay && b.startDay <= a.endDay
}

function assignBookingLanes(bookings: VisibleBooking[]): PositionedBooking[] {
  const sortedBookings = [...bookings].sort(
    (a, b) => a.startDay - b.startDay || a.endDay - b.endDay,
  )
  const laneEndDays: number[] = []

  return sortedBookings.map((booking, index) => {
    // Reuse the first lane whose previous booking has fully ended before this one starts.
    const laneIndex = laneEndDays.findIndex(
      (laneEndDay) => booking.startDay > laneEndDay,
    )
    const lane = laneIndex === -1 ? laneEndDays.length : laneIndex
    laneEndDays[lane] = booking.endDay

    return {
      ...booking,
      lane,
      hasOverlap: sortedBookings.some((otherBooking, otherIndex) => {
        return index !== otherIndex && bookingsOverlap(booking, otherBooking)
      }),
    }
  })
}

export function getPositionedBookings(
  bookings: Booking[],
  dateRangeStart: string,
  totalDays: number,
): PositionedBooking[] {
  const rangeStartTime = new Date(dateRangeStart).getTime()

  const bookingsInRange = bookings
    .map((booking) => {
      const startDay = getDayOffset(booking.checkIn, rangeStartTime)
      const endDay = getDayOffset(booking.checkOut, rangeStartTime)
      const color = getBookingStatus(booking.status)
      return { booking, startDay, endDay, color }
    })
    .filter(({ startDay, endDay }) => {
      // Keep bookings that intersect the visible date range; rendering is clipped later.
      return endDay >= 0 && startDay < totalDays
    })

  return assignBookingLanes(bookingsInRange)
}

export function getClippedBookingPosition(
  startDay: number,
  endDay: number,
  totalDays: number,
): ClippedBookingPosition {
  const visibleStartDay = Math.max(startDay, 0)
  const visibleEndDay = Math.min(endDay, totalDays - 1)

  // Clip only the visual bar. The original dates still drive details and overlap detection.
  return {
    left: visibleStartDay * COLUMN_WIDTH_PX,
    width: (visibleEndDay - visibleStartDay + 1) * COLUMN_WIDTH_PX,
    startsBeforeRange: startDay < 0,
    endsAfterRange: endDay >= totalDays,
  }
}
