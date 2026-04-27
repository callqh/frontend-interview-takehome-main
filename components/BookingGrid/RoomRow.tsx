import React, { memo, useMemo, useState } from "react";
import { Booking, BookingStatus } from "@/types";

const COLUMN_WIDTH_PX = 48;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

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

function getBookingStatus(status: BookingStatus): string {
  return STATUS_COLORS[status] ?? "#ccc";
}

function getDayOffset(date: string, rangeStartTime: number): number {
  return Math.floor((new Date(date).getTime() - rangeStartTime) / MS_PER_DAY);
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

    return bookings
      .map((b) => {
        const startDay = getDayOffset(b.checkIn, rangeStartTime);
        const endDay = getDayOffset(b.checkOut, rangeStartTime);
        const color = getBookingStatus(b.status);
        return { booking: b, startDay, endDay, color };
      })
      .filter(({ startDay, endDay }) => {
        return endDay >= visibleStartIndex && startDay <= visibleEndIndex;
      });
  }, [bookings, visibleStartIndex, visibleEndIndex, dateRangeStart]);

  const isHovered = hoveredDayIndex !== null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
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

      <div style={{ position: "relative", height: 40, flex: 1 }}>
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
                  height: 40,
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
        {visibleBookings.map(({ booking, startDay, endDay, color }) => {
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
              title={`${booking.guestName} (${booking.status})`}
              onClick={() => onBookingClick(booking)}
              style={{
                position: "absolute",
                left,
                width: width - 2,
                height: 28,
                top: 6,
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
