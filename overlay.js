// overlay.js with bulletproof camera activation and layout sync import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", projectId: "tableforge-app", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com" }; const app = initializeApp(firebaseConfig); const db = getDatabase(app);

const urlParams = new URLSearchParams(window.location.search); const roomId = urlParams.get("room"); const displayName = localStorage.getItem("displayName") || "Unknown";

document.body.style.margin = 0; document.body.style.background = "#000";

const layout = document.createElement("div"); layout.id = "overlayContainer"; layout.style.display = "grid"; layout.style.height = "100vh"; document.body.appendChild(layout);

let currentStream = null; let lastVideoId = null; let preferredDeviceId = null;

async function enumerateCameras() { const devices = await navigator.mediaDevices.enumerateDevices(); return devices.filter(d => d.kind === "videoinput"); }

async function startCamera(videoId) { const devices = await enumerateCameras(); if (devices.length === 0) return console.error("No video input devices found");

const facingMode = localStorage.getItem("cameraFacingMode") || "user"; let constraints = { video: { facingMode }, audio: false };

if (preferredDeviceId) { constraints = { video: { deviceId: { exact: preferredDeviceId } }, audio: false }; }

try { const stream = await navigator.mediaDevices.getUserMedia(constraints); currentStream?.getTracks().forEach(t => t.stop()); currentStream = stream;

const el = document.getElementById(videoId);
if (el) el.srcObject = stream;

const track = stream.getVideoTracks()[0];
preferredDeviceId = track.getSettings().deviceId;

} catch (err) { console.error("Camera access error:", err); } }

function setupLayout(playerCount) { const gridLayout = { 2: "1fr / 1fr", 3: "1fr 1fr / 1fr 1fr", 4: "1fr 1fr / 1fr 1fr" }; layout.style.gridTemplate = gridLayout[playerCount] || gridLayout[4]; layout.innerHTML = ""; }

function renderSeat(seat, player, template) { const div = document.createElement("div"); div.id = seat; div.style.border = "2px solid #333"; div.style.padding = "1em"; div.style.color = "white"; div.style.background = "#111"; div.innerHTML = <h2>${player.name}</h2> <video id="cam-${seat}" autoplay muted playsinline></video> <div>Life: <input id="life-${seat}" value="${player.life}" /></div>;

if (template === "commander") { const others = ["p1", "p2", "p3", "p4"].filter(x => x !== seat); const cmdInputs = others.map(pid => <label>${pid.toUpperCase()}: <input id="cmd-${seat}-${pid}" value="${player[cmd_${pid}] || 0}" style="width:40px;" /></label>).join(" "); div.innerHTML += <div>Status: <input id="stat-${seat}" value="${player.status || ''}" /></div><div>CMD:<br/>${cmdInputs}</div>; }

div.innerHTML += <button onclick="save('${seat}', '${player.name}', '${template}')">Save</button>; layout.appendChild(div);

if (player.name === displayName) { lastVideoId = cam-${seat}; setTimeout(() => startCamera(lastVideoId), 300); } }

function save(seat, name, template) { const life = parseInt(document.getElementById(life-${seat}).value); const updateData = { life };

if (template === "commander") { updateData.status = document.getElementById(stat-${seat}).value; ["p1", "p2", "p3", "p4"].forEach(pid => { const cmd = document.getElementById(cmd-${seat}-${pid}); if (cmd) updateData[cmd_${pid}] = parseInt(cmd.value); }); }

update(ref(db, rooms/${roomId}/players/${name}), updateData); }

onValue(ref(db, rooms/${roomId}), snap => { const data = snap.val(); if (!data) return;

const players = data.players || {}; const template = data.template || "commander"; const playerCount = Object.keys(players).length;

setupLayout(playerCount);

["p1", "p2", "p3", "p4"].forEach(seat => { const p = Object.values(players).find(x => x.seat === seat); if (p) renderSeat(seat, p, template); }); });

