import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDbLxNCv2cg92uO0I3jgVITLdQWVaByCJc",
  authDomain: "roadmap-4b82f.firebaseapp.com",
  projectId: "roadmap-4b82f",
  storageBucket: "roadmap-4b82f.firebasestorage.app",
  messagingSenderId: "729280776731",
  appId: "1:729280776731:web:b2d9c2e1559fb0b80486be"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
