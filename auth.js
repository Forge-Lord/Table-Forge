import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

// Firebase config (make sure this matches your project)
const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
  storageBucket: "tableforge-app.appspot.com",
  messagingSenderId: "708497363618",
  appId: "1:708497363618:web:39da060b48681944923dfb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle login form
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const email = `${username.toLowerCase()}@tableforge.app`;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = `/overlay.html?user=${encodeURIComponent(username)}`;
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        window.location.href = `/overlay.html?user=${encodeURIComponent(username)}`;
      } catch (createErr) {
        showError("Error creating profile.");
        console.error(createErr);
      }
    } else if (error.code === "auth/wrong-password") {
      showError("Incorrect password. Try again.");
    } else {
      showError("Unexpected error. Check console.");
      console.error(error);
    }
  }
});

function showError(msg) {
  const errorBox = document.getElementById("error");
  errorBox.innerText = msg;
  errorBox.style.display = "block";
}
