// overlay.js import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, get, onChildAdded, onDisconnect, push } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"; import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"; import SimplePeer from "https://cdn.skypack.dev/simple-peer@9.11.1?min";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com", projectId: "tableforge-app", appId: "1:708497363618:web:39da060b48681944923dfb" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app); const auth = getAuth(app);

const params = new URLSearchParams(window.location.search); const roomCode = params.get("room"); const mySeat = localStorage.getItem("mySeat"); let selectedCamera = localStorage.getItem("selectedCamera") || ""; let selectedMic = localStorage.getItem("selectedMic") || ""; let localStream; let peers = {};

window.startOverlay = () => { onAuthStateChanged(auth, async (user) => { if (!user || !roomCode || !mySeat) return window.location.href = "/profile.html";

const name = localStorage.getItem("displayName") || user.displayName || user.email;
const snap = await get(ref(db, `rooms/${roomCode}`));
const roomData = snap.val();
const playerCount = roomData.playerCount;
const players = roomData.players;

configureLayout(playerCount);
updateNames(players);

const success = await startFreshCamera();
if (!success) return;

attachMyStream(mySeat, name);
setupPeerSync(players);
setupChat(user);

}); };

function configureLayout(count) { const grid = document.querySelector(".overlay-grid"); if (count === 2) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr"; ["P3", "P4"].forEach(id => document.getElementById(id).style.display = "none"); } else if (count === 3) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr 1fr"; ["P4"].forEach(id => document.getElementById(id).style.display = "none"); } }

function updateNames(players) { for (const seat in players) { const label = document.querySelector(#${seat} .name); if (label) label.textContent = players[seat].name; } }

async function startFreshCamera() { try { const stream = await navigator.mediaDevices.getUserMedia({ video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true, audio: selectedMic ? { deviceId: { exact: selectedMic } } : true }); localStream = stream; return true; } catch (e) { console.error("Failed to get camera:", e); return false; } }

function attachMyStream(seat, name) { const box = document.getElementById(seat); const vid = box?.querySelector("video"); if (vid) { vid.srcObject = localStream; vid.muted = true; vid.play().catch(e => console.warn("play failed", e)); } const label = box?.querySelector(".name"); if (label) label.textContent = name; }

function setupPeerSync(players) { const myRef = ref(db, signals/${roomCode}/${mySeat}); const myId = push(myRef).key; onDisconnect(ref(db, signals/${roomCode}/${mySeat}/${myId})).remove();

for (const seat in players) { if (seat !== mySeat && players[seat]?.name) createPeer(seat, true); }

for (const seat in players) { if (seat === mySeat) continue; const seatRef = ref(db, signals/${roomCode}/${seat}); onChildAdded(seatRef, (snap) => { const { from, signal } = snap.val(); if (from === mySeat) return; if (!peers[seat]) createPeer(seat, false); peers[seat].signal(signal); }); } }

function createPeer(targetSeat, initiator) { const peer = new SimplePeer({ initiator, trickle: false, stream: localStream });

peer.on("signal", (data) => { const payload = { from: mySeat, signal: data }; push(ref(db, signals/${roomCode}/${targetSeat}), payload); });

peer.on("stream", (stream) => { const vid = document.querySelector(#${targetSeat} video); if (vid) { vid.srcObject = stream; vid.play().catch(e => console.warn("remote play error", e)); } });

peer.on("error", err => console.error(Peer ${targetSeat} error, err)); peers[targetSeat] = peer; }

function setupChat(user) { const chatInput = document.getElementById("chatInput"); const chatBox = document.getElementById("chatBox"); const listRef = ref(db, chats/${roomCode});

document.getElementById("chatSend").onclick = () => { const text = chatInput.value.trim(); if (text) { push(listRef, { user: user.displayName || "Unknown", msg: text }); chatInput.value = ""; } };

onChildAdded(listRef, (snap) => { const { user, msg } = snap.val(); const el = document.createElement("div"); el.textContent = ${user}: ${msg}; chatBox.appendChild(el); chatBox.scrollTop = chatBox.scrollHeight; }); }

