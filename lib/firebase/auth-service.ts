"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./config";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import type { UserRole } from "@/types";

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female";
  address: string;
}

export async function registerPatient(data: RegisterData) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );
  const user = userCredential.user;

  await updateProfile(user, { displayName: data.fullName });

  await setDoc(doc(db, FIRESTORE_COLLECTIONS.users, user.uid), {
    uid: user.uid,
    email: data.email,
    displayName: data.fullName,
    role: "patient" as UserRole,
    isActive: true,
    phone: data.phone,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, FIRESTORE_COLLECTIONS.patients, user.uid), {
    id: user.uid,
    userId: user.uid,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    dateOfBirth: new Date(data.dateOfBirth),
    gender: data.gender,
    address: data.address,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
}

async function writeLog(userId: string, userName: string, userRole: string, action: string, label: string) {
  try {
    await addDoc(collection(db, FIRESTORE_COLLECTIONS.auditLogs), {
      userId, userName, userRole, action,
      resource: "auth", resourceLabel: label,
      createdAt: serverTimestamp(),
    });
  } catch { /* non-blocking */ }
}

export async function loginUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.users, user.uid));
  const data = userDoc.data();
  await writeLog(user.uid, data?.displayName || email, data?.role || "unknown", "login", `Login: ${email}`);
  return user;
}

export async function logoutUser() {
  const user = auth.currentUser;
  if (user) {
    const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.users, user.uid));
    const data = userDoc.data();
    await writeLog(user.uid, data?.displayName || user.email || "", data?.role || "unknown", "logout", `Logout: ${user.email}`);
  }
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.users, uid));
  if (userDoc.exists()) {
    return userDoc.data().role as UserRole;
  }
  return null;
}

export async function getUserData(uid: string) {
  const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.users, uid));
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
