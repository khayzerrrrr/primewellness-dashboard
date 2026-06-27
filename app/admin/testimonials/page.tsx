"use client";

import { useEffect, useState } from "react";
import { Star, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTestimonials, updateTestimonial, deleteTestimonial } from "@/lib/firebase/firestore-service";
import { formatDate } from "@/lib/utils";
import type { Testimonial } from "@/types";

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await getTestimonials(false);
    setTestimonials(data);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const togglePublish = async (t: Testimonial) => {
    try {
      await updateTestimonial(t.id, { isPublished: !t.isPublished });
      toast.success(t.isPublished ? "Testimoni disembunyikan" : "Testimoni dipublikasikan");
      load();
    } catch {
      toast.error("Gagal memperbarui testimoni");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus testimoni ini?")) return;
    try {
      await deleteTestimonial(id);
      toast.success("Testimoni dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus testimoni");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Testimoni</h1>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
      ) : testimonials.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada testimoni</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((t) => (
            <Card key={t.id} className={!t.isPublished ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-slate-800">{t.patientName}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < t.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{t.comment}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {t.createdAt != null && typeof t.createdAt === "object" && "toDate" in t.createdAt
                        ? formatDate((t.createdAt as { toDate(): Date }).toDate())
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePublish(t)}
                      title={t.isPublished ? "Sembunyikan" : "Publikasikan"}
                    >
                      {t.isPublished ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
