import React, { memo, useMemo, useState } from 'react'
import { Booking } from '@/types'
import {
  getClippedBookingPosition,
  getPositionedBookings,
} from './bookingLayout'
import { COLUMN_WIDTH_PX, ROOM_COLUMN_WIDTH_PX } from './constants'

const BASE_ROW_HEIGHT = 40
const BOOKING_BAR_HEIGHT = 24
const BOOKING_BAR_GAP = 4
const BOOKING_BAR_TOP = 6

interface RoomRowProps {
  rowId: string
  rowName: string
  bookings: Booking[]
  onBookingClick: (booking: Booking) => void
  dateRangeStart: string
  totalDays: number
}

function RoomRowComponent({
  rowId,
  rowName,
  bookings,
  onBookingClick,
  dateRangeStart,
  totalDays,
}: RoomRowProps) {
  console.log('render', rowId)

  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null)

  const positionedBookings = useMemo(() => {
    return getPositionedBookings(bookings, dateRangeStart, totalDays)
  }, [bookings, dateRangeStart, totalDays])

  const isHovered = hoveredDayIndex !== null
  const laneCount =
    positionedBookings.reduce((maxLane, { lane }) => Math.max(maxLane, lane), 0) +
    1
  const rowHeight = Math.max(
    BASE_ROW_HEIGHT,
    BOOKING_BAR_TOP + laneCount * (BOOKING_BAR_HEIGHT + BOOKING_BAR_GAP) + 6,
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: rowHeight,
        borderBottom: '1px solid #eee',
        background: isHovered ? '#f0f7ff' : 'white',
      }}
    >
      <div
        style={{
          position: 'sticky',
          left: 0,
          width: ROOM_COLUMN_WIDTH_PX,
          minWidth: ROOM_COLUMN_WIDTH_PX,
          height: rowHeight,
          padding: '8px 12px',
          fontWeight: 500,
          fontSize: 13,
          borderRight: '1px solid #eee',
          background: isHovered ? '#f0f7ff' : 'white',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {rowName}
      </div>

      <div
        style={{
          position: 'relative',
          height: rowHeight,
          width: totalDays * COLUMN_WIDTH_PX,
          minWidth: totalDays * COLUMN_WIDTH_PX,
        }}
      >
        {/* Day cell backgrounds */}
        {Array.from(
          { length: totalDays },
          (_, i) => {
            const dayIndex = i
            const isCellHovered = hoveredDayIndex === dayIndex
            return (
              <div
                key={dayIndex}
                style={{
                  position: 'absolute',
                  left: dayIndex * COLUMN_WIDTH_PX,
                  width: COLUMN_WIDTH_PX,
                  height: rowHeight,
                  background: isCellHovered ? '#e3f2fd' : 'transparent',
                  borderRight: '1px solid #f0f0f0',
                  cursor: 'default',
                }}
                onMouseEnter={() => setHoveredDayIndex(dayIndex)}
                onMouseLeave={() => setHoveredDayIndex(null)}
              />
            )
          },
        )}

        {/* Booking bars */}
        {positionedBookings.map(({ booking, startDay, endDay, color, lane, hasOverlap }) => {
          const { left, width, startsBeforeRange, endsAfterRange } =
            getClippedBookingPosition(startDay, endDay, totalDays)
          return (
            <div
              key={booking.id}
              title={`${booking.guestName} (${booking.status})${hasOverlap ? ' - overlapping booking' : ''}${startsBeforeRange ? ' - starts before visible range' : ''}${endsAfterRange ? ' - ends after visible range' : ''}`}
              onClick={() => onBookingClick(booking)}
              style={{
                position: 'absolute',
                left,
                width: width - 2,
                height: BOOKING_BAR_HEIGHT,
                top: BOOKING_BAR_TOP + lane * (BOOKING_BAR_HEIGHT + BOOKING_BAR_GAP),
                background: color,
                borderRadius: `${startsBeforeRange ? 0 : 4}px ${endsAfterRange ? 0 : 4}px ${endsAfterRange ? 0 : 4}px ${startsBeforeRange ? 0 : 4}px`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 6,
                fontSize: 11,
                color: 'white',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                zIndex: 2,
                boxShadow: hasOverlap ? '0 0 0 2px rgba(0,0,0,0.18)' : 'none',
              }}
            >
              {booking.guestName}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const RoomRow = memo(RoomRowComponent)
