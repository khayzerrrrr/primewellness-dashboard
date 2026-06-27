"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Trash2, Edit2, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface SOPItem {
  id: string;
  title: string;
  role: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const ROLES = ["Semua", "therapist", "front_office", "manager"];
const ROLE_LABELS: Record<string, string> = {
  therapist: "Terapis",
  front_office: "Front Office",
  manager: "Manager",
  owner: "Owner",
};

const DEFAULT_SOPS = [
  { title: "SOP Penyambutan Pasien", role: "front_office", content: `1. Sambut pasien dengan salam ramah: "Selamat datang di Prime Wellness Therapy & Reliefy"\n2. Tanyakan apakah pasien sudah memiliki reservasi atau belum\n3. Jika belum, tawarkan waktu yang tersedia\n4. Input data pasien baru ke dalam sistem\n5. Minta pasien mengisi form keluhan utama\n6. Informasikan estimasi waktu tunggu\n7. Persilakan pasien duduk di ruang tunggu` },
  { title: "SOP Pelaksanaan Terapi", role: "therapist", content: `1. Baca rekam terapi pasien sebelum sesi dimulai\n2. Konfirmasi keluhan utama dan kondisi pasien hari ini\n3. Siapkan alat terapi sesuai jenis layanan\n4. Lakukan cuci tangan sebelum dan sesudah terapi\n5. Jelaskan prosedur terapi yang akan dilakukan\n6. Pantau kondisi pasien selama sesi\n7. Catat perkembangan dan catatan terapi setelah selesai\n8. Sarankan jadwal kunjungan berikutnya` },
  { title: "SOP Pembayaran Kasir", role: "front_office", content: `1. Cetak atau tampilkan invoice kepada pasien\n2. Konfirmasi total tagihan dengan pasien\n3. Tanyakan metode pembayaran: Cash / Transfer / QRIS\n4. Jika cash: hitung kembalian dengan tepat\n5. Jika transfer/QRIS: minta bukti pembayaran\n6. Upload bukti pembayaran ke sistem\n7. Tandai invoice sebagai "Lunas" setelah konfirmasi\n8. Berikan ucapan terima kasih dan sampai jumpa` },
  { title: "SOP Penanganan Komplain Pasien", role: "manager", content: `1. Dengarkan keluhan pasien dengan penuh perhatian, jangan memotong\n2. Sampaikan permohonan maaf atas ketidaknyamanan\n3. Catat detail komplain: nama pasien, waktu, jenis masalah\n4. Lakukan investigasi internal dalam 1x24 jam\n5. Hubungi pasien untuk update penanganan\n6. Berikan solusi yang sesuai (refund, sesi gratis, dll)\n7. Dokumentasikan komplain dan penyelesaiannya di sistem\n8. Evaluasi untuk mencegah kejadian serupa` },
];

export default function SOPPage() {
  const [sops, setSops] = useState<SOPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("Semua");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", role: "therapist", content: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "sop"), orderBy("createdAt", "desc")));
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
      })) as SOPItem[];
      setSops(data);
    } catch { setSops([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    setSaving(true);
    for (const sop of DEFAULT_SOPS) {
      await addDoc(collection(db, "sop"), {
        ...sop,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    await load();
    setSaving(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    if (editId) {
      await updateDoc(doc(db, "sop", editId), { ...form, updatedAt: Timestamp.now() });
    } else {
      await addDoc(collection(db, "sop"), { ...form, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
    }
    setForm({ title: "", role: "therapist", content: "" });
    setEditId(null);
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus SOP ini?")) return;
    await deleteDoc(doc(db, "sop", id));
    setSops((prev) => prev.filter((s) => s.id !== id));
  };

  const handleEdit = (sop: SOPItem) => {
    setForm({ title: sop.title, role: sop.role, content: sop.content });
    setEditId(sop.id);
    setShowForm(true);
  };

  const filtered = filterRole === "Semua" ? sops : sops.filter((s) => s.role === filterRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">SOP Karyawan</h1>
          <p className="text-gray-500 text-sm">Standar Operasional Prosedur per role</p>
        </div>
        <div className="flex gap-2">
          {sops.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={saving}>
              <BookOpen className="w-4 h-4 mr-2" />
              Isi SOP Default
            </Button>
          )}
          <Button size="sm" className="bg-[#1a2744] hover:bg-[#2a3a60]" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: "", role: "therapist", content: "" }); }}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah SOP
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border border-[#1a2744]/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1a2744]">{editId ? "Edit SOP" : "Tambah SOP Baru"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Judul SOP</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: SOP Penyambutan Pasien"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Berlaku untuk Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
              >
                {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Isi SOP</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
                placeholder="Tuliskan langkah-langkah SOP..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Batal</Button>
              <Button className="bg-[#1a2744] hover:bg-[#2a3a60]" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan SOP"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterRole === r ? "bg-[#1a2744] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {r === "Semua" ? "Semua Role" : ROLE_LABELS[r]}
            {r !== "Semua" && <span className="ml-2 text-xs opacity-70">({sops.filter((s) => s.role === r).length})</span>}
          </button>
        ))}
      </div>

      {/* SOP List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada SOP untuk kategori ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sop) => (
            <Card key={sop.id} className="border-0 shadow-sm overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === sop.id ? null : sop.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#1a2744]/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#1a2744]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{sop.title}</p>
                    <p className="text-xs text-gray-500">
                      {ROLE_LABELS[sop.role] || sop.role} · Diupdate {formatDate(sop.updatedAt, "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[sop.role] || sop.role}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(sop); }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(sop.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  {expandedId === sop.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              {expandedId === sop.id && (
                <div className="px-6 pb-5 border-t border-gray-100 bg-gray-50">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed pt-4">{sop.content}</pre>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
