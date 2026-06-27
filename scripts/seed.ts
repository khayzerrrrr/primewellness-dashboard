/**
 * Seed Script for Prime Wellness
 *
 * Usage:
 * 1. Set your Firebase credentials in .env.local
 * 2. Run: npx tsx scripts/seed.ts
 *
 * This will create sample data for:
 * - Services
 * - Doctors
 * - Testimonials
 * - FAQs
 * - Clinic Settings
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { config } from "dotenv";

config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SERVICES = [
  {
    name: "Konsultasi Dokter",
    description: "Konsultasi langsung dengan dokter umum untuk berbagai keluhan kesehatan.",
    duration: 30,
    price: 150000,
    status: "active",
  },
  {
    name: "Medical Check Up",
    description: "Pemeriksaan kesehatan menyeluruh termasuk lab darah, EKG, dan rontgen.",
    duration: 120,
    price: 750000,
    status: "active",
  },
  {
    name: "Pemeriksaan Umum",
    description: "Pemeriksaan fisik standar untuk memantau kondisi kesehatan Anda.",
    duration: 30,
    price: 100000,
    status: "active",
  },
  {
    name: "Infus Vitamin",
    description: "Terapi infus vitamin C dan multivitamin untuk meningkatkan imunitas tubuh.",
    duration: 60,
    price: 350000,
    status: "active",
  },
  {
    name: "Terapi Kesehatan",
    description: "Program terapi kesehatan komprehensif untuk pemulihan dan peningkatan vitalitas.",
    duration: 90,
    price: 500000,
    status: "active",
  },
];

const DOCTORS = [
  {
    fullName: "dr. Budi Santoso, Sp.PD",
    email: "budi.santoso@primewellness.id",
    phone: "081234567890",
    specialization: "Spesialis Penyakit Dalam",
    licenseNumber: "SIP-001/2024",
    isActive: true,
    schedule: [
      { day: 1, startTime: "08:00", endTime: "12:00", quota: 10 },
      { day: 3, startTime: "08:00", endTime: "12:00", quota: 10 },
      { day: 5, startTime: "08:00", endTime: "12:00", quota: 10 },
    ],
    bio: "Dokter spesialis penyakit dalam dengan pengalaman 15 tahun.",
  },
  {
    fullName: "dr. Sari Dewi Rahayu, Sp.A",
    email: "sari.dewi@primewellness.id",
    phone: "082345678901",
    specialization: "Spesialis Anak",
    licenseNumber: "SIP-002/2024",
    isActive: true,
    schedule: [
      { day: 2, startTime: "09:00", endTime: "14:00", quota: 12 },
      { day: 4, startTime: "09:00", endTime: "14:00", quota: 12 },
      { day: 6, startTime: "09:00", endTime: "13:00", quota: 8 },
    ],
    bio: "Dokter spesialis anak yang berpengalaman dalam perawatan bayi dan anak.",
  },
  {
    fullName: "dr. Ahmad Rizki Pratama, Sp.OG",
    email: "ahmad.rizki@primewellness.id",
    phone: "083456789012",
    specialization: "Spesialis Kandungan & Kebidanan",
    licenseNumber: "SIP-003/2024",
    isActive: true,
    schedule: [
      { day: 1, startTime: "13:00", endTime: "17:00", quota: 8 },
      { day: 3, startTime: "13:00", endTime: "17:00", quota: 8 },
      { day: 5, startTime: "13:00", endTime: "17:00", quota: 8 },
    ],
    bio: "Spesialis kandungan dengan keahlian dalam USG dan persalinan.",
  },
];

const TESTIMONIALS = [
  {
    patientId: "sample",
    patientName: "Ibu Sari Wulandari",
    rating: 5,
    comment: "Pelayanan sangat baik dan dokternya ramah. Proses booking online sangat mudah dan cepat. Rekam medis digital juga sangat membantu. Sangat merekomendasikan Prime Wellness!",
    isPublished: true,
  },
  {
    patientId: "sample",
    patientName: "Bapak Hendra Kurniawan",
    rating: 5,
    comment: "Klinik yang bersih dan modern. Dokternya profesional dan menjelaskan kondisi kesehatan dengan sangat detail. Tidak perlu antri lama karena sudah ada sistem booking online.",
    isPublished: true,
  },
  {
    patientId: "sample",
    patientName: "Ibu Maya Pratiwi",
    rating: 5,
    comment: "Rekam medis digital Prime Wellness sangat memudahkan. Tidak perlu bawa berkas-berkas kertas setiap kunjungan. Sistem informatif dan pelayanan ramah.",
    isPublished: true,
  },
];

const FAQS = [
  {
    question: "Bagaimana cara booking appointment secara online?",
    answer: "Anda dapat melakukan booking melalui website kami di primewellness.id. Klik tombol 'Booking Sekarang', pilih layanan, dokter, tanggal dan jam yang tersedia, kemudian isi data pasien dan konfirmasi. Nomor booking akan langsung dikirimkan.",
    order: 1,
    isPublished: true,
  },
  {
    question: "Apakah pasien baru perlu mendaftar terlebih dahulu?",
    answer: "Untuk pengalaman terbaik, kami menyarankan mendaftar sebagai member terlebih dahulu. Namun, Anda juga bisa melakukan booking sebagai tamu tanpa registrasi. Registrasi memberikan akses ke riwayat appointment dan rekam medis digital.",
    order: 2,
    isPublished: true,
  },
  {
    question: "Berapa lama sebelum appointment saya mendapat konfirmasi?",
    answer: "Konfirmasi appointment akan dikirimkan melalui WhatsApp dalam waktu 1x24 jam setelah booking dibuat. Reminder juga akan dikirimkan H-1 sebelum jadwal yang ditentukan.",
    order: 3,
    isPublished: true,
  },
  {
    question: "Metode pembayaran apa saja yang diterima?",
    answer: "Kami menerima pembayaran tunai (cash), transfer bank, dan QRIS. Invoice akan diterbitkan setelah konsultasi atau layanan selesai dilakukan.",
    order: 4,
    isPublished: true,
  },
  {
    question: "Apakah rekam medis saya aman dan terjaga privasinya?",
    answer: "Ya, seluruh data rekam medis Anda tersimpan dengan enkripsi tingkat tinggi menggunakan Firebase. Data hanya dapat diakses oleh dokter yang merawat dan diri Anda sendiri melalui akun yang terverifikasi.",
    order: 5,
    isPublished: true,
  },
  {
    question: "Apakah bisa membatalkan atau reschedule appointment?",
    answer: "Ya, Anda dapat membatalkan atau reschedule appointment maksimal 24 jam sebelum jadwal melalui dashboard pasien atau dengan menghubungi kami melalui WhatsApp.",
    order: 6,
    isPublished: true,
  },
];

const CLINIC_SETTINGS = {
  clinicName: "Prime Wellness",
  address: "Jl. Kesehatan No. 123, Jakarta Selatan, DKI Jakarta 12345",
  email: "info@primewellness.id",
  whatsapp: "6221234567890",
  defaultLanguage: "id",
  operationalHours: [
    { day: "Senin", open: "08:00", close: "20:00", isClosed: false },
    { day: "Selasa", open: "08:00", close: "20:00", isClosed: false },
    { day: "Rabu", open: "08:00", close: "20:00", isClosed: false },
    { day: "Kamis", open: "08:00", close: "20:00", isClosed: false },
    { day: "Jumat", open: "08:00", close: "20:00", isClosed: false },
    { day: "Sabtu", open: "08:00", close: "17:00", isClosed: false },
    { day: "Minggu", open: "09:00", close: "14:00", isClosed: false },
  ],
  socialMedia: {
    instagram: "@primewellness",
    facebook: "Prime Wellness",
    twitter: "@primewellness",
  },
};

async function seed() {
  console.log("🌱 Starting Prime Wellness seed...\n");

  try {
    // Seed Services
    console.log("📦 Seeding services...");
    for (const service of SERVICES) {
      await addDoc(collection(db, "services"), {
        ...service,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`  ✅ Service: ${service.name}`);
    }

    // Seed Doctors
    console.log("\n👨‍⚕️ Seeding doctors...");
    for (const doctor of DOCTORS) {
      await addDoc(collection(db, "doctors"), {
        ...doctor,
        userId: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`  ✅ Doctor: ${doctor.fullName}`);
    }

    // Seed Testimonials
    console.log("\n⭐ Seeding testimonials...");
    for (const testimonial of TESTIMONIALS) {
      await addDoc(collection(db, "testimonials"), {
        ...testimonial,
        createdAt: serverTimestamp(),
      });
      console.log(`  ✅ Testimonial: ${testimonial.patientName}`);
    }

    // Seed FAQs
    console.log("\n❓ Seeding FAQs...");
    for (const faq of FAQS) {
      await addDoc(collection(db, "faq"), {
        ...faq,
        createdAt: serverTimestamp(),
      });
      console.log(`  ✅ FAQ: ${faq.question.slice(0, 50)}...`);
    }

    // Seed Settings
    console.log("\n⚙️ Seeding clinic settings...");
    await setDoc(doc(db, "settings", "clinic"), {
      ...CLINIC_SETTINGS,
      updatedAt: serverTimestamp(),
    });
    console.log("  ✅ Clinic settings saved");

    console.log("\n🎉 Seed completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Create admin user in Firebase Console > Authentication");
    console.log("2. In Firestore, create document in 'users' collection with the admin UID");
    console.log("3. Set role: 'admin' or 'owner' in the user document");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
