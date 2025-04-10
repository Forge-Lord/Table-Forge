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
    status.textContent = "Name must be 3+ chars, password 6+.";
    return;
  }

  if (name.toLowerCase().match(/(admin|fuck|shit|damn)/)) {
    status.textContent = "Name rejected by the Forge.";
    return;
  }

  const fakeEmail = `${name.toLowerCase()}@tableforge.app`;

  try {
    // Try login first
    await signInWithEmailAndPassword(auth, fakeEmail, password);
    localStorage.setItem("displayName", name);
    redirectAfterLogin();
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      // Create new account
      try {
        const result = await createUserWithEmailAndPassword(auth, fakeEmail, password);
        await setDoc(doc(db, "users", name), {
          displayName: name,
          uid: result.user.uid,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem("displayName", name);
        redirectAfterLogin();
      } catch (createErr) {
        status.textContent = "Creation failed. Try another name.";
        console.error(createErr);
      }
    } else if (err.code === "auth/wrong-password") {
      status.textContent = "Incorrect password.";
    } else {
      status.textContent = "Login failed.";
      console.error(err);
    }
  }
});

function redirectAfterLogin() {
  document.getElementById("loginStatus").textContent = "Forge Identity Confirmed!";
  const last = sessionStorage.getItem("lastPage");
  setTimeout(() => {
    window.location.href = last || "index.html";
  }, 1000);
}
