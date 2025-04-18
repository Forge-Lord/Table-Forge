import { db, app } from "./firebase.js";
import {
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const auth = getAuth(app);
let currentRoom = null;
let currentName = null;

// Monitor auth and show profile name
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "/profile.html";
  } else {
    const displayName = localStorage.getItem("displayName") || "Unknown";
    currentName = displayName;
    document.getElementById("profileName").textContent = displayName;
  }
});

document.getElementById("logoutBtn").onclick = async () => {
  await signOut(auth);
  localStorage.clear();
  window.location.href = "/";
};

function makeRoomCode(length = 5) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function createRoom() {
  const name = localStorage.getItem("displayName");
  if (!name) return alert("No display name found.");

  const roomName = document.getElementById("roomName").value.trim();
  const template = document.getElementById("template").value;
  const playerCount = parseInt(document.getElementById("playerCount").value);
  const roomId = "room-" + makeRoomCode();
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

  joinLobby(roomId);
}

function joinLobby(roomId) {
  currentRoom = roomId;
  currentName = localStorage.getItem("displayName") || "Unknown";

  document.getElementById("preGame").style.display = "none";
  document.getElementById("lobbyView").style.display = "block";
  document.getElementById("roomDisplay").textContent = roomId;

  const roomRef = ref(db, `rooms/${roomId}`);

  onValue(roomRef, snap => {
    const data = snap.val();
    if (!data) return;

    const playerListDiv = document.getElementById("playerList");
    playerListDiv.innerHTML = "";
    const players = data.players || {};
    const seatKeys = ["p1", "p2", "p3", "p4"];
    const usedSeats = Object.values(players).map(p => p.seat);

    for (const pname in players) {
      const p = players[pname];
      const div = document.createElement("div");
      div.className = "player-entry";
      div.textContent = `${p.seat.toUpperCase()} - ${p.name}`;
      playerListDiv.appendChild(div);
    }

    if (!players[currentName]) {
      const openSeat = seatKeys.find(sk => !usedSeats.includes(sk));
      if (!openSeat) return alert("Room full");
      update(ref(db, `rooms/${roomId}/players/${currentName}`), {
        name: currentName,
        seat: openSeat,
        life: data.template === "commander" ? 40 : 8000,
        commander: 0,
        status: ""
      });
    }

    const startBtn = document.getElementById("startGameBtn");
    if (data.host === currentName && !data.started) {
      startBtn.style.display = "inline-block";
    }

    if (data.started) {
      window.location.href = `/overlay.html?room=${roomId}`;
    }
  });
}

async function joinRoom() {
  const name = localStorage.getItem("displayName") || "Unknown";
  const code = document.getElementById("roomCode").value.trim();
  if (!code) return alert("Please enter a room code");
  const roomId = code.startsWith("room-") ? code : `room-${code}`;
  joinLobby(roomId);
}

function startGame() {
  if (!currentRoom) return;
  const roomRef = ref(db, `rooms/${currentRoom}`);
  update(roomRef, { started: true });
}

function flipCamera() {
  const current = localStorage.getItem("cameraFacingMode") || "user";
  localStorage.setItem("cameraFacingMode", current === "user" ? "environment" : "user");
}

// Expose functions to global for button calls
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.startGame = startGame;
window.flipCamera = flipCamera;
