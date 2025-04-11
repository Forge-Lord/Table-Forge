// script.js for Table Forge room creation with template

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.createRoom = () => {
  const displayName = document.getElementById("displayName").value.trim();
  const template = document.getElementById("templateSelect").value || "commander";
  if (!displayName) return alert("Please enter your name");

  localStorage.setItem("displayName", displayName);
  const roomId = `room-${Math.random().toString(36).substring(2, 8)}`;
  const roomRef = ref(db, `rooms/${roomId}`);

  set(roomRef, {
    template,
    players: {
      [displayName]: {
        name: displayName,
        seat: "p1",
        life: template === "commander" ? 40 : 8000,
        status: "",
        commander: 0
      }
    }
  }).then(() => {
    window.location.href = `lobby.html?room=${roomId}`;
  });
};

window.joinRoom = () => {
  const code = document.getElementById("roomCodeInput").value.trim();
  if (code) window.location.href = `lobby.html?room=${code}`;
};
