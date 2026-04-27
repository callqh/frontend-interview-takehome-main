import React, { memo, useMemo, useState } from "react";
import { Booking, BookingStatus } from "@/types";

const COLUMN_WIDTH_PX = 48;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const BASE_ROW_HEIGHT = 40;
const BOOKING_BAR_HEIGHT = 24;
const BOOKING_BAR_GAP = 4;
const BOOKING_BAR_TOP = 6;

interface RoomRowProps {
  rowId: string;
  rowName: string;
  bookings: Booking[];
  visibleStartIndex: number;
  visibleEndIndex: number;
  onBookingClick: (booking: Booking) => void;
  dateRangeStart: string;
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  confirmed: "#4CAF50",
  pending: "#FF9800",
  in_house: "#2196F3",
  checked_out: "#9E9E9E",
  cancelled: "#F44336",
};

interface VisibleBooking {
  booking: Booking;
  startDay: number;
  endDay: number;
  color: string;
}

interface PositionedBooking extends VisibleBooking {
  lane: number;
  hasOverlap: boolean;
}

function getBookingStatus(status: BookingStatus): string {
  return STATUS_COLORS[status] ?? "#ccc";
}

function getDayOffset(date: string, rangeStartTime: number): number {
  return Math.floor((new Date(date).getTime() - rangeStartTime) / MS_PER_DAY);
}

function bookingsOverlap(a: VisibleBooking, b: VisibleBooking): boolean {
  return a.startDay <= b.endDay && b.startDay <= a.endDay;
}

function assignBookingLanes(bookings: VisibleBooking[]): PositionedBooking[] {
  const sortedBookings = [...bookings].sort(
    (a, b) => a.startDay - b.startDay || a.endDay - b.endDay,
  );
  const laneEndDays: number[] = [];

  return sortedBookings.map((booking, index) => {
    const laneIndex = laneEndDays.findIndex(
      (laneEndDay) => booking.startDay > laneEndDay,
    );
    const lane = laneIndex === -1 ? laneEndDays.length : laneIndex;
    laneEndDays[lane] = booking.endDay;

    return {
      ...booking,
      lane,
      hasOverlap: sortedBookings.some((otherBooking, otherIndex) => {
        return index !== otherIndex && bookingsOverlap(booking, otherBooking);
      }),
    };
  });
}

function RoomRowComponent({
  rowId,
  rowName,
  bookings,
  visibleStartIndex,
  visibleEndIndex,
  onBookingClick,
  dateRangeStart,
}: RoomRowProps) {
  console.log("render", rowId);

  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  const visibleBookings = useMemo(() => {
    const rangeStartTime = new Date(dateRangeStart).getTime();

    const visibleItems = bookings
      .map((b) => {
        const startDay = getDayOffset(b.checkIn, rangeStartTime);
        const endDay = getDayOffset(b.checkOut, rangeStartTime);
        const color = getBookingStatus(b.status);
        return { booking: b, startDay, endDay, color };
      })
      .filter(({ startDay, endDay }) => {
        return endDay >= visibleStartIndex && startDay <= visibleEndIndex;
      });

    return assignBookingLanes(visibleItems);
  }, [bookings, visibleStartIndex, visibleEndIndex, dateRangeStart]);

  const isHovered = hoveredDayIndex !== null;
  const laneCount =
    visibleBookings.reduce((maxLane, { lane }) => Math.max(maxLane, lane), 0) +
    1;
  const rowHeight = Math.max(
    BASE_ROW_HEIGHT,
    BOOKING_BAR_TOP + laneCount * (BOOKING_BAR_HEIGHT + BOOKING_BAR_GAP) + 6,
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        minHeight: rowHeight,
        borderBottom: "1px solid #eee",
        background: isHovered ? "#f0f7ff" : "white",
      }}
    >
      <div
        style={{
          width: 140,
          minWidth: 140,
          padding: "8px 12px",
          fontWeight: 500,
          fontSize: 13,
          borderRight: "1px solid #eee",
          background: "white",
          zIndex: 1,
        }}
      >
        {rowName}
      </div>

      <div style={{ position: "relative", height: rowHeight, flex: 1 }}>
        {/* Day cell backgrounds */}
        {Array.from(
          { length: visibleEndIndex - visibleStartIndex + 1 },
          (_, i) => {
            const dayIndex = visibleStartIndex + i;
            const isCellHovered = hoveredDayIndex === dayIndex;
            return (
              <div
                key={dayIndex}
                style={{
                  position: "absolute",
                  left: (dayIndex - visibleStartIndex) * COLUMN_WIDTH_PX,
                  width: COLUMN_WIDTH_PX,
                  height: rowHeight,
                  background: isCellHovered ? "#e3f2fd" : "transparent",
                  borderRight: "1px solid #f0f0f0",
                  cursor: "default",
                }}
                onMouseEnter={() => setHoveredDayIndex(dayIndex)}
                onMouseLeave={() => setHoveredDayIndex(null)}
              />
            );
          },
        )}

        {/* Booking bars */}
        {visibleBookings.map(({ booking, startDay, endDay, color, lane, hasOverlap }) => {
          const left = Math.max(
            0,
            (startDay - visibleStartIndex) * COLUMN_WIDTH_PX,
          );
          const width =
            (Math.min(endDay, visibleEndIndex) -
              Math.max(startDay, visibleStartIndex) +
              1) *
            COLUMN_WIDTH_PX;
          return (
            <div
              key={booking.id}
              title={`${booking.guestName} (${booking.status})${hasOverlap ? " - overlapping booking" : ""}`}
              onClick={() => onBookingClick(booking)}
              style={{
                position: "absolute",
                left,
                width: width - 2,
                height: BOOKING_BAR_HEIGHT,
                top: BOOKING_BAR_TOP + lane * (BOOKING_BAR_HEIGHT + BOOKING_BAR_GAP),
                background: color,
                borderRadius: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                paddingLeft: 6,
                fontSize: 11,
                color: "white",
                overflow: "hidden",
                whiteSpace: "nowrap",
                zIndex: 2,
                boxShadow: hasOverlap ? "0 0 0 2px rgba(0,0,0,0.18)" : "none",
              }}
            >
              {booking.guestName}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const RoomRow = memo(RoomRowComponent);
