// overlay.js - Finalized camera + overlay sync (v1.6)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", projectId: "tableforge-app", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app);

const urlParams = new URLSearchParams(window.location.search); const roomId = urlParams.get("room"); const displayName = localStorage.getItem("displayName") || "Unknown";

let currentStream = null; let lastVideoId = null; let currentDeviceId = null; let videoDevices = [];

// Setup base layout const layout = document.createElement("div"); layout.id = "overlayContainer"; layout.style.display = "grid"; layout.style.height = "100vh"; layout.style.background = "#000"; document.body.appendChild(layout);

function setupGrid(playerCount) { const gridLayout = { 2: "1fr / 1fr", 3: "1fr 1fr / 1fr 1fr", 4: "1fr 1fr / 1fr 1fr" }; layout.style.gridTemplate = gridLayout[playerCount] || gridLayout[4]; }

function renderPlayer(seat, player, template) { const slot = document.createElement("div"); slot.id = seat; slot.style.border = "2px solid #333"; slot.style.padding = "1em"; slot.style.color = "white";

slot.innerHTML = <h2>${player.name}</h2> <video id="cam-${seat}" autoplay muted playsinline width="100%" style="background:#000; height:180px;"></video> <div>Life: <input id="life-${seat}" value="${player.life}" /></div>;

if (template === "commander") { const cmd = ["p1", "p2", "p3", "p4"].filter(x => x !== seat).map(pid => { return <label>${pid.toUpperCase()}: <input id="cmd-${seat}-${pid}" value="${player[cmd_${pid}] || 0}" style="width:40px;" /></label>; }).join(" "); slot.innerHTML += <div>Status: <input id="stat-${seat}" value="${player.status || ''}" /></div> <div>CMD:<br/>${cmd}</div>; }

slot.innerHTML += <button onclick="save('${seat}', '${player.name}', '${template}')">Save</button>; layout.appendChild(slot);

if (player.name === displayName) { lastVideoId = cam-${seat}; startCamera(lastVideoId); } }

function save(seat, name, template) { const life = parseInt(document.getElementById(life-${seat}).value); const updateData = { life };

if (template === "commander") { updateData.status = document.getElementById(stat-${seat}).value; ["p1", "p2", "p3", "p4"].forEach(pid => { const cmd = document.getElementById(cmd-${seat}-${pid}); if (cmd) updateData[cmd_${pid}] = parseInt(cmd.value); }); }

update(ref(db, rooms/${roomId}/players/${name}), updateData); }

function startCamera(videoId) { navigator.mediaDevices.enumerateDevices().then(devices => { videoDevices = devices.filter(d => d.kind === "videoinput"); if (videoDevices.length === 0) return console.error("No camera found");

const preferred = videoDevices[0];
const constraints = {
  video: { deviceId: preferred.deviceId },
  audio: false
};

if (currentStream) currentStream.getTracks().forEach(t => t.stop());

navigator.mediaDevices.getUserMedia(constraints)
  .then(stream => {
    currentStream = stream;
    const el = document.getElementById(videoId);
    if (el) el.srcObject = stream;
  })
  .catch(err => console.error("Camera error:", err));

}); }

onValue(ref(db, rooms/${roomId}), snap => { const data = snap.val(); if (!data) return;

layout.innerHTML = ""; const template = data.template || "commander"; const players = data.players || {}; const seatKeys = ["p1", "p2", "p3", "p4"];

const count = Object.values(players).length; setupGrid(count);

for (const seat of seatKeys) { const p = Object.values(players).find(x => x.seat === seat); if (p) renderPlayer(seat, p, template); } });

