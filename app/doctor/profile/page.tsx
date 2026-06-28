"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/utils";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  serviceName: string;
  createdAt: { toMillis(): number };
}

export default function DoctorProfilePage() {
  const { user, userData } = useAuth();
  const displayName = (userData?.displayName as string) || user?.displayName || "Dokter";
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      try {
        const snap = await getDocs(query(
          collection(db, "reviews"),
          where("therapistId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(20)
        ));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
        setReviews(data);
        if (data.length > 0) {
          setAvgRating(data.reduce((s, r) => s + r.rating, 0) / data.length);
        }
      } catch { /* ignore */ }
      setLoadingReviews(false);
    };
    load();
  }, [user?.uid]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profil Dokter</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-[#1B3A6B] text-white text-xl">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
              <p className="text-gray-500">{user?.email}</p>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-600">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({reviews.length} ulasan)</span>
                </div>
              )}
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-[#0A1628]">
              Update profil dokter dilakukan melalui Admin Dashboard. Hubungi administrator untuk perubahan data.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#0A1628] flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            Ulasan Pasien
            {reviews.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-auto">
                Rata-rata {avgRating.toFixed(1)} / 5
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingReviews ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada ulasan dari pasien</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{r.patientName}</p>
                      <p className="text-xs text-gray-400">{r.serviceName}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {[1,2,3,4,5].map(s => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-600 italic">&quot;{r.comment}&quot;</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(r.createdAt?.toMillis?.() ?? 0).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
