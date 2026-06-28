import { db } from "@/lib/firebase/config";
import { doc, updateDoc, arrayUnion, increment, Timestamp } from "firebase/firestore";

export interface LoyaltyHistoryEntry {
  points: number;
  reason: string;
  createdAt: number; // millis
}

export async function addLoyaltyPoints(patientId: string, points: number, reason: string) {
  await updateDoc(doc(db, "patients", patientId), {
    loyaltyPoints: increment(points),
    loyaltyHistory: arrayUnion({
      points,
      reason,
      createdAt: Timestamp.now().toMillis(),
    }),
  });
}

export function getNextRewardThreshold(points: number): { threshold: number; discount: number } {
  if (points < 500) return { threshold: 500, discount: 5 };
  if (points < 1000) return { threshold: 1000, discount: 10 };
  if (points < 2500) return { threshold: 2500, discount: 15 };
  if (points < 5000) return { threshold: 5000, discount: 20 };
  return { threshold: 10000, discount: 25 };
}
