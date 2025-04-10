import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// FORM SUBMIT HANDLER
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("displayName").value.trim();
  const password = document.getElementById("password").value;
  const status = document.getElementById("loginStatus");

  if (!name || !password) {
    status.textContent = "Name and password required.";
    return;
  }

  if (name.length < 3 || password.length < 6) {
    status.textContent = "Name must be 3+ characters, password 6+.";
    return;
  }

  if (name.toLowerCase().match(/(admin|fuck|shit|damn|ass)/)) {
    status.textContent = "That name is not worthy of the Forge.";
    return;
  }

  const fakeEmail = `${name.toLowerCase()}@tableforge.app`;

  try {
    await signInWithEmailAndPassword(auth, fakeEmail, password);
    status.textContent = "Welcome back, Forge Lord.";
    localStorage.setItem("displayName", name);
    redirectAfterLogin();
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      try {
        const result = await createUserWithEmailAndPassword(auth, fakeEmail, password);
        await setDoc(doc(db, "users", name), {
          displayName: name,
          uid: result.user.uid,
          createdAt: new Date().toISOString()
        });
        status.textContent = "Forge Identity Created!";
        localStorage.setItem("displayName", name);
        redirectAfterLogin();
      } catch (createErr) {
        console.error("Creation Error:", createErr);
        status.textContent = "Name already exists or invalid. Try another.";
      }
    } else if (err.code === "auth/wrong-password") {
      status.textContent = "Incorrect password.";
    } else {
      console.error("Login Error:", err);
      status.textContent = "Login failed. Try again.";
    }
  }
});

function redirectAfterLogin() {
  const last = sessionStorage.getItem("lastPage");
  setTimeout(() => {
    window.location.href = last || "index.html";
  }, 1000);
}
