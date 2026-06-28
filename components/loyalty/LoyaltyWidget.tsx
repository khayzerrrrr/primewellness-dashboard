"use client";

import { Star, Gift, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getNextRewardThreshold, type LoyaltyHistoryEntry } from "@/lib/loyalty";

interface LoyaltyWidgetProps {
  points: number;
  history?: LoyaltyHistoryEntry[];
}

export function LoyaltyWidget({ points, history = [] }: LoyaltyWidgetProps) {
  const { threshold, discount } = getNextRewardThreshold(points);
  const progress = Math.min((points / threshold) * 100, 100);
  const needed = Math.max(threshold - points, 0);

  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <p className="text-xs text-white/70 font-medium">Loyalty Points</p>
            <p className="text-2xl font-bold leading-tight">{points.toLocaleString("id-ID")}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/70">Reward Berikutnya</p>
          <p className="text-sm font-bold">Diskon {discount}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-white/70 mb-1.5">
          <span>{points.toLocaleString("id-ID")} poin</span>
          <span>Target: {threshold.toLocaleString("id-ID")} poin</span>
        </div>
        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {needed > 0 && (
          <p className="text-xs text-white/70 mt-1.5 text-center">
            {needed.toLocaleString("id-ID")} poin lagi untuk diskon {discount}%
          </p>
        )}
        {needed === 0 && (
          <div className="mt-2 flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5 text-xs font-semibold">
            <Gift className="w-3.5 h-3.5" />
            Selamat! Anda berhak mendapatkan diskon {discount}%
          </div>
        )}
      </div>

      {/* Recent history */}
      {history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/20 space-y-1.5">
          <p className="text-xs text-white/60 mb-1">Riwayat Terbaru</p>
          {history.slice(-3).reverse().map((h, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-white/80 truncate flex-1">{h.reason}</span>
              <span className={`font-bold ml-2 flex-shrink-0 ${h.points > 0 ? "text-white" : "text-red-300"}`}>
                {h.points > 0 ? "+" : ""}{h.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
