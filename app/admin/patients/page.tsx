"use client";

import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getPatients } from "@/lib/firebase/firestore-service";
import { getInitials, formatDate } from "@/lib/utils";
import type { Patient } from "@/types";

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filtered, setFiltered] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatients()
      .then((data) => {
        setPatients(data as Patient[]);
        setFiltered(data as Patient[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      patients.filter(
        (p) =>
          (p.fullName ?? "").toLowerCase().includes(q) ||
          (p.email ?? "").toLowerCase().includes(q) ||
          (p.phone ?? "").includes(q)
      )
    );
  }, [search, patients]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Pasien ({patients.length})
        </h1>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Cari nama, email, nomor HP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Pasien</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Nomor HP</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Jenis Kelamin</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Tanggal Daftar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="py-3 px-4">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  Tidak ada pasien
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-teal-600 text-white text-xs">
                          {getInitials(p.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-800">{p.fullName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{p.phone}</td>
                  <td className="py-3 px-4 text-gray-600">{p.email}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {p.gender === "male" ? "Laki-laki" : "Perempuan"}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {typeof p.createdAt === "object" && "toDate" in p.createdAt
                      ? formatDate((p.createdAt as { toDate(): Date }).toDate())
                      : formatDate(p.createdAt as Date)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Tidak ada pasien</p>
          </div>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <Avatar className="w-11 h-11 flex-shrink-0">
                <AvatarFallback className="bg-teal-600 text-white text-sm font-bold">
                  {getInitials(p.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{p.fullName}</p>
                <p className="text-xs text-gray-500">{p.phone}</p>
                <p className="text-xs text-gray-400 truncate">{p.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {p.gender === "male" ? "L" : "P"}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {typeof p.createdAt === "object" && "toDate" in p.createdAt
                    ? formatDate((p.createdAt as { toDate(): Date }).toDate(), "dd MMM yy")
                    : formatDate(p.createdAt as Date, "dd MMM yy")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
