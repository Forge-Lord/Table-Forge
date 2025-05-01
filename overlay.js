// overlay.js (Fully Patched, Future-Proofed Version)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, get, onChildAdded, onDisconnect, push } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"; import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"; import SimplePeer from "https://cdn.skypack.dev/simple-peer";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com", projectId: "tableforge-app", appId: "1:708497363618:web:39da060b48681944923dfb" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app); const auth = getAuth(app);

const params = new URLSearchParams(window.location.search); const roomCode = params.get("room"); const mySeat = localStorage.getItem("mySeat"); const selectedCamera = localStorage.getItem("selectedCamera"); const selectedMic = localStorage.getItem("selectedMic");

let localStream; let peers = {}; let peerId;

onAuthStateChanged(auth, async (user) => { if (!user || !roomCode || !mySeat) { alert("Missing room or seat. Please rejoin."); window.location.href = "/lobby.html"; return; }

const name = localStorage.getItem("displayName") || user.displayName || user.email;

const roomRef = ref(db, rooms/${roomCode}); const snap = await get(roomRef); const roomData = snap.val();

const template = roomData.template; const playerCount = roomData.playerCount;

setupGridLayout(playerCount); updatePlayerNames(roomData.players);

const started = await startCamera(); if (!started) { alert("Camera/mic could not start. Check permissions."); return; }

setupMySeat(mySeat, name); syncWithPeers(roomData.players); });

function setupGridLayout(playerCount) { const grid = document.querySelector(".overlay-grid"); if (!grid) return;

if (playerCount === 2) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr"; hideSeats(["P3", "P4"]); } else if (playerCount === 3) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr 1fr"; hideSeats(["P4"]); } else { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr 1fr"; } }

function hideSeats(seats) { seats.forEach(s => { const el = document.getElementById(s); if (el) el.style.display = "none"; }); }

function updatePlayerNames(players) { for (let seat in players) { const box = document.getElementById(seat); if (box && box.querySelector(".name")) { box.querySelector(".name").textContent = players[seat].name || seat; } } }

async function startCamera() { try { localStream = await navigator.mediaDevices.getUserMedia({ video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true, audio: selectedMic ? { deviceId: { exact: selectedMic } } : true }); return true; } catch (e) { console.error("Camera startup error:", e); return false; } }

function setupMySeat(seat, name) { const box = document.getElementById(seat); if (box) { const vid = box.querySelector("video"); if (vid) { vid.srcObject = localStream; vid.muted = true; vid.play(); } const nameEl = box.querySelector(".name"); if (nameEl) nameEl.textContent = name; } }

function syncWithPeers(players) { peerId = push(ref(db, signals/${roomCode}/${mySeat})).key; onDisconnect(ref(db, signals/${roomCode}/${mySeat}/${peerId})).remove();

for (let seat in players) { if (seat !== mySeat && players[seat].name) { if (!peers[seat]) createPeer(seat, true); } }

onChildAdded(ref(db, signals/${roomCode}), (snap) => { const seat = snap.key; if (seat === mySeat) return;

onChildAdded(ref(db, `signals/${roomCode}/${seat}`), (sigSnap) => {
  const { from, signal } = sigSnap.val();
  if (from === mySeat) return;

  if (!peers[seat]) {
    createPeer(seat, false);
  }

  peers[seat].signal(signal);
});

}); }

function createPeer(targetSeat, initiator) { const peer = new SimplePeer({ initiator, trickle: false, stream: localStream });

peer.on("signal", (data) => { const payload = { from: mySeat, signal: data }; push(ref(db, signals/${roomCode}/${targetSeat}), payload); });

peer.on("stream", (stream) => { const box = document.getElementById(targetSeat); if (box) { const vid = box.querySelector("video"); if (vid) { vid.srcObject = stream; vid.play(); } } });

peer.on("error", (err) => console.error("Peer error:", err)); peers[targetSeat] = peer; }

