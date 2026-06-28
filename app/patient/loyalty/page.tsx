"use client";

import { useEffect, useState } from "react";
import { Star, Gift, ChevronRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { addLoyaltyPoints, getNextRewardThreshold, type LoyaltyHistoryEntry } from "@/lib/loyalty";

const REWARDS = [
  { points: 500, discount: 5, label: "Diskon 5%" },
  { points: 1000, discount: 10, label: "Diskon 10%" },
  { points: 2500, discount: 15, label: "Diskon 15%" },
  { points: 5000, discount: 20, label: "Diskon 20%" },
  { points: 10000, discount: 25, label: "Diskon 25%" },
];

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<LoyaltyHistoryEntry[]>([]);
  const [patientDocId, setPatientDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      try {
        const snap = await getDocs(query(
          collection(db, "patients"),
          where("userId", "==", user.uid)
        ));
        if (!snap.empty) {
          const d = snap.docs[0];
          setPatientDocId(d.id);
          setPoints(d.data().loyaltyPoints ?? 0);
          setHistory(d.data().loyaltyHistory ?? []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [user?.uid]);

  const { threshold, discount } = getNextRewardThreshold(points);
  const progress = Math.min((points / threshold) * 100, 100);

  const handleRedeem = async (reward: typeof REWARDS[0]) => {
    if (!patientDocId || !user?.uid) return;
    if (points < reward.points) {
      toast.error("Poin tidak cukup untuk reward ini");
      return;
    }
    setRedeeming(reward.points);
    try {
      // Deduct points
      await addLoyaltyPoints(patientDocId, -reward.points, `Redeem: ${reward.label}`);
      // Create a promo/discount record for front-office to use
      await addDoc(collection(db, "loyalty_redemptions"), {
        patientId: user.uid,
        patientDocId,
        patientName: user.displayName || user.email || "Pasien",
        discount: reward.discount,
        pointsUsed: reward.points,
        status: "active",
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      });
      setPoints((p) => p - reward.points);
      setHistory((h) => [
        ...h,
        { points: -reward.points, reason: `Redeem: ${reward.label}`, createdAt: Date.now() },
      ]);
      toast.success(`Berhasil menukarkan ${reward.points} poin untuk ${reward.label}! Tunjukkan kode ini ke front-office saat pembayaran.`);
    } catch {
      toast.error("Gagal menukarkan poin");
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1628]">Poin Loyalty</h1>
        <p className="text-gray-500 text-sm mt-1">Kumpulkan poin dari setiap sesi terapi dan tukarkan dengan diskon</p>
      </div>

      {/* Points Banner */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Star className="w-6 h-6 fill-white" />
          </div>
          <div>
            <p className="text-white/70 text-sm">Total Poin Anda</p>
            <p className="text-4xl font-bold">{points.toLocaleString("id-ID")}</p>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-xs text-white/70 mb-1.5">
            <span>Poin saat ini</span>
            <span>Target reward berikutnya: {threshold.toLocaleString("id-ID")} poin ({discount}% off)</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <p className="text-xs text-white/60 mt-2">
          Setiap sesi terapi selesai = +100 poin otomatis
        </p>
      </div>

      {/* Reward Catalog */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#0A1628] flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Katalog Reward
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {REWARDS.map((r) => {
            const canRedeem = points >= r.points;
            return (
              <div
                key={r.points}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  canRedeem
                    ? "border-amber-200 bg-amber-50"
                    : "border-gray-100 bg-gray-50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${canRedeem ? "bg-amber-500" : "bg-gray-300"}`}>
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{r.label}</p>
                    <p className="text-xs text-gray-500">{r.points.toLocaleString("id-ID")} poin</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={!canRedeem || redeeming !== null}
                  onClick={() => handleRedeem(r)}
                  className={canRedeem ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                  variant={canRedeem ? "default" : "outline"}
                >
                  {redeeming === r.points ? (
                    <span className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  ) : canRedeem ? (
                    <>Tukar <ChevronRight className="w-3 h-3 ml-1" /></>
                  ) : (
                    `Butuh ${(r.points - points).toLocaleString("id-ID")} lagi`
                  )}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#0A1628]">Riwayat Poin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...history].reverse().map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.points > 0 ? "bg-green-100" : "bg-red-100"}`}>
                    {h.points > 0 ? (
                      <Star className="w-4 h-4 text-green-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{h.reason}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(h.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${h.points > 0 ? "text-green-600" : "text-red-500"}`}>
                  {h.points > 0 ? "+" : ""}{h.points}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {history.length === 0 && points === 0 && (
        <div className="text-center py-10 text-gray-400">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada poin. Selesaikan sesi terapi pertama Anda untuk mulai mengumpulkan poin!</p>
        </div>
      )}
    </div>
  );
}
