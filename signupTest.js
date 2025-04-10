import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

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

// Hardcoded test credentials
const email = "testuser@forge.app";
const password = "testing123";

createUserWithEmailAndPassword(auth, email, password)
  .then(userCredential => {
    console.log("✅ User created:", userCredential.user);
    alert("Signup worked!");
  })
  .catch(error => {
    console.error("❌ Signup error:", error);
    alert("Signup failed: " + error.message);
  });
