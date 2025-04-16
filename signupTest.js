import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
  storageBucket: "tableforge-app.appspot.com",
  messagingSenderId: "708497363618",
  appId: "1:708497363618:web:39da060b48681944923dfb"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const auth = getAuth();

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
    await auth.signInWithEmailAndPassword(email, password);
    localStorage.setItem("displayName", displayName);
    message.style.color = "lime";
    message.innerText = `Welcome back, ${displayName}.`;
    setTimeout(() => (window.location.href = "index.html"), 1500);
  } catch (loginErr) {
    if (loginErr.code === "auth/user-not-found") {
      try {
        const userCred = await auth.createUserWithEmailAndPassword(email, password);
        localStorage.setItem("displayName", displayName);
        message.style.color = "lime";
        message.innerText = `Welcome to the Forge, ${displayName}.`;
        setTimeout(() => (window.location.href = "index.html"), 1500);
      } catch (signupErr) {
        message.style.color = "#f55";
        message.innerText = "Signup failed: " + signupErr.message;
      }
    } else {
      message.style.color = "#f55";
      message.innerText = "Login failed: " + loginErr.message;
    }
  }
};
