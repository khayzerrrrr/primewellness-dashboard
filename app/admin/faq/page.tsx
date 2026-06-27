"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { HelpCircle, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getFAQs, createFAQ, updateFAQ, deleteFAQ } from "@/lib/firebase/firestore-service";
import type { FAQ } from "@/types";

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<{ question: string; answer: string; order: number }>();

  const load = async () => {
    const data = await getFAQs(false);
    setFaqs(data);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const onSubmit = async (data: { question: string; answer: string; order: number }) => {
    setSaving(true);
    try {
      if (editId) {
        await updateFAQ(editId, { ...data, isPublished: true });
        toast.success("FAQ diperbarui");
      } else {
        await createFAQ({ ...data, isPublished: true });
        toast.success("FAQ ditambahkan");
      }
      setOpen(false);
      reset();
      setEditId(null);
      load();
    } catch {
      toast.error("Gagal menyimpan FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditId(faq.id);
    reset({ question: faq.question, answer: faq.answer, order: faq.order });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus FAQ?")) return;
    try {
      await deleteFAQ(id);
      toast.success("FAQ dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus FAQ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">FAQ</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { reset(); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Tambah FAQ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit FAQ" : "Tambah FAQ"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input {...register("order", { valueAsNumber: true })} type="number" defaultValue={faqs.length + 1} />
              </div>
              <div className="space-y-2">
                <Label>Pertanyaan</Label>
                <Input {...register("question")} />
              </div>
              <div className="space-y-2">
                <Label>Jawaban</Label>
                <Textarea {...register("answer")} rows={4} />
              </div>
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
      ) : faqs.length === 0 ? (
        <div className="text-center py-16">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada FAQ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 mb-1">{faq.question}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(faq)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => handleDelete(faq.id)}
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
