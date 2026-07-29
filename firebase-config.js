import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCODPfjAf4gvjQ4OG1HkzSpWOnNzZH13bA",
  authDomain: "kebiasaan-indonesia-heba-2a3d7.firebaseapp.com",
  projectId: "kebiasaan-indonesia-heba-2a3d7",
  storageBucket: "kebiasaan-indonesia-heba-2a3d7.firebasestorage.app",
  messagingSenderId: "951536688023",
  appId: "1:951536688023:web:10ff601185c3cbd39242d2",
  measurementId: "G-YVPQT2VWXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
