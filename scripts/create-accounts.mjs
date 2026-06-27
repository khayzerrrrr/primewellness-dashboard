/**
 * Script untuk membuat akun-akun awal di Firebase
 * Jalankan: node scripts/create-accounts.mjs
 */

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_DIZqiMJweUM20KE1OTYXTukSwdIiaY0",
  authDomain: "prime-wellness-644e4.firebaseapp.com",
  projectId: "prime-wellness-644e4",
  storageBucket: "prime-wellness-644e4.firebasestorage.app",
  messagingSenderId: "859782064613",
  appId: "1:859782064613:web:09dee1c569abf13b63270c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ACCOUNTS = [
  {
    email: "owner@primewellness.id",
    password: "PrimeOwner2024!",
    displayName: "Steven (Owner)",
    role: "owner",
  },
  {
    email: "manager@primewellness.id",
    password: "PrimeManager2024!",
    displayName: "Manager Prime Wellness",
    role: "manager",
  },
  {
    email: "fo@primewellness.id",
    password: "PrimeFO2024!",
    displayName: "Front Office",
    role: "front_office",
  },
  {
    email: "terapis@primewellness.id",
    password: "PrimeTerapis2024!",
    displayName: "Terapis 1",
    role: "therapist",
  },
  {
    email: "pasien@primewellness.id",
    password: "PrimePasien2024!",
    displayName: "Pasien Demo",
    role: "patient",
  },
];

async function createAccount(account) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, account.email, account.password);
    await updateProfile(cred.user, { displayName: account.displayName });

    await setDoc(doc(db, "users", cred.user.uid), {
      email: account.email,
      displayName: account.displayName,
      role: account.role,
      isActive: true,
      createdAt: Timestamp.now(),
    });

    console.log(`✓ ${account.role.padEnd(12)} | ${account.email} | Password: ${account.password}`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log(`⚠ ${account.role.padEnd(12)} | ${account.email} — sudah ada, dilewati`);
    } else {
      console.error(`✗ ${account.email}: ${err.message}`);
    }
  }
}

console.log("=".repeat(60));
console.log("  Membuat akun Prime Wellness...");
console.log("=".repeat(60));

for (const account of ACCOUNTS) {
  await createAccount(account);
}

console.log("=".repeat(60));
console.log("  Selesai! Login dengan akun di atas.");
console.log("=".repeat(60));
process.exit(0);
