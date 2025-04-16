// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function requireLogin() {
  const name = localStorage.getItem("displayName");
  if (!name) {
    alert("You must log in to continue.");
    window.location.href = "/profile.html";
  }
}

export async function logout() {
  await signOut(auth);
  localStorage.removeItem("displayName");
  window.location.href = "/profile.html";
}
