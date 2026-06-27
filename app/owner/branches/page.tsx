"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, MapPin, Phone, Mail, User,
  Building2, Loader2, CheckCircle2, XCircle, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBranches, createBranch, updateBranch, deleteBranch } from "@/lib/firebase/firestore-service";
import type { Branch } from "@/types";

interface BranchForm {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  picName: string;
  picPhone: string;
  status: "active" | "inactive";
  openDate: string;
  notes: string;
}

const BLANK: BranchForm = {
  name: "", address: "", city: "", phone: "", email: "",
  picName: "", picPhone: "", status: "active", openDate: "", notes: "",
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchForm>(BLANK);

  const set = (k: keyof BranchForm, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const load = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
    } catch {
      toast.error("Gagal memuat data cabang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(BLANK); setOpen(true); };
  const openEdit = (b: Branch) => {
    setEditId(b.id);
    setForm({
      name: b.name,
      address: b.address,
      city: b.city,
      phone: b.phone,
      email: b.email ?? "",
      picName: b.picName,
      picPhone: b.picPhone ?? "",
      status: b.status,
      openDate: (() => {
        if (!b.openDate) return "";
        const ts = b.openDate as unknown as { toDate?: () => Date };
        const d = typeof ts.toDate === "function" ? ts.toDate() : (b.openDate instanceof Date ? b.openDate : null);
        return d ? d.toISOString().split("T")[0] : "";
      })(),
      notes: b.notes ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.city || !form.phone || !form.picName) {
      toast.error("Nama, alamat, kota, telepon, dan PIC wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        city: form.city,
        phone: form.phone,
        email: form.email || undefined,
        picName: form.picName,
        picPhone: form.picPhone || undefined,
        status: form.status,
        openDate: form.openDate ? new Date(form.openDate) : undefined,
        notes: form.notes || undefined,
      };
      if (editId) {
        await updateBranch(editId, payload);
        toast.success("Cabang berhasil diperbarui");
      } else {
        await createBranch(payload);
        toast.success("Cabang berhasil ditambahkan");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Gagal menyimpan cabang");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus cabang "${name}"?`)) return;
    try {
      await deleteBranch(id);
      toast.success("Cabang dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus cabang");
    }
  };

  const activeBranches = branches.filter((b) => b.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Manajemen Cabang</h1>
          <p className="text-gray-500 text-sm">
            {branches.length} cabang terdaftar · {activeBranches} aktif
          </p>
        </div>
        <Button className="bg-[#1a2744] hover:bg-[#2a3a60] gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Tambah Cabang
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Cabang", value: branches.length, color: "bg-blue-50 text-blue-700" },
          { label: "Cabang Aktif", value: activeBranches, color: "bg-green-50 text-green-700" },
          { label: "Nonaktif", value: branches.length - activeBranches, color: "bg-gray-50 text-gray-500" },
          { label: "Kota", value: new Set(branches.map((b) => b.city)).size, color: "bg-purple-50 text-purple-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Branch list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">Belum ada cabang terdaftar</p>
          <p className="text-gray-400 text-sm mb-4">Tambahkan cabang klinik pertama Anda</p>
          <Button onClick={openCreate} className="bg-[#1a2744] hover:bg-[#2a3a60] gap-2">
            <Plus className="w-4 h-4" />
            Tambah Cabang
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((b) => (
            <Card key={b.id} className={`border-0 shadow-sm overflow-hidden ${b.status === "inactive" ? "opacity-60" : ""}`}>
              <div className={`h-1.5 ${b.status === "active" ? "bg-gradient-to-r from-[#1a2744] to-teal-500" : "bg-gray-200"}`} />
              <CardContent className="p-5">
                {/* Title row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#1a2744] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-tight">{b.name}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        b.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {b.status === "active"
                          ? <><CheckCircle2 className="w-3 h-3" />Aktif</>
                          : <><XCircle className="w-3 h-3" />Nonaktif</>
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(b)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="w-8 h-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(b.id, b.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Info grid */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{b.address}, {b.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                  {b.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{b.email}</span>
                    </div>
                  )}
                  {b.openDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>Buka sejak {(() => {
                        const ts = b.openDate as unknown as { toDate?: () => Date };
                        const d = typeof ts.toDate === "function" ? ts.toDate() : (b.openDate instanceof Date ? b.openDate : null);
                        return d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—";
                      })()}</span>
                    </div>
                  )}
                </div>

                {/* PIC */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Person In Charge</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {b.picName}
                      {b.picPhone && <span className="font-normal text-gray-400"> · {b.picPhone}</span>}
                    </p>
                  </div>
                </div>

                {b.notes && (
                  <p className="mt-3 text-xs text-gray-400 italic line-clamp-2">{b.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(BLANK); setEditId(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Cabang" : "Tambah Cabang Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Cabang *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Contoh: Prime Wellness Medan Baru"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Alamat *</Label>
                <Textarea
                  required
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  rows={2}
                  placeholder="Jl. Contoh No. 123"
                />
              </div>
              <div className="space-y-2">
                <Label>Kota *</Label>
                <Input
                  required
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Medan"
                />
              </div>
              <div className="space-y-2">
                <Label>Telepon *</Label>
                <Input
                  required
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="0611234567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Cabang</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="cabang@primewellness.id"
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Person In Charge (PIC)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama PIC *</Label>
                  <Input
                    required
                    value={form.picName}
                    onChange={(e) => set("picName", e.target.value)}
                    placeholder="Nama penanggung jawab"
                  />
                </div>
                <div className="space-y-2">
                  <Label>HP PIC</Label>
                  <Input
                    value={form.picPhone}
                    onChange={(e) => set("picPhone", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Buka</Label>
                <Input
                  type="date"
                  value={form.openDate}
                  onChange={(e) => set("openDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Informasi tambahan tentang cabang ini..."
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1a2744] hover:bg-[#2a3a60]"
              disabled={saving}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
              ) : (
                editId ? "Simpan Perubahan" : "Tambah Cabang"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
