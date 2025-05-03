// overlay.js (Updated) import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, get, onChildAdded, onDisconnect, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"; import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"; import SimplePeer from "https://cdn.skypack.dev/simple-peer";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com", projectId: "tableforge-app", appId: "1:708497363618:web:39da060b48681944923dfb" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app); const auth = getAuth(app);

const params = new URLSearchParams(window.location.search); const roomCode = params.get("room"); const mySeat = localStorage.getItem("mySeat");

let selectedCamera = localStorage.getItem("selectedCamera") || ""; let selectedMic = localStorage.getItem("selectedMic") || ""; let localStream; let peers = {};

window.startOverlay = () => { onAuthStateChanged(auth, async (user) => { if (!user || !roomCode || !mySeat) return window.location.href = "/profile.html";

const name = localStorage.getItem("displayName") || user.displayName || user.email || mySeat;
const snap = await get(ref(db, `rooms/${roomCode}`));
const roomData = snap.val();
const playerCount = roomData.playerCount;
const players = roomData.players;

configureLayout(playerCount);
updateNames(players);
addStatusLabels();

const camSuccess = await startCamera();
if (!camSuccess) return;

attachMyStream(mySeat, name);
setupPeerSync(players);
startChatSync(name);

}); };

function configureLayout(playerCount) { const grid = document.querySelector(".overlay-grid"); const seats = ["P1", "P2", "P3", "P4"]; if (playerCount === 2) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr"; hideSeats(["P3", "P4"]); } else if (playerCount === 3) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr 1fr"; hideSeats(["P4"]); } else { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr 1fr"; showAllSeats(seats); } }

function hideSeats(seats) { for (const s of seats) { const el = document.getElementById(s); if (el) el.style.display = "none"; } }

function showAllSeats(seats) { for (const s of seats) { const el = document.getElementById(s); if (el) el.style.display = "block"; } }

function updateNames(players) { for (const seat in players) { const box = document.getElementById(seat); const label = box?.querySelector(".name"); if (label) label.textContent = players[seat].name || seat; } }

function addStatusLabels() { const seats = ["P1", "P2", "P3", "P4"]; for (const seat of seats) { const box = document.getElementById(seat); if (box && !box.querySelector(".status")) { const status = document.createElement("div"); status.className = "status"; status.textContent = "Waiting..."; box.appendChild(status); } } }

async function startCamera() { try { const devices = await navigator.mediaDevices.enumerateDevices(); const cams = devices.filter(d => d.kind === "videoinput"); const mics = devices.filter(d => d.kind === "audioinput");

if (!selectedCamera && cams.length) selectedCamera = cams[0].deviceId;
if (!selectedMic && mics.length) selectedMic = mics[0].deviceId;

const stream = await navigator.mediaDevices.getUserMedia({
  video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
  audio: selectedMic ? { deviceId: { exact: selectedMic } } : true
});
localStream = stream;
return true;

} catch (err) { console.error("❌ Camera init failed:", err); return false; } }

function attachMyStream(seat, name) { const box = document.getElementById(seat); const vid = box?.querySelector("video"); const label = box?.querySelector(".name"); const status = box?.querySelector(".status"); if (vid && localStream) { vid.srcObject = localStream; vid.muted = true; vid.play().catch(err => console.warn("Local play failed", err)); if (status) status.textContent = "Streaming"; } if (label) label.textContent = name; }

function setupPeerSync(players) { const myRef = ref(db, signals/${roomCode}/${mySeat}); const myId = push(myRef).key; onDisconnect(ref(db, signals/${roomCode}/${mySeat}/${myId})).remove();

for (const seat in players) { if (seat !== mySeat && players[seat]?.name) { if (!peers[seat]) createPeer(seat, true); } }

for (const seat in players) { if (seat === mySeat) continue; const seatRef = ref(db, signals/${roomCode}/${seat}); onChildAdded(seatRef, (sigSnap) => { const val = sigSnap.val(); if (!val || val.from === mySeat) return; if (!peers[seat]) createPeer(seat, false); peers[seat].signal(val.signal); }); } }

function createPeer(targetSeat, initiator) { const peer = new SimplePeer({ initiator, trickle: false, stream: localStream });

peer.on("signal", (data) => { const payload = { from: mySeat, signal: data }; push(ref(db, signals/${roomCode}/${targetSeat}), payload); });

peer.on("stream", (stream) => { const box = document.getElementById(targetSeat); const vid = box?.querySelector("video"); const status = box?.querySelector(".status"); if (vid) { vid.srcObject = stream; vid.play().catch(err => console.warn("Remote play failed", err)); if (status) status.textContent = "Connected"; } });

peer.on("error", (err) => { console.warn("Peer error (", targetSeat, "):", err); const box = document.getElementById(targetSeat); const status = box?.querySelector(".status"); if (status) status.textContent = "Error"; });

setTimeout(() => { const box = document.getElementById(targetSeat); const status = box?.querySelector(".status"); if (status && !status.textContent.includes("Connected")) { status.textContent = "No stream after 5s"; } }, 5000);

peers[targetSeat] = peer; }

function startChatSync(name) { const input = document.getElementById("chatInput"); const box = document.getElementById("chatBox"); const chatRef = ref(db, rooms/${roomCode}/chat);

input.addEventListener("keydown", (e) => { if (e.key === "Enter" && input.value.trim()) { const msg = { from: name, text: input.value, time: Date.now() }; push(chatRef, msg); input.value = ""; } });

onChildAdded(chatRef, (snap) => { const msg = snap.val(); const div = document.createElement("div"); div.textContent = ${msg.from}: ${msg.text}; box.appendChild(div); box.scrollTop = box.scrollHeight; }); }

