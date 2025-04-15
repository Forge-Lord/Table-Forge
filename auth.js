import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { app } from './firebase.js';

const auth = getAuth(app);

export function requireLogin() {
  onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "/profile.html";
    else localStorage.setItem("displayName", user.email.split("@")[0]);
  });
}

export function logout() {
  signOut(auth).then(() => {
    localStorage.clear();
    window.location.href = "/profile.html";
  });
}
