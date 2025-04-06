import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
  storageBucket: "tableforge-app.appspot.com",
  messagingSenderId: "708497363618",
  appId: "1:708497363618:web:39da060b48681944923dfb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.createRoom = async function () {
  const roomCode = "room" + Math.floor(Math.random() * 10000);
  await setDoc(doc(db, "rooms", roomCode), { created: Date.now() });
  window.location.href = `lobby.html?room=${roomCode}`;
}

window.joinRoom = function () {
  const code = document.getElementById('roomCode').value.trim();
  if (code) {
    window.location.href = `lobby.html?room=${code}`;
  } else {
    alert("Please enter a valid room code.");
  }
};
