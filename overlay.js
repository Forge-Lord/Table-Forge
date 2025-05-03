// === overlay.js (Updated v5.0) === import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, get, set, onValue, onChildAdded, onDisconnect, push, remove } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"; import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"; import SimplePeer from "https://cdn.skypack.dev/simple-peer";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com", projectId: "tableforge-app", appId: "1:708497363618:web:39da060b48681944923dfb" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app); const auth = getAuth(app);

const params = new URLSearchParams(window.location.search); const roomCode = params.get("room"); const mySeat = localStorage.getItem("mySeat");

let selectedCamera = localStorage.getItem("selectedCamera") || ""; let selectedMic = localStorage.getItem("selectedMic") || ""; let localStream = null; let peers = {}; let muted = false; let camOff = false;

async function startOverlay() { onAuthStateChanged(auth, async (user) => { if (!user || !roomCode || !mySeat) return window.location.href = "/profile.html"; const name = localStorage.getItem("displayName") || user.displayName || user.email;

const snap = await get(ref(db, `rooms/${roomCode}`));
const roomData = snap.val();
const players = roomData.players;

configureLayout(roomData.playerCount);
updateNames(players);
setupMenu();
setupChat();

const streamReady = await startCameraAndMic();
if (!streamReady) return;

attachStream(mySeat);
setupPeers(players);
startLifeSync();

}); }

window.startOverlay = startOverlay;

function configureLayout(count) { const grid = document.querySelector(".overlay-grid"); grid.style.gridTemplateRows = count === 2 ? "1fr 1fr" : "1fr 1fr"; grid.style.gridTemplateColumns = count === 2 ? "1fr" : "1fr 1fr"; const seats = ["P1", "P2", "P3", "P4"]; seats.forEach(s => { const el = document.getElementById(s); if (el) el.style.display = (parseInt(s.slice(1)) <= count) ? "block" : "none"; }); }

function updateNames(players) { for (const seat in players) { const name = players[seat].name || seat; const label = document.querySelector(#${seat} .name); if (label) label.textContent = name; } }

async function startCameraAndMic() { try { const devices = await navigator.mediaDevices.enumerateDevices(); const cam = selectedCamera || devices.find(d => d.kind === "videoinput")?.deviceId; const mic = selectedMic || devices.find(d => d.kind === "audioinput")?.deviceId;

localStream = await navigator.mediaDevices.getUserMedia({
  video: cam ? { deviceId: { exact: cam } } : true,
  audio: mic ? { deviceId: { exact: mic } } : true
});
return true;

} catch (err) { console.error("Media error", err); return false; } }

function attachStream(seat) { const box = document.getElementById(seat); const vid = box?.querySelector("video"); if (vid && localStream) { vid.srcObject = localStream; vid.muted = true; vid.play().catch(() => {}); } }

function setupPeers(players) { const myRef = ref(db, signals/${roomCode}/${mySeat}); const myId = push(myRef).key; onDisconnect(ref(db, signals/${roomCode}/${mySeat}/${myId})).remove();

for (const seat in players) { if (seat !== mySeat && players[seat]?.name) { if (!peers[seat]) createPeer(seat, true); } }

for (const seat in players) { if (seat === mySeat) continue; const seatRef = ref(db, signals/${roomCode}/${seat}); onChildAdded(seatRef, (snap) => { const { from, signal } = snap.val(); if (from === mySeat) return; if (!peers[seat]) createPeer(seat, false); peers[seat].signal(signal); }); } }

function createPeer(seat, initiator) { const peer = new SimplePeer({ initiator, trickle: false, stream: localStream });

peer.on("signal", (data) => { push(ref(db, signals/${roomCode}/${seat}), { from: mySeat, signal: data }); });

peer.on("stream", (stream) => { const box = document.getElementById(seat); const vid = box?.querySelector("video"); if (vid) { vid.srcObject = stream; vid.play().catch(() => {}); } });

peers[seat] = peer; }

function setupMenu() { const menu = document.createElement("div"); menu.id = "playerMenu"; menu.innerHTML = <button onclick="toggleCam()">Toggle Cam</button> <button onclick="toggleMic()">Toggle Mic</button> <button onclick="leaveRoom()">Leave Room</button> <button onclick="toggleChat()">Chat</button>; Object.assign(menu.style, { position: "absolute", top: "10px", right: "10px", background: "#111", padding: "10px", borderRadius: "10px", zIndex: 10000 }); document.body.appendChild(menu);

window.toggleCam = () => { camOff = !camOff; localStream.getVideoTracks().forEach(t => t.enabled = !camOff); }; window.toggleMic = () => { muted = !muted; localStream.getAudioTracks().forEach(t => t.enabled = !muted); }; window.leaveRoom = () => { if (confirm("Leave the room?")) window.location.href = "/profile.html"; }; window.toggleChat = () => { const c = document.getElementById("chatBox"); c.style.display = (c.style.display === "none") ? "block" : "none"; }; }

function setupChat() { const chat = document.createElement("div"); chat.id = "chatBox"; chat.innerHTML = <div id="chatLog" style="height:200px;overflow:auto;background:#222;margin-bottom:5px;padding:5px;"></div> <input id="chatInput" placeholder="Message..." style="width:80%"> <button onclick="sendChat()">Send</button>; Object.assign(chat.style, { position: "absolute", bottom: "10px", left: "10px", width: "300px", background: "#111", padding: "10px", display: "none", borderRadius: "10px", zIndex: 10000 }); document.body.appendChild(chat);

const log = document.getElementById("chatLog"); onChildAdded(ref(db, rooms/${roomCode}/chat), (snap) => { const msg = snap.val(); const div = document.createElement("div"); div.textContent = ${msg.name}: ${msg.text}; log.appendChild(div); log.scrollTop = log.scrollHeight; });

window.sendChat = () => { const input = document.getElementById("chatInput"); const text = input.value.trim(); if (text) { const name = localStorage.getItem("displayName") || "Anon"; push(ref(db, rooms/${roomCode}/chat), { name, text, time: Date.now() }); input.value = ""; } }; }

