import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
const db = getFirestore(app);

window.loginOrRegister = async function () {
  const displayName = document.getElementById("displayName").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  if (!displayName || !password) {
    message.innerText = "Please enter both display name and password.";
    return;
  }

  const email = `forge_${displayName}@forge.app`;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem("displayName", displayName);
    message.style.color = "lightgreen";
    message.innerText = `Welcome back, ${displayName}.`;
    setTimeout(() => window.location.href = "index.html", 1500);
  } catch (loginErr) {
    if (loginErr.code === "auth/user-not-found") {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCred.user.uid), {
          displayName,
          createdAt: new Date()
        });
        localStorage.setItem("displayName", displayName);
        message.style.color = "lightgreen";
        message.innerText = `Welcome to the Forge, ${displayName}.`;
        setTimeout(() => window.location.href = "index.html", 1500);
      } catch (signupErr) {
        message.innerText = "Signup failed: " + signupErr.message;
      }
    } else {
      message.innerText = "Login failed: " + loginErr.message;
    }
  }
};
