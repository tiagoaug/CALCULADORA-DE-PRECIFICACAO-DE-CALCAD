
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCK9TyzHzBS6VidZgBT9nzWeuX7HkocyzQ",
  authDomain: "calc-custos-sapatos.firebaseapp.com",
  projectId: "calc-custos-sapatos",
  storageBucket: "calc-custos-sapatos.firebasestorage.app",
  messagingSenderId: "182719093690",
  appId: "1:182719093690:web:7aa2ff26f312cfc58c9b83",
  measurementId: "G-HQCZE7X4XT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
