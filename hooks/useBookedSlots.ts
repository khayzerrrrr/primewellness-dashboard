"use client";

import { useEffect, useState } from "react";
import { subscribeToBookedSlots } from "@/lib/firebase/firestore-service";

const SESSION_DURATION_MINUTES = 60;

function timeToMinutes(slot: string): number {
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + m;
}

export type SlotStatus = "available" | "booked" | "in_progress";

/**
 * Returns a map of timeSlot → status based on existing appointments
 * for the given doctor on the given date.
 * Overlap logic: each session occupies SESSION_DURATION_MINUTES.
 */
export function useBookedSlots(
  doctorId: string | null | undefined,
  date: Date | null | undefined
) {
  const [rawBooked, setRawBooked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doctorId || !date) {
      setRawBooked([]);
      return;
    }
    setLoading(true);
    const unsub = subscribeToBookedSlots(doctorId, date, (slots) => {
      setRawBooked(slots);
      setLoading(false);
    });
    return unsub;
  }, [doctorId, date?.toDateString()]);

  /**
   * Given a candidate time slot, check if it overlaps with any booked slot.
   * A booked slot at HH:MM blocks the interval [HH:MM, HH:MM + 60 min).
   */
  function isBlocked(candidateSlot: string): boolean {
    const candidateStart = timeToMinutes(candidateSlot);
    const candidateEnd = candidateStart + SESSION_DURATION_MINUTES;
    return rawBooked.some((booked) => {
      const bookedStart = timeToMinutes(booked);
      const bookedEnd = bookedStart + SESSION_DURATION_MINUTES;
      return candidateStart < bookedEnd && candidateEnd > bookedStart;
    });
  }

  return { rawBooked, isBlocked, loading };
}
