"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { User, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { getPatient, updatePatient } from "@/lib/firebase/firestore-service";
import { getInitials } from "@/lib/utils";
import type { Patient } from "@/types";

export default function PatientProfilePage() {
  const { user, userData } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (!user?.uid) return;
    getPatient(user.uid)
      .then((data) => {
        if (data) {
          setPatient(data);
          reset({
            fullName: data.fullName,
            phone: data.phone,
            address: data.address,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.uid, reset]);

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await updatePatient(user.uid, {
        fullName: data.fullName as string,
        phone: data.phone as string,
        address: data.address as string,
      });
      toast.success("Profil berhasil diperbarui");
    } catch {
      toast.error("Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    patient?.fullName ||
    (userData?.displayName as string) ||
    user?.displayName ||
    "User";

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-[#1B3A6B] text-white text-xl">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{displayName}</CardTitle>
              <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Nama Lengkap</Label>
                <Input {...register("fullName")} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Nomor HP</Label>
                <Input {...register("phone")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Alamat</Label>
                <Input {...register("address")} />
              </div>
            </div>
            <Button
              type="submit"
              className="bg-[#1B3A6B] hover:bg-[#0A1628] text-white gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
