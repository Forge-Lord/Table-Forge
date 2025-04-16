import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com",
  projectId: "tableforge-app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentRoom = null;
let currentName = localStorage.getItem("displayName") || "";

function makeCode(length = 5) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

window.createRoom = async function () {
  const name = document.getElementById("name").value.trim();
  const roomName = document.getElementById("roomName").value.trim();
  const template = document.getElementById("template").value;
  const playerCount = parseInt(document.getElementById("playerCount").value);
  if (!name) return alert("Please enter your name");

  localStorage.setItem("displayName", name);

  const roomId = "room-" + makeCode();
  const seatMap = { 2: ["p1", "p2"], 3: ["p1", "p2", "p3"], 4: ["p1", "p2", "p3", "p4"] };

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
        commander: 0,
        status: "",
        seat: seatMap[playerCount][0]
      }
    }
  });

  window.location.href = `/overlay.html?room=${roomId}`;
};
