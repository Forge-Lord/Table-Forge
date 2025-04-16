import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

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
  const roomName = document.getElementById("roomName").value.trim();
  const template = document.getElementById("template").value;
  const playerCount = parseInt(document.getElementById("playerCount").value);
  const displayName = localStorage.getItem("displayName");

  if (!displayName) return alert("Not logged in.");

  const roomId = "room-" + makeCode();
  const roomRef = ref(db, `rooms/${roomId}`);
  const seatMap = { 2: ["p1", "p2"], 3: ["p1", "p2", "p3"], 4: ["p1", "p2", "p3", "p4"] };

  await set(roomRef, {
    roomName: roomName || null,
    template,
    playerCount,
    host: displayName,
    started: false,
    players: {
      [displayName]: {
        name: displayName,
        seat: seatMap[playerCount][0],
        life: template === "commander" ? 40 : 8000,
        status: "",
        commander: 0
      }
    }
  });

  joinLobby(roomId);
};

window.joinRoom = function () {
  const roomCode = document.getElementById("roomCode").value.trim();
  if (!roomCode) return alert("Please enter a room code.");

  const roomId = roomCode.startsWith("room-") ? roomCode : `room-${roomCode}`;
  joinLobby(roomId);
};

function joinLobby(roomId) {
  currentRoom = roomId;
  currentName = localStorage.getItem("displayName") || "";

  document.getElementById("preGame").style.display = "none";
  document.getElementById("lobbyView").style.display = "block";
  document.getElementById("roomDisplay").textContent = roomId;

  const roomRef = ref(db, `rooms/${roomId}`);
  const seatKeys = ["p1", "p2", "p3", "p4"];

  onValue(roomRef, snap => {
    const data = snap.val();
    if (!data) return;

    const playerList = document.getElementById("playerList");
    playerList.innerHTML = "";

    const players = data.players || {};
    const usedSeats = Object.values(players).map(p => p.seat);

    for (const pname in players) {
      const p = players[pname];
      const entry = document.createElement("div");
      entry.className = "player-entry";
      entry.textContent = `${p.seat.toUpperCase()} - ${p.name}`;
      playerList.appendChild(entry);
    }

    // Join if not in yet
    if (!players[currentName]) {
      const openSeat = seatKeys.find(s => !usedSeats.includes(s));
      if (!openSeat) return alert("Room full.");
      update(ref(db, `rooms/${roomId}/players/${currentName}`), {
        name: currentName,
        seat: openSeat,
        life: data.template === "commander" ? 40 : 8000,
        status: "",
        commander: 0
      });
    }

    if (data.host === currentName && !data.started) {
      document.getElementById("startGameBtn").style.display = "inline-block";
    }

    if (data.started) {
      window.location.href = `/overlay.html?room=${roomId}`;
    }
  });
}

window.startGame = function () {
  if (currentRoom) {
    update(ref(db, `rooms/${currentRoom}`), { started: true });
  }
};

window.flipCamera = function () {
  const current = localStorage.getItem("cameraFacingMode") || "user";
  localStorage.setItem("cameraFacingMode", current === "user" ? "environment" : "user");
};
