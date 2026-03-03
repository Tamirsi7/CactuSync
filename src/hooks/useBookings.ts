import { useState, useCallback } from "react";

export interface Booking {
  date: string;
  startSlot: string; // e.g. "14:00"
  endSlot: string;   // e.g. "15:00"
  names: string[];
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const addBooking = useCallback((booking: Booking) => {
    setBookings((prev) => [...prev, booking]);
  }, []);

  const removeBooking = useCallback((index: number) => {
    setBookings((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const isSlotBooked = useCallback(
    (date: string, slot: string) => {
      return bookings.some(
        (b) => b.date === date && slot >= b.startSlot && slot < b.endSlot
      );
    },
    [bookings]
  );

  const getBookingAt = useCallback(
    (date: string, slot: string) => {
      return bookings.find(
        (b) => b.date === date && slot >= b.startSlot && slot < b.endSlot
      );
    },
    [bookings]
  );

  return { bookings, addBooking, removeBooking, isSlotBooked, getBookingAt };
}
