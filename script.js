import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com",
  projectId: "tableforge-app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.createRoom = async function () {
  const name = document.getElementById("name").value.trim();
  const roomName = document.getElementById("roomName").value.trim();
  const template = document.getElementById("template").value;
  const playerCount = parseInt(document.getElementById("playerCount").value);

  if (!name) return alert("Please enter your name");

  const roomId = "room-" + Math.random().toString(36).substring(2, 7);
  const seat = "p1";

  alert(`Creating room as ${name}, id: ${roomId}`);

  await set(ref(db, `rooms/${roomId}`), {
    roomName: roomName || null,
    template,
    playerCount,
    host: name,
    started: false,
    players: {
      [name]: {
        name,
        life: template === "commander" ? 40 : 8000,
        seat,
        status: ""
      }
    }
  });

  window.location.href = `/overlay.html?room=${roomId}`;
};
