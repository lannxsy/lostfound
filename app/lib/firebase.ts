import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqKdNiHeFN6uZfmJkJec3XaxN6Jcfqymk",
  authDomain: "alxsy-8a460.firebaseapp.com",
  projectId: "alxsy-8a460",
  storageBucket: "alxsy-8a460.firebasestorage.app",
  messagingSenderId: "869575609882",
  appId: "1:869575609882:web:cf7879bdc4af99ad0e0ba3",
};

// Perbaikan: Cek apakah Firebase sudah jalan untuk mencegah error "duplicate app"
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;