import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDPu4tG5FDd8YsBRgRgViSSTJXoPg9x7jY",
  authDomain: "heartcompass-roadmap.firebaseapp.com",
  projectId: "heartcompass-roadmap",
  storageBucket: "heartcompass-roadmap.firebasestorage.app",
  messagingSenderId: "673572463523",
  appId: "1:673572463523:web:4d15f54bb3920a33be7016",
  measurementId: "G-J3M8S6DC2G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
