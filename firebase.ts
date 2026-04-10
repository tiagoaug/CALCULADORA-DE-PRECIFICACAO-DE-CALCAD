
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDNLMlKlwOlIdRt5HuWj8n0C8kNGYV_jLw",
  authDomain: "calc-custos-sapatos-pro.firebaseapp.com",
  projectId: "calc-custos-sapatos-pro",
  storageBucket: "calc-custos-sapatos-pro.firebasestorage.app",
  messagingSenderId: "56750808130",
  appId: "1:56750808130:web:55108624f6d924b94ee1db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
