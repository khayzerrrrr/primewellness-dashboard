"use client";

import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/utils";

export default function DoctorProfilePage() {
  const { user, userData } = useAuth();
  const displayName = (userData?.displayName as string) || user?.displayName || "Dokter";

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
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-[#0A1628]">
              Update profil dokter dilakukan melalui Admin Dashboard. Hubungi administrator untuk perubahan data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
