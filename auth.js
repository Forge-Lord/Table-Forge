<script type="module">
  // Firebase imports
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
  import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
    authDomain: "tableforge-app.firebaseapp.com",
    projectId: "tableforge-app",
    messagingSenderId: "708497363618",
    appId: "1:708497363618:web:39da060b48681944923dfb"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  document.getElementById("confirmBtn").addEventListener("click", async () => {
    const displayName = document.getElementById("displayName").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorDiv = document.getElementById("error");

    if (!displayName || !password) {
      errorDiv.textContent = "Please enter both name and password.";
      return;
    }

    const fakeEmail = `${displayName.toLowerCase().replace(/\s+/g, "")}@tableforge.app`;

    try {
      await signInWithEmailAndPassword(auth, fakeEmail, password);
      console.log("Login successful.");
      localStorage.setItem("displayName", displayName);
      window.location.href = "/"; // Redirect to homepage or dashboard
    } catch (loginErr) {
      if (loginErr.code === "auth/user-not-found") {
        try {
          await createUserWithEmailAndPassword(auth, fakeEmail, password);
          console.log("New account created.");
          localStorage.setItem("displayName", displayName);
          window.location.href = "/";
        } catch (createErr) {
          errorDiv.textContent = "Failed to create account. Try again.";
          console.error(createErr);
        }
      } else {
        errorDiv.textContent = "Incorrect password. Try again.";
        console.error(loginErr);
      }
    }
  });
</script>
