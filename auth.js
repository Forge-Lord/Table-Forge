// Firebase config (you already know this!)
const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
  storageBucket: "tableforge-app.appspot.com",
  messagingSenderId: "708497363618",
  appId: "1:708497363618:web:39da060b48681944923dfb"
};

// Init
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

async function loginOrRegister() {
  const displayName = document.getElementById("displayName").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  if (!displayName || !password) {
    message.innerText = "Please enter both display name and password.";
    return;
  }

  const email = `forge_${displayName}@forge.app`;

  try {
    // Try login first
    await auth.signInWithEmailAndPassword(email, password);
    message.innerText = `Welcome back, ${displayName}.`;
    setTimeout(() => window.location.href = "index.html", 1500);
  } catch (loginErr) {
    // If user not found, try to register
    if (loginErr.code === "auth/user-not-found") {
      try {
        const userCred = await auth.createUserWithEmailAndPassword(email, password);
        await db.collection("users").doc(userCred.user.uid).set({
          displayName,
          createdAt: new Date()
        });
        message.innerText = `Welcome to the Forge, ${displayName}.`;
        setTimeout(() => window.location.href = "index.html", 1500);
      } catch (signupErr) {
        message.innerText = "Signup failed: " + signupErr.message;
      }
    } else {
      message.innerText = "Login failed: " + loginErr.message;
    }
  }
}
