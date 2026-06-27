"use client";

import { useEffect, useState } from "react";
import { UserPlus, Shield, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "owner" | "super_admin" | "manager" | "front_office" | "therapist" | "patient";

interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  createdBy?: string;
  phone?: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  super_admin: "Super Admin",
  manager: "Manager",
  front_office: "Front Office",
  therapist: "Terapis",
  patient: "Pasien",
};
const ROLE_COLORS: Record<string, string> = {
  owner: "bg-red-100 text-red-700",
  super_admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  front_office: "bg-teal-100 text-teal-700",
  therapist: "bg-green-100 text-green-700",
  patient: "bg-gray-100 text-gray-700",
};

const STAFF_ROLES: UserRole[] = ["super_admin", "manager", "front_office", "therapist"];

export default function AccountManagementPage() {
  const { user: currentUser, role: currentRole } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", displayName: "", role: "front_office" as UserRole, phone: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
      setUsers(snap.docs.map((d) => ({
        id: d.id, ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      })) as AppUser[]);
    } catch { setUsers([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.email || !form.displayName) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "users"), {
        ...form,
        isActive: true,
        createdAt: Timestamp.now(),
        createdBy: currentUser?.uid,
      });
      setForm({ email: "", displayName: "", role: "front_office", phone: "" });
      setShowForm(false);
      await load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleToggleActive = async (u: AppUser) => {
    await updateDoc(doc(db, "users", u.id), { isActive: !u.isActive });
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, isActive: !u.isActive } : x));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus akun ini? Tindakan ini tidak dapat dibatalkan.")) return;
    await deleteDoc(doc(db, "users", id));
    setUsers((prev) => prev.filter((x) => x.id !== id));
  };

  const filtered = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchSearch = !search || u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Manajemen Akun</h1>
          <p className="text-gray-500 text-sm">Kelola akun karyawan dan pengguna</p>
        </div>
        <Button className="bg-[#1a2744] hover:bg-[#2a3a60]" onClick={() => setShowForm(!showForm)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Buat Akun Baru
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border border-[#1a2744]/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1a2744] flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Buat Akun Karyawan Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nama Lengkap</label>
                <input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="Nama lengkap karyawan"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@primewellness.id"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                >
                  {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  {currentRole === "owner" && <option value="super_admin">Super Admin</option>}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">No. HP (opsional)</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                />
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-3 bg-amber-50 p-2 rounded-lg">
              ⚠️ Akun ini dibuat di database. Password akan dikirim ke email karyawan atau ditetapkan saat pertama login.
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              <Button className="bg-[#1a2744] hover:bg-[#2a3a60]" onClick={handleCreate} disabled={saving}>
                {saving ? "Membuat..." : "Buat Akun"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
        >
          <option value="all">Semua Role</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* User Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1a2744]">Daftar Akun ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Tidak ada akun ditemukan</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 text-gray-500 font-medium">Nama</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Email</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Role</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Status</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Dibuat</th>
                      <th className="text-right py-3 text-gray-500 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 font-medium text-slate-800">{u.displayName || "—"}</td>
                        <td className="py-3 text-gray-600 text-xs">{u.email || "—"}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-700"}`}>
                            {ROLE_LABELS[u.role] ?? u.role}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {u.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 text-xs">{u.createdAt ? formatDate(u.createdAt, "dd MMM yyyy") : "—"}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleActive(u)}
                              title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                            >
                              {u.isActive
                                ? <ToggleRight className="w-4 h-4 text-green-500" />
                                : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                            </Button>
                            {u.role !== "owner" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => handleDelete(u.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {filtered.map((u) => (
                  <div key={u.id} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a2744] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{(u.displayName || u.email || "?").charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{u.displayName || "—"}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email || "—"}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-700"}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(u)}>
                        {u.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                      </Button>
                      {u.role !== "owner" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
