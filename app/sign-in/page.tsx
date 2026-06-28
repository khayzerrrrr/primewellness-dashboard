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
    <div className="min-h-screen flex" style={{ background: "var(--brand-bg)" }}>
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "var(--brand-navy)" }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: "var(--brand-teal)" }} />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: "var(--brand-teal)" }} />
        </div>

        <div className="relative z-10 text-center">
          <div className="w-64 h-16 relative mx-auto mb-8">
            <Image
              src="/brand/logo-on-dark.png"
              alt="Prime Wellness"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Selamat Datang<br />di Prime Wellness
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-xs mx-auto">
            Platform manajemen klinik terapi profesional untuk semua kebutuhan Anda
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: "500+", label: "Pasien" },
              { value: "20+", label: "Terapis" },
              { value: "5★", label: "Rating" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-white/50 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-48 h-12 relative mx-auto">
              <Image
                src="/brand/logo-primary.png"
                alt="Prime Wellness"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: "var(--brand-navy)" }}>
              {t("loginTitle")}
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              {t("loginSubtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: "var(--brand-navy)" }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
                style={{ borderRadius: "8px" }}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: "var(--brand-navy)" }}>
                {t("password")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  style={{ borderRadius: "8px" }}
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
                <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer text-gray-600">
                  {t("rememberMe")}
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium hover:underline"
                style={{ color: "var(--brand-teal)" }}
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full text-white font-semibold h-10"
              style={{ background: "var(--brand-teal)", borderRadius: "8px" }}
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
            <Link
              href="/sign-up"
              className="font-semibold hover:underline"
              style={{ color: "var(--brand-teal)" }}
            >
              {t("register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
