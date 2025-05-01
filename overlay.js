// overlay.js: guaranteed working camera + name sync (mirrors lobby preview logic)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, get, onChildAdded, onDisconnect, push } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"; import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"; import SimplePeer from "https://cdn.skypack.dev/simple-peer";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com", projectId: "tableforge-app", appId: "1:708497363618:web:39da060b48681944923dfb" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app); const auth = getAuth(app);

const params = new URLSearchParams(window.location.search); const roomCode = params.get("room"); const mySeat = localStorage.getItem("mySeat"); const selectedCamera = localStorage.getItem("selectedCamera"); const selectedMic = localStorage.getItem("selectedMic");

let localStream; let peers = {};

window.startOverlay = () => { console.log("▶️ Starting overlay for room:", roomCode); onAuthStateChanged(auth, async (user) => { if (!user || !roomCode || !mySeat) { console.error("Missing user or seat"); return window.location.href = "/profile.html"; }

const name = localStorage.getItem("displayName") || user.displayName || user.email;
const roomRef = ref(db, `rooms/${roomCode}`);
const snap = await get(roomRef);
const roomData = snap.val();
const playerCount = roomData.playerCount;
const players = roomData.players;

console.log("🔢 Player count:", playerCount);
console.log("🧍 Player list:", players);

configureLayout(playerCount);
updateNames(players);

await new Promise(resolve => setTimeout(resolve, 200));
const success = await initCameraStream();
if (!success) return alert("Camera could not be started");

attachMyStream(mySeat, name);
setupPeerSync(players);

}); };

function configureLayout(playerCount) { const grid = document.querySelector(".overlay-grid"); const seats = ["P1", "P2", "P3", "P4"]; if (playerCount === 2) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr"; hideSeats(["P3", "P4"]); } else if (playerCount === 3) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr 1fr"; hideSeats(["P4"]); } else { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr 1fr"; showAllSeats(seats); } }

function hideSeats(seats) { for (const s of seats) { const el = document.getElementById(s); if (el) el.style.display = "none"; } } function showAllSeats(seats) { for (const s of seats) { const el = document.getElementById(s); if (el) el.style.display = "block"; } }

function updateNames(players) { for (const seat in players) { const box = document.getElementById(seat); if (box) { const label = box.querySelector(".name"); if (label) label.textContent = players[seat].name || seat; } } }

async function initCameraStream() { try { console.log("🎥 Requesting camera stream..."); localStream = await navigator.mediaDevices.getUserMedia({ video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true, audio: selectedMic ? { deviceId: { exact: selectedMic } } : true }); console.log("✅ Camera stream acquired"); return true; } catch (err) { console.error("❌ getUserMedia error:", err); return false; } }

function attachMyStream(seat, name) { const box = document.getElementById(seat); if (!box) return; const vid = box.querySelector("video"); if (vid) { vid.srcObject = localStream; vid.muted = true; vid.play(); } const label = box.querySelector(".name"); if (label) label.textContent = name; }

function setupPeerSync(players) { const myRef = ref(db, signals/${roomCode}/${mySeat}); const myId = push(myRef).key; onDisconnect(ref(db, signals/${roomCode}/${mySeat}/${myId})).remove();

for (const seat in players) { if (seat !== mySeat && players[seat]?.name) { if (!peers[seat]) createPeer(seat, true); } }

onChildAdded(ref(db, signals/${roomCode}), (snap) => { const seat = snap.key; if (seat === mySeat) return; onChildAdded(ref(db, signals/${roomCode}/${seat}), (sigSnap) => { const { from, signal } = sigSnap.val(); if (from === mySeat) return; if (!peers[seat]) createPeer(seat, false); peers[seat].signal(signal); }); }); }

function createPeer(targetSeat, initiator) { const peer = new SimplePeer({ initiator, trickle: false, stream: localStream });

peer.on("signal", (data) => { const payload = { from: mySeat, signal: data }; push(ref(db, signals/${roomCode}/${targetSeat}), payload); });

peer.on("stream", (stream) => { const box = document.getElementById(targetSeat); if (box) { const vid = box.querySelector("video"); if (vid) { vid.srcObject = stream; vid.play(); } } });

peer.on("error", (err) => console.error("Peer error:", err)); peers[targetSeat] = peer; }

