import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, set, get, child, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", projectId: "tableforge-app", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app);

let currentRoom = null; let currentName = localStorage.getItem("displayName") || "";

function makeCode(length = 5) { const chars = "abcdefghijklmnopqrstuvwxyz0123456789"; return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }

async function createRoom() { const name = localStorage.getItem("displayName"); if (!name) { alert("You must be signed in to create a room."); return window.location.href = "/profile.html"; }

const roomName = document.getElementById("roomName").value.trim(); const template = document.getElementById("template").value; const playerCount = parseInt(document.getElementById("playerCount").value); const roomId = "room-" + makeCode(); const roomRef = ref(db, rooms/${roomId}); const seatMap = { 2: ["p1", "p2"], 3: ["p1", "p2", "p3"], 4: ["p1", "p2", "p3", "p4"] };

await set(roomRef, { roomName: roomName || null, template, playerCount, host: name, started: false, players: { [name]: { name, life: template === "commander" ? 40 : 8000, commander: 0, status: "", seat: seatMap[playerCount][0] } } });

joinLobby(roomId); }

async function joinRoom() { const name = localStorage.getItem("displayName") || "Unknown"; const code = document.getElementById("roomCode").value.trim(); if (!code) return alert("Please enter a room code");

const roomId = code.startsWith("room-") ? code : room-${code}; joinLobby(roomId); }

function joinLobby(roomId) { currentRoom = roomId; currentName = localStorage.getItem("displayName") || "Unknown";

document.getElementById("preGame").style.display = "none"; document.getElementById("lobbyView").style.display = "block"; document.getElementById("roomDisplay").textContent = roomId;

const roomRef = ref(db, rooms/${roomId});

onValue(roomRef, snap => { const data = snap.val(); if (!data) return;

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

}); }

function startGame() { const roomRef = ref(db, rooms/${currentRoom}); update(roomRef, { started: true }); }

function flipCamera() { const current = localStorage.getItem("cameraFacingMode") || "user"; localStorage.setItem("cameraFacingMode", current === "user" ? "environment" : "user"); }

// Fix mobile scope by binding explicitly window.createRoom = createRoom; window.joinRoom = joinRoom; window.startGame = startGame; window.flipCamera = flipCamera;

