import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");
const displayName = localStorage.getItem("displayName") || "Unknown";

const debugDiv = document.createElement("pre");
debugDiv.style.position = "absolute";
debugDiv.style.top = "10px";
debugDiv.style.left = "10px";
debugDiv.style.background = "rgba(0,0,0,0.7)";
debugDiv.style.color = "#0f0";
debugDiv.style.padding = "8px";
debugDiv.style.fontSize = "12px";
debugDiv.style.zIndex = "999";
document.body.appendChild(debugDiv);

function log(msg) {
  console.log("[OVERLAY]", msg);
  debugDiv.textContent += "\n" + msg;
}

log(`Overlay loaded\nRoom: ${roomId}\nName: ${displayName}`);

const layout = document.getElementById("overlayContainer");
if (!layout) {
  const fallback = document.createElement("div");
  fallback.id = "overlayContainer";
  fallback.style.display = "grid";
  fallback.style.gridTemplate = "1fr 1fr / 1fr 1fr";
  fallback.style.height = "100vh";
  fallback.style.gap = "6px";
  fallback.style.padding = "10px";
  document.body.appendChild(fallback);
  log("Overlay container was missing — created fallback.");
}

let currentStream = null;
let lastVideoId = null;

function startCamera(videoId) {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      currentStream = stream;
      const el = document.getElementById(videoId);
      if (el) {
        el.srcObject = stream;
        log("Camera started for " + videoId);
      } else {
        log("Camera element not found: " + videoId);
      }
    })
    .catch(err => {
      log("Camera error: " + err.message);
    });
}

function renderPlayer(seat, player, template) {
  const div = document.createElement("div");
  div.className = "player-box";
  div.style.border = "2px solid #444";
  div.style.padding = "8px";
  div.style.background = "#111";
  div.innerHTML = `
    <h2>${player.name}</h2>
    <video id="cam-${seat}" autoplay muted playsinline style="width:100%; height:180px; background:#000; margin-bottom:10px;"></video>
    <div>
      <button onclick="adjustLife('${seat}', -1)">-</button>
      <input id="life-${seat}" value="${player.life || 40}" />
      <button onclick="adjustLife('${seat}', 1)">+</button>
    </div>
    <input id="status-${seat}" value="${player.status || ''}" placeholder="Status..." />
    <button onclick="save('${seat}', '${player.name}', '${template}')">Save</button>
  `;
  layout.appendChild(div);

  if (player.name === displayName) {
    lastVideoId = `cam-${seat}`;
    log(`Found self at seat ${seat}`);
    startCamera(lastVideoId);
  }
}

function save(seat, name, template) {
  const life = parseInt(document.getElementById(`life-${seat}`).value);
  const status = document.getElementById(`status-${seat}`).value;
  const updateData = { life, status };
  update(ref(db, `rooms/${roomId}/players/${name}`), updateData);
  log(`Saved data for ${name}`);
}

function adjustLife(seat, delta) {
  const el = document.getElementById(`life-${seat}`);
  if (el) el.value = parseInt(el.value || 0) + delta;
}

onValue(ref(db, `rooms/${roomId}`), snap => {
  const data = snap.val();
  if (!data) return log("No room data found.");

  const players = data.players || {};
  const playerKeys = Object.keys(players);
  layout.innerHTML = "";

  for (const pname of playerKeys) {
    const player = players[pname];
    const seat = player.seat;
    if (!seat) {
      log(`Player ${pname} has no seat assigned`);
      continue;
    }
    renderPlayer(seat, player, data.template);
  }

  if (!playerKeys.includes(displayName)) {
    log("You are not a registered player in this room.");
  }
});
