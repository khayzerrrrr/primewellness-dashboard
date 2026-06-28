"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface RatingModalProps {
  appointmentId: string;
  therapistId?: string;
  therapistName?: string;
  patientId: string;
  patientName: string;
  serviceName?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function RatingModal({
  appointmentId,
  therapistId,
  therapistName,
  patientId,
  patientName,
  serviceName,
  onClose,
  onSubmitted,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Pilih rating bintang terlebih dahulu");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "reviews"), {
        appointmentId,
        therapistId: therapistId || "",
        therapistName: therapistName || "",
        patientId,
        patientName,
        serviceName: serviceName || "",
        rating,
        comment: comment.trim(),
        createdAt: Timestamp.now(),
      });
      toast.success("Terima kasih atas ulasan Anda!");
      onSubmitted();
    } catch {
      toast.error("Gagal menyimpan ulasan");
    } finally {
      setSaving(false);
    }
  };

  const displayRating = hovered || rating;

  const ratingLabels: Record<number, string> = {
    1: "Sangat Buruk",
    2: "Buruk",
    3: "Cukup",
    4: "Baik",
    5: "Sangat Baik",
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0A1628]">Berikan Ulasan</DialogTitle>
          <DialogDescription>
            Bagaimana pengalaman terapi Anda{therapistName ? ` dengan ${therapistName}` : ""}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {serviceName && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="text-gray-500 text-xs mb-0.5">Layanan</p>
              <p className="font-medium text-slate-800">{serviceName}</p>
              {therapistName && <p className="text-xs text-gray-500 mt-0.5">Terapis: {therapistName}</p>}
            </div>
          )}

          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Tap bintang untuk memberikan nilai</p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      star <= displayRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <p className="text-sm font-medium text-[#1B3A6B]">
                {ratingLabels[displayRating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Komentar (opsional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman terapi Anda..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
              Lewati
            </Button>
            <Button
              className="flex-1 bg-[#0A1628] hover:bg-[#1B3A6B]"
              onClick={handleSubmit}
              disabled={saving || rating === 0}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
              ) : (
                "Kirim Ulasan"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
