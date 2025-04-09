import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("displayName").value.trim();
  const password = document.getElementById("password").value;
  const status = document.getElementById("loginStatus");

  if (!name || !password) {
    status.textContent = "Both fields required.";
    return;
  }

  if (name.toLowerCase().includes("admin") || name.match(/(damn|shit|fuck)/i)) {
    status.textContent = "Name rejected by Forge. Choose an honorable identity.";
    return;
  }

  const fakeEmail = `${name.toLowerCase()}@tableforge.app`;

  try {
    const result = await signInWithEmailAndPassword(auth, fakeEmail, password);
    status.textContent = "Forge Identity Confirmed!";
    saveSession(result.user.uid, name);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      try {
        const result = await createUserWithEmailAndPassword(auth, fakeEmail, password);
        await setDoc(doc(db, "users", result.user.uid), {
          displayName: name,
          createdAt: new Date().toISOString()
        });
        status.textContent = "Forge Identity Created!";
        saveSession(result.user.uid, name);
      } catch (createErr) {
        status.textContent = "Creation failed. Choose a stronger password.";
      }
    } else {
      status.textContent = "Incorrect password. Try again.";
    }
  }
});

function saveSession(uid, name) {
  localStorage.setItem("uid", uid);
  localStorage.setItem("displayName", name);
  const last = sessionStorage.getItem("lastPage");
  setTimeout(() => {
    window.location.href = last || "index.html";
  }, 1000);
}
