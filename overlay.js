// overlay.js - Final with peer signal fix for remote cam visibility

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, get, onChildAdded, onDisconnect, push } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"; import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"; import SimplePeer from "https://cdn.skypack.dev/simple-peer";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com", projectId: "tableforge-app", appId: "1:708497363618:web:39da060b48681944923dfb" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app); const auth = getAuth(app);

const params = new URLSearchParams(window.location.search); const roomCode = params.get("room"); const mySeat = localStorage.getItem("mySeat");

let selectedCamera = localStorage.getItem("selectedCamera") || ""; let selectedMic = localStorage.getItem("selectedMic") || ""; let localStream; let peers = {};

window.startOverlay = () => { console.log("▶️ Start Overlay triggered"); onAuthStateChanged(auth, async (user) => { if (!user || !roomCode || !mySeat) { alert("Missing user or room context"); return window.location.href = "/profile.html"; }

const name = localStorage.getItem("displayName") || user.displayName || user.email;
const snap = await get(ref(db, `rooms/${roomCode}`));
const roomData = snap.val();
const playerCount = roomData.playerCount;
const players = roomData.players;

configureLayout(playerCount);
updateNames(players);

const camSuccess = await startPreviewCompatibleCamera();
if (!camSuccess) return;

attachMyStream(mySeat, name);
setupPeerSync(players);

}); };

function configureLayout(playerCount) { const grid = document.querySelector(".overlay-grid"); const seats = ["P1", "P2", "P3", "P4"]; if (playerCount === 2) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr"; hideSeats(["P3", "P4"]); } else if (playerCount === 3) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr 1fr"; hideSeats(["P4"]); } else { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr 1fr"; showAllSeats(seats); } }

function hideSeats(seats) { seats.forEach(s => { const el = document.getElementById(s); if (el) el.style.display = "none"; }); }

function showAllSeats(seats) { seats.forEach(s => { const el = document.getElementById(s); if (el) el.style.display = "block"; }); }

function updateNames(players) { for (const seat in players) { const box = document.getElementById(seat); if (box && box.querySelector(".name")) { box.querySelector(".name").textContent = players[seat].name || seat; } } }

async function startPreviewCompatibleCamera() { try { const devices = await navigator.mediaDevices.enumerateDevices(); const cams = devices.filter(d => d.kind === "videoinput"); const mics = devices.filter(d => d.kind === "audioinput"); if (!selectedCamera && cams.length) selectedCamera = cams[0].deviceId; if (!selectedMic && mics.length) selectedMic = mics[0].deviceId;

localStream = await navigator.mediaDevices.getUserMedia({
  video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
  audio: selectedMic ? { deviceId: { exact: selectedMic } } : true
});
return true;

} catch (err) { console.error("getUserMedia error:", err); return false; } }

function attachMyStream(seat, name) { const box = document.getElementById(seat); if (!box) return; const vid = box.querySelector("video"); if (vid && localStream) { vid.srcObject = localStream; vid.muted = true; setTimeout(() => vid.play().catch(err => console.warn("play() failed", err)), 100); } const label = box.querySelector(".name"); if (label) label.textContent = name; }

function setupPeerSync(players) { const myRef = ref(db, signals/${roomCode}/${mySeat}); const myId = push(myRef).key; onDisconnect(ref(db, signals/${roomCode}/${mySeat}/${myId})).remove();

// send to everyone for (const seat in players) { if (seat !== mySeat && players[seat]?.name) { if (!peers[seat]) createPeer(seat, true); } }

// listen to each seat directly for (const seat in players) { if (seat === mySeat) continue; const seatRef = ref(db, signals/${roomCode}/${seat}); onChildAdded(seatRef, (sigSnap) => { const { from, signal } = sigSnap.val(); if (from === mySeat) return; if (!peers[seat]) createPeer(seat, false); peers[seat].signal(signal); }); } }

function createPeer(targetSeat, initiator) { const peer = new SimplePeer({ initiator, trickle: false, stream: localStream });

peer.on("signal", (data) => { const payload = { from: mySeat, signal: data }; push(ref(db, signals/${roomCode}/${targetSeat}), payload); });

peer.on("stream", (stream) => { const box = document.getElementById(targetSeat); if (box) { const vid = box.querySelector("video"); if (vid) { vid.srcObject = stream; setTimeout(() => vid.play().catch(err => console.warn("Remote play failed", err)), 100); } } });

peer.on("error", (err) => console.error("Peer error:", err)); peers[targetSeat] = peer; }

