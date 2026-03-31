import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyABzrfG8Sjx3pcvktXUicJEudm653Xnn3g",
  authDomain: "eurovision-2026-app.firebaseapp.com",
  databaseURL: "https://eurovision-2026-app-default-rtdb.firebaseio.com",
  projectId: "eurovision-2026-app",
  storageBucket: "eurovision-2026-app.firebasestorage.app",
  messagingSenderId: "562088911861",
  appId: "1:562088911861:web:94a90514118df2931bf6bc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
const provider = new GoogleAuthProvider();

export async function signInGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Sign in error:", error);
    return null;
  }
}

export async function signOutUser() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Database helpers — all data lives under /buddy/{userId}/
export function saveData(userId, path, data) {
  return set(ref(db, `buddy/${userId}/${path}`), data);
}

export async function loadData(userId, path) {
  const snapshot = await get(ref(db, `buddy/${userId}/${path}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export function watchData(userId, path, callback) {
  return onValue(ref(db, `buddy/${userId}/${path}`), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
}