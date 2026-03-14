import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCLpPEyxoSGhOePACgXPUZhdpIlaNfwC58",
  authDomain: "lettercreater-2980d.firebaseapp.com",
  projectId: "lettercreater-2980d",
  storageBucket: "lettercreater-2980d.firebasestorage.app",
  messagingSenderId: "1011699834663",
  appId: "1:1011699834663:web:162b3aac95a99a9df9d302",
  measurementId: "G-4EZVDY6ECJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
