import React, { useMemo } from 'react'
import { Booking, RoomUnit } from '@/types'
import { RoomRow } from './RoomRow'
import { useAppContext } from '@/context/AppContext'
import { COLUMN_WIDTH_PX, ROOM_COLUMN_WIDTH_PX, TOTAL_DAYS } from './constants'

interface BookingGridProps {
  roomUnits: RoomUnit[]
  bookings: Booking[]
  onBookingClick: (booking: Booking) => void
}

function getDayLabels(startDate: string, totalDays: number): string[] {
  return Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
}

export function BookingGrid({ roomUnits, bookings, onBookingClick }: BookingGridProps) {
  const { config } = useAppContext()

  const dayLabels = useMemo(
    () => getDayLabels(config.dateRangeStart, TOTAL_DAYS),
    [config.dateRangeStart]
  )
  const bookingsByRoomId = useMemo(() => {
    const grouped = new Map<string, Booking[]>()
    bookings.forEach(booking => {
      const roomBookings = grouped.get(booking.roomUnit.roomId) ?? []
      roomBookings.push(booking)
      grouped.set(booking.roomUnit.roomId, roomBookings)
    })
    return grouped
  }, [bookings])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Scrollable grid body */}
      <div
        style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}
      >
        <div style={{ minWidth: TOTAL_DAYS * COLUMN_WIDTH_PX + ROOM_COLUMN_WIDTH_PX }}>
          {/* Header row lives in the same scroll container as the rows to keep columns aligned. */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              display: 'flex',
              borderBottom: '2px solid #ddd',
              background: config.bookingHeaderBackground,
            }}
          >
            <div
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 12,
                width: ROOM_COLUMN_WIDTH_PX,
                minWidth: ROOM_COLUMN_WIDTH_PX,
                padding: '8px 12px',
                fontWeight: 600,
                fontSize: 13,
                borderRight: '1px solid #eee',
                background: config.bookingHeaderBackground,
              }}
            >
              Room
            </div>
            <div
              style={{
                display: 'flex',
                width: TOTAL_DAYS * COLUMN_WIDTH_PX,
                minWidth: TOTAL_DAYS * COLUMN_WIDTH_PX,
              }}
            >
              {dayLabels.map((label, dayIndex) => (
                <div
                  key={dayIndex}
                  style={{
                    width: COLUMN_WIDTH_PX,
                    minWidth: COLUMN_WIDTH_PX,
                    padding: '8px 4px',
                    fontSize: 11,
                    textAlign: 'center',
                    borderRight: '1px solid #eee',
                    color: '#666',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
          {roomUnits.map(room => {
            const roomBookings = bookingsByRoomId.get(room.id) ?? []
            return (
              <RoomRow
                key={room.id}
                rowId={room.id}
                rowName={room.name}
                bookings={roomBookings}
                onBookingClick={onBookingClick}
                dateRangeStart={config.dateRangeStart}
                totalDays={TOTAL_DAYS}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
