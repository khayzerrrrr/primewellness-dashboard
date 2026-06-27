"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { loginUser, getUserRole } from "@/lib/firebase/auth-service";
import { ROLE_ROUTES } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function SignInPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const user = await loginUser(data.email, data.password);
      const role = await getUserRole(user.uid);
      toast.success(t("loginSuccess"));
      router.push(ROLE_ROUTES[role || "patient"]);
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorCode = (err as { code?: string }).code;
      if (errorCode === "auth/user-not-found" || errorCode === "auth/wrong-password" || errorCode === "auth/invalid-credential") {
        toast.error("Email atau password salah");
      } else if (errorCode === "auth/too-many-requests") {
        toast.error("Terlalu banyak percobaan. Coba lagi nanti.");
      } else if (errorCode === "auth/network-request-failed") {
        toast.error("Gagal koneksi. Cek internet kamu.");
      } else {
        toast.error(`Login gagal: ${errorCode ?? "unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="Prime Wellness" width={100} height={100} className="object-contain" priority />
            <span className="font-bold text-xl text-[#0A1628]">Prime Wellness</span>
          </Link>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-slate-900">
              {t("loginTitle")}
            </CardTitle>
            <CardDescription className="text-gray-500">
              {t("loginSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(!!v)}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                    {t("rememberMe")}
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#1B3A6B] hover:text-[#0A1628] font-medium"
                >
                  {t("forgotPassword")}
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1B3A6B] hover:bg-[#0A1628] text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  t("login")
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {t("dontHaveAccount")}{" "}
              <Link href="/sign-up" className="text-[#1B3A6B] hover:text-[#0A1628] font-semibold">
                {t("register")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
