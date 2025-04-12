// overlay.js with mobile-safe cam flip import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", projectId: "tableforge-app", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com" }; const app = initializeApp(firebaseConfig); const db = getDatabase(app);

const urlParams = new URLSearchParams(window.location.search); const roomId = urlParams.get("room"); const displayName = localStorage.getItem("displayName") || "Unknown"; document.getElementById("playerName").textContent = You: ${displayName};

let currentStream = null; let lastVideoId = null; let currentDeviceId = null; let videoDevices = [];

async function flipCamera() { if (videoDevices.length < 2) return alert("Only one camera available"); const currentIndex = videoDevices.findIndex(d => d.deviceId === currentDeviceId); const nextIndex = (currentIndex + 1) % videoDevices.length; const nextDeviceId = videoDevices[nextIndex].deviceId; startCamera(lastVideoId, nextDeviceId); }

async function startCamera(videoId, deviceId = null) { const constraints = deviceId ? { video: { deviceId: { exact: deviceId } }, audio: false } : { video: { facingMode: "user" }, audio: false };

if (currentStream) currentStream.getTracks().forEach(track => track.stop());

try { const stream = await navigator.mediaDevices.getUserMedia(constraints); currentStream = stream; const videoEl = document.getElementById(videoId); if (videoEl) videoEl.srcObject = stream; currentDeviceId = stream.getVideoTracks()[0].getSettings().deviceId; } catch (err) { console.error("Camera failed:", err); } }

// Load device list on page load navigator.mediaDevices.enumerateDevices().then(devices => { videoDevices = devices.filter(d => d.kind === "videoinput"); });

const templateRef = ref(db, rooms/${roomId}/template); onValue(templateRef, (snap) => { const template = snap.val() || "commander"; const playerRef = ref(db, rooms/${roomId}/players/${displayName}); onValue(playerRef, (snap) => { const data = snap.val(); if (!data) return; const seat = data.seat || "p1"; renderSeat(seat, data, template); }); });

function renderSeat(seat, player, template) { const seatDiv = document.getElementById(seat); if (!seatDiv) return;

let content = <div style="background:#222; padding:10px; border:2px solid #555; color:white;"> <h3>${player.name}</h3> <video id="cam-${seat}" autoplay muted playsinline width="240" height="180" style="background:#000; margin-bottom:10px;"></video> <p>Life: <input id="life-${seat}" value="${player.life || (template === 'yugioh' ? 8000 : 40)}" /></p>;

if (template === "commander") { const opponents = ["p1", "p2", "p3", "p4"].filter(id => id !== seat); const cmdInputs = opponents.map(pid => <label>${pid.toUpperCase()}: <input id="cmd-${seat}-${pid}" value="${player[cmd_${pid}] || 0}" style="width:40px;" /></label>).join(" "); content += <p>Status: <input id="stat-${seat}" value="${player.status || ''}" /></p>; content += <p>CMD:<br/>${cmdInputs}</p>; }

content += <button onclick="save('${seat}', '${player.name}', '${template}')">Save</button></div>; seatDiv.innerHTML = content;

if (player.name === displayName) { lastVideoId = cam-${seat}; startCamera(lastVideoId); } }

function save(seat, name, template) { const life = parseInt(document.getElementById(life-${seat}).value); const updateData = { life };

if (template === "commander") { updateData.status = document.getElementById(stat-${seat}).value; ["p1", "p2", "p3", "p4"].forEach(pid => { const cmdField = document.getElementById(cmd-${seat}-${pid}); if (cmdField) updateData[cmd_${pid}] = parseInt(cmdField.value); }); }

update(ref(db, rooms/${roomId}/players/${name}), updateData); document.getElementById("clickSound")?.play(); if (name === displayName && lastVideoId) startCamera(lastVideoId); }

