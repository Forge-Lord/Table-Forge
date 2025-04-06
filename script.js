import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com",
  projectId: "tableforge-app",
  storageBucket: "tableforge-app.appspot.com",
  messagingSenderId: "708497363618",
  appId: "1:708497363618:web:39da060b48681944923dfb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.createRoom = async function () {
  const roomCode = "room" + Math.floor(Math.random() * 10000);
  await set(ref(db, 'rooms/' + roomCode), {
    created: Date.now()
  });
  window.location.href = `lobby.html?room=${roomCode}`;
};

window.joinRoom = function () {
  const code = document.getElementById("roomCode").value.trim();
  if (code) {
    window.location.href = `lobby.html?room=${code}`;
  } else {
    alert("Please enter a valid room code.");
  }
};
