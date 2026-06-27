"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Stethoscope, Loader2, Database } from "lucide-react";
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
import { getServices, createService, updateService, deleteService } from "@/lib/firebase/firestore-service";
import { formatCurrency } from "@/lib/utils";
import { DEFAULT_SERVICES } from "@/lib/constants";
import type { Service } from "@/types";

interface ServiceForm {
  name: string;
  description: string;
  duration: number;
  price: number;
  status: "active" | "inactive";
}

const BLANK: ServiceForm = { name: "", description: "", duration: 60, price: 300000, status: "active" };

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(BLANK);

  const set = (k: keyof ServiceForm, v: ServiceForm[keyof ServiceForm]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const load = async () => {
    const data = await getServices(false);
    setServices(data);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const openCreate = () => { setEditId(null); setForm(BLANK); setOpen(true); };
  const openEdit = (s: Service) => {
    setEditId(s.id);
    setForm({ name: s.name, description: s.description, duration: s.duration, price: s.price, status: s.status });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) { toast.error("Nama dan deskripsi wajib diisi"); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateService(editId, form);
        toast.success("Layanan berhasil diperbarui");
      } else {
        await createService(form);
        toast.success("Layanan berhasil ditambahkan");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Gagal menyimpan layanan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus layanan ini?")) return;
    try {
      await deleteService(id);
      toast.success("Layanan dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus layanan");
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm(`Tambahkan ${DEFAULT_SERVICES.length} layanan default TCM? Layanan yang sudah ada tidak akan terduplikasi.`)) return;
    setSeeding(true);
    try {
      let added = 0;
      for (const svc of DEFAULT_SERVICES) {
        const exists = services.some((s) => s.name.toLowerCase() === svc.name.toLowerCase());
        if (!exists) {
          await createService({ ...svc, status: "active" });
          added++;
        }
      }
      toast.success(added > 0 ? `${added} layanan default berhasil ditambahkan` : "Semua layanan default sudah ada");
      load();
    } catch {
      toast.error("Gagal menambahkan layanan default");
    }
    setSeeding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Layanan Terapi ({services.length})</h1>
          <p className="text-gray-500 text-sm">Kelola layanan yang ditawarkan klinik</p>
        </div>
        <div className="flex gap-2">
          {services.length === 0 && (
            <Button
              variant="outline"
              className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50"
              onClick={handleSeedDefaults}
              disabled={seeding}
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Isi Layanan Default
            </Button>
          )}
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(BLANK); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a2744] hover:bg-[#2a3a60] gap-2" onClick={openCreate}>
                <Plus className="w-4 h-4" />
                Tambah Layanan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Layanan" : "Tambah Layanan"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Layanan *</Label>
                  <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Contoh: Pijat Refleksi" />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi *</Label>
                  <Textarea required value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Deskripsi singkat layanan..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durasi (menit)</Label>
                    <Input type="number" min={5} value={form.duration} onChange={(e) => set("duration", Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Harga (IDR)</Label>
                    <Input type="number" min={0} value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as "active" | "inactive")}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
                <Button type="submit" className="w-full bg-[#1a2744] hover:bg-[#2a3a60]" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Seed button when there are services but user wants to add defaults */}
      {services.length > 0 && services.length < DEFAULT_SERVICES.length && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-center justify-between gap-3">
          <p className="text-sm text-teal-700">Belum semua layanan default tersedia. Tambahkan layanan TCM standar sekaligus?</p>
          <Button size="sm" variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-100 gap-1 flex-shrink-0" onClick={handleSeedDefaults} disabled={seeding}>
            {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
            Isi Default
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">Belum ada layanan</p>
          <p className="text-gray-400 text-sm mb-4">Klik tombol &quot;Isi Layanan Default&quot; untuk menambahkan layanan TCM standar secara otomatis</p>
          <Button onClick={handleSeedDefaults} disabled={seeding} className="bg-teal-600 hover:bg-teal-700 gap-2">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Isi Layanan Default
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className={`border-0 shadow-sm overflow-hidden ${service.status === "inactive" ? "opacity-60" : ""}`}>
              <div className="h-1 bg-gradient-to-r from-teal-500 to-teal-400" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(service)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800 mb-1 text-sm">{service.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-teal-700">{formatCurrency(service.price)}</span>
                  <span className="text-xs text-gray-400">{service.duration} menit</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
