// Firebase Auth Guard / Session Handler

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
  storageBucket: "tableforge-app.appspot.com",
  messagingSenderId: "708497363618",
  appId: "1:708497363618:web:39da060b48681944923dfb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function requireLogin() {
  const user = localStorage.getItem("displayName");
  if (!user) {
    alert("You must be signed in to access this page.");
    window.location.href = "/profile.html";
  }
}

export function logout() {
  signOut(auth).catch(console.error);
  localStorage.removeItem("displayName");
  window.location.href = "/";
}
