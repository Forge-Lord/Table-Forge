// overlay.js with visible debug output import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", projectId: "tableforge-app", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com" }; const app = initializeApp(firebaseConfig); const db = getDatabase(app);

const urlParams = new URLSearchParams(window.location.search); const roomId = urlParams.get("room"); const displayName = localStorage.getItem("displayName") || "Unknown";

const debug = document.createElement("div"); debug.style.position = "absolute"; debug.style.top = "8px"; debug.style.left = "8px"; debug.style.color = "lime"; debug.style.fontSize = "14px"; debug.innerText = Overlay loading...\nRoom: ${roomId}\nPlayer: ${displayName}; document.body.appendChild(debug);

const layout = document.createElement("div"); layout.style.padding = "16px"; layout.style.color = "white"; document.body.appendChild(layout);

let currentStream = null; let lastVideoId = null;

function startCamera(videoId) { navigator.mediaDevices.getUserMedia({ video: true, audio: false }) .then(stream => { currentStream = stream; const el = document.getElementById(videoId); if (el) el.srcObject = stream; debug.innerText += "\nCamera started"; }) .catch(err => { debug.innerText += \nCamera error: ${err.message}; }); }

onValue(ref(db, rooms/${roomId}), snap => { const data = snap.val(); if (!data) { debug.innerText += "\nRoom not found."; return; }

const players = data.players || {}; const player = players[displayName];

if (!player) { debug.innerText += "\nYou are not a player in this room."; return; }

layout.innerHTML = ""; const div = document.createElement("div"); div.innerHTML = <h2>${player.name}</h2> <video id="cam-${player.seat}" autoplay muted playsinline width="100%" style="background:#000; height:180px;"></video> <div>Life: <input id="life-${player.seat}" value="${player.life || 40}" /></div>; layout.appendChild(div); lastVideoId = cam-${player.seat}; startCamera(lastVideoId); });

