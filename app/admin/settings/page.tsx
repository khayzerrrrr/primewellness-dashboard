"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Settings, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getClinicSettings, updateClinicSettings } from "@/lib/firebase/firestore-service";
import type { ClinicSettings } from "@/types";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState("id");

  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    getClinicSettings()
      .then((data) => {
        if (data) {
          reset({
            clinicName: data.clinicName,
            address: data.address,
            email: data.email,
            whatsapp: data.whatsapp,
            instagram: data.socialMedia?.instagram || "",
            facebook: data.socialMedia?.facebook || "",
          });
          setLang(data.defaultLanguage || "id");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      await updateClinicSettings({
        clinicName: data.clinicName as string,
        address: data.address as string,
        email: data.email as string,
        whatsapp: data.whatsapp as string,
        defaultLanguage: lang,
        socialMedia: {
          instagram: data.instagram as string,
          facebook: data.facebook as string,
        },
      });
      toast.success("Pengaturan berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Pengaturan Klinik</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Informasi Klinik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Klinik</Label>
              <Input {...register("clinicName")} defaultValue="Prime Wellness" />
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input {...register("address")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...register("email")} type="email" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input {...register("whatsapp")} placeholder="628xxxxxxxxxx" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Media Sosial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input {...register("instagram")} placeholder="@primewellness" />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input {...register("facebook")} placeholder="Prime Wellness" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Preferensi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Bahasa Default</Label>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="hokkien">🇨🇳 閩南語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="bg-[#1B3A6B] hover:bg-[#0A1628] text-white gap-2"
          disabled={saving}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
          ) : (
            <><Save className="w-4 h-4" />Simpan Pengaturan</>
          )}
        </Button>
      </form>
    </div>
  );
}
