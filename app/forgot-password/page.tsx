"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { resetPassword } from "@/lib/firebase/auth-service";

const forgotSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await resetPassword(data.email);
      setSent(true);
      toast.success(t("resetEmailSent"));
    } catch {
      toast.error("Gagal mengirim email reset. Periksa kembali email Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="Prime Wellness" width={90} height={90} className="object-contain" priority />
            <span className="font-bold text-xl text-[#0A1628]">Prime Wellness</span>
          </Link>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#1B3A6B]" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {t("forgotPasswordTitle")}
            </CardTitle>
            <CardDescription className="text-gray-500">
              {t("forgotPasswordSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-700 mb-6">{t("resetEmailSent")}</p>
                <Link href="/sign-in">
                  <Button className="bg-[#1B3A6B] hover:bg-[#0A1628] text-white gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {t("backToLogin")}
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    {...register("email")}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#1B3A6B] hover:bg-[#0A1628] text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    t("sendResetLink")
                  )}
                </Button>

                <Link href="/sign-in" className="flex items-center justify-center gap-2 text-sm text-[#1B3A6B] hover:text-[#0A1628] mt-4">
                  <ArrowLeft className="w-4 h-4" />
                  {t("backToLogin")}
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
