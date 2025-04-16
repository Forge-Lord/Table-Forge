import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  get,
  child
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com",
  projectId: "tableforge-app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Helper to generate room codes
function makeRoomCode(length = 5) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const seatMap = {
  2: ["p1", "p2"],
  3: ["p1", "p2", "p3"],
  4: ["p1", "p2", "p3", "p4"]
};

// CREATE ROOM
window.createRoom = async function () {
  const name = localStorage.getItem("displayName");
  const roomName = document.getElementById("roomName").value.trim();
  const template = document.getElementById("template").value;
  const playerCount = parseInt(document.getElementById("playerCount").value);

  if (!name) {
    alert("Display name required.");
    return;
  }

  const roomId = "room-" + makeRoomCode();
  const roomRef = ref(db, `rooms/${roomId}`);

  await set(roomRef, {
    roomName: roomName || null,
    template,
    playerCount,
    host: name,
    started: false,
    players: {
      [name]: {
        name,
        life: template === "commander" ? 40 : 8000,
        seat: seatMap[playerCount][0],
        status: ""
      }
    }
  });

  window.location.href = `/overlay.html?room=${roomId}`;
};

// JOIN ROOM
window.joinRoom = async function () {
  const name = localStorage.getItem("displayName");
  const code = document.getElementById("roomCode").value.trim();
  const roomId = code.startsWith("room-") ? code : `room-${code}`;

  if (!name || !roomId) {
    alert("Missing name or room code.");
    return;
  }

  const roomSnap = await get(ref(db, `rooms/${roomId}`));
  if (!roomSnap.exists()) {
    alert("Room not found.");
    return;
  }

  const data = roomSnap.val();
  const players = data.players || {};
  const usedSeats = Object.values(players).map(p => p.seat);
  const openSeat = seatMap[data.playerCount].find(s => !usedSeats.includes(s));

  if (!openSeat) {
    alert("Room full.");
    return;
  }

  await update(ref(db, `rooms/${roomId}/players/${name}`), {
    name,
    life: data.template === "commander" ? 40 : 8000,
    seat: openSeat,
    status: ""
  });

  window.location.href = `/overlay.html?room=${roomId}`;
};
