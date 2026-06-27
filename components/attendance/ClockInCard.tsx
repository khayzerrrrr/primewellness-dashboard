"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, MapPin, CheckCircle, XCircle, AlertCircle, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

export interface GeoResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceMeters: number;
  isWithinRadius: boolean;
}

export interface ClockInResult {
  photoURL: string;
  geo: GeoResult;
  timestamp: Date;
}

interface Props {
  userId: string;
  clinicLocation: { latitude: number; longitude: number; radiusMeters: number } | null;
  lateAfterMinutes?: number;
  onSuccess: (result: ClockInResult) => Promise<void>;
  label?: string;
  disabled?: boolean;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Step = "idle" | "camera" | "preview" | "geo" | "uploading" | "done" | "error";

export function ClockInCard({ userId, clinicLocation, onSuccess, label = "Clock In", disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>("idle");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [geo, setGeo] = useState<GeoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const startCamera = async () => {
    setError(null);
    setPhotoDataUrl(null);
    setGeo(null);
    setStep("camera");
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan di browser.");
      setStep("error");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPhotoDataUrl(dataUrl);
    stopStream();
    setStep("preview");
  };

  const getLocation = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error("Browser tidak mendukung GPS"));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });

  const handleSubmit = async () => {
    if (!photoDataUrl) return;
    setStep("geo");
    setError(null);

    let geoResult: GeoResult;
    try {
      const pos = await getLocation();
      const { latitude, longitude, accuracy } = pos.coords;
      let distanceMeters = 0;
      let isWithinRadius = true;

      if (clinicLocation) {
        distanceMeters = Math.round(
          haversineDistance(latitude, longitude, clinicLocation.latitude, clinicLocation.longitude)
        );
        isWithinRadius = distanceMeters <= clinicLocation.radiusMeters;
      }

      geoResult = { latitude, longitude, accuracy, distanceMeters, isWithinRadius };
      setGeo(geoResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "GPS tidak tersedia";
      setError(`Gagal mendapatkan lokasi: ${msg}. Coba aktifkan GPS di perangkat.`);
      setStep("error");
      return;
    }

    if (clinicLocation && !geoResult.isWithinRadius) {
      setError(
        `Kamu berada ${geoResult.distanceMeters}m dari klinik. Radius maksimum adalah ${clinicLocation.radiusMeters}m. Pastikan kamu berada di area klinik.`
      );
      setStep("error");
      return;
    }

    setStep("uploading");
    setSubmitting(true);
    try {
      const filename = `attendance/${userId}/${Date.now()}.jpg`;
      const sRef = storageRef(storage, filename);
      const base64 = photoDataUrl.split(",")[1];
      await uploadString(sRef, base64, "base64", { contentType: "image/jpeg" });
      const photoURL = await getDownloadURL(sRef);

      await onSuccess({ photoURL, geo: geoResult, timestamp: new Date() });
      setStep("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload gagal";
      setError(`Upload foto gagal: ${msg}`);
      setStep("error");
    }
    setSubmitting(false);
  };

  const reset = () => {
    setStep("idle");
    setPhotoDataUrl(null);
    setGeo(null);
    setError(null);
    stopStream();
  };

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <p className="font-semibold text-green-700 text-lg">{label} Berhasil!</p>
        {geo && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {geo.distanceMeters}m dari klinik · akurasi ±{Math.round(geo.accuracy)}m
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Camera / Preview area */}
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
        {step === "camera" && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
            {/* Face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-44 h-52 border-4 border-white/70 rounded-full opacity-60" />
              <div className="absolute bottom-16 text-white text-sm text-center opacity-80">
                Posisikan wajah di dalam lingkaran
              </div>
            </div>
          </>
        )}
        {step === "preview" && photoDataUrl && (
          <img src={photoDataUrl} alt="Foto absensi" className="w-full h-full object-cover" />
        )}
        {(step === "idle" || step === "uploading" || step === "geo") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
            {step === "idle" && <Camera className="w-16 h-16 opacity-30" />}
            {(step === "uploading" || step === "geo") && <Loader2 className="w-12 h-12 animate-spin opacity-60" />}
            <p className="text-sm opacity-60">
              {step === "idle" && "Kamera belum aktif"}
              {step === "geo" && "Mendapatkan lokasi GPS..."}
              {step === "uploading" && "Mengupload foto..."}
            </p>
          </div>
        )}
        {step === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 px-6">
            <XCircle className="w-12 h-12 text-red-400" />
            <p className="text-sm text-red-300 text-center">{error}</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Flip camera button */}
        {step === "camera" && (
          <button
            onClick={() => { setFacingMode((f) => f === "user" ? "environment" : "user"); startCamera(); }}
            className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 transition">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Location status indicator */}
      {clinicLocation && geo && (
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${geo.isWithinRadius ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>
            {geo.isWithinRadius
              ? `✓ Kamu berada ${geo.distanceMeters}m dari klinik (dalam radius ${clinicLocation.radiusMeters}m)`
              : `✗ ${geo.distanceMeters}m dari klinik — terlalu jauh (maks. ${clinicLocation.radiusMeters}m)`}
          </span>
        </div>
      )}

      {!clinicLocation && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Lokasi klinik belum diatur. GPS tidak diverifikasi.</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {step === "idle" && (
          <Button onClick={startCamera} disabled={disabled} className="flex-1 bg-[#1a2744] hover:bg-[#2a3a60] gap-2">
            <Camera className="w-4 h-4" />
            Buka Kamera
          </Button>
        )}

        {step === "camera" && (
          <>
            <Button variant="outline" onClick={reset} className="flex-1">Batal</Button>
            <Button onClick={takePhoto} className="flex-1 bg-[#1a2744] hover:bg-[#2a3a60] gap-2">
              <Camera className="w-4 h-4" />
              Ambil Foto
            </Button>
          </>
        )}

        {step === "preview" && (
          <>
            <Button variant="outline" onClick={startCamera} className="flex-1 gap-1">
              <RotateCcw className="w-4 h-4" />
              Ulangi
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-[#1a2744] hover:bg-[#2a3a60] gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              {label}
            </Button>
          </>
        )}

        {step === "error" && (
          <Button onClick={reset} variant="outline" className="flex-1 gap-1">
            <RotateCcw className="w-4 h-4" />
            Coba Lagi
          </Button>
        )}
      </div>
    </div>
  );
}
