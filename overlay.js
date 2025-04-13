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

const layout = document.getElementById("overlayContainer");
layout.innerHTML = "";
layout.style.gridTemplate = "1fr 1fr / 1fr 1fr"; // temporary 2x2 grid

let currentStream = null;
let lastVideoId = null;
let currentDeviceId = null;

function log(msg) {
  console.log("[OVERLAY]", msg);
  const out = document.getElementById("debugBox");
  if (out) out.innerText += `\n${msg}`;
}

function startCamera(videoId) {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      currentStream = stream;
      const el = document.getElementById(videoId);
      if (el) el.srcObject = stream;
      currentDeviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
      log("Camera started for " + videoId);
    })
    .catch(err => {
      log("Camera error: " + err.message);
    });
}

function renderPlayer(seat, player, template) {
  const box = document.createElement("div");
  box.className = "player-box";
  box.style.border = "2px solid #555";
  box.style.padding = "8px";
  box.style.background = "#111";

  box.innerHTML = `
    <h3>${player.name}</h3>
    <video id="cam-${seat}" autoplay muted playsinline style="width:100%; background:#000; height:180px; margin-bottom:8px;"></video>
    <div>Life: <input id="life-${seat}" value="${player.life || 40}" /></div>
  `;

  if (template === "commander") {
    const others = ["p1", "p2", "p3", "p4"].filter(x => x !== seat);
    const cmdInputs = others.map(pid => `
      ${pid.toUpperCase()}: <input id="cmd-${seat}-${pid}" value="${player[`cmd_${pid}`] || 0}" style="width:40px;" />
    `).join(" ");
    box.innerHTML += `
      <div>Status: <input id="stat-${seat}" value="${player.status || ""}" /></div>
      <div>CMD:<br/>${cmdInputs}</div>
    `;
  }

  box.innerHTML += `<button onclick="save('${seat}', '${player.name}', '${template}')">Save</button>`;
  layout.appendChild(box);

  if (player.name === displayName) {
    lastVideoId = `cam-${seat}`;
    log("Match found for this player! Seat: " + seat);
    startCamera(lastVideoId);
  }
}

function save(seat, name, template) {
  const life = parseInt(document.getElementById(`life-${seat}`).value);
  const updateData = { life };

  if (template === "commander") {
    updateData.status = document.getElementById(`stat-${seat}`).value;
    ["p1", "p2", "p3", "p4"].forEach(pid => {
      const cmd = document.getElementById(`cmd-${seat}-${pid}`);
      if (cmd) updateData[`cmd_${pid}`] = parseInt(cmd.value);
    });
  }

  update(ref(db, `rooms/${roomId}/players/${name}`), updateData);
  log(`Saved data for ${name}`);
}

const debugOut = document.createElement("pre");
debugOut.id = "debugBox";
debugOut.style.position = "absolute";
debugOut.style.bottom = "10px";
debugOut.style.left = "10px";
debugOut.style.fontSize = "12px";
debugOut.style.color = "lime";
debugOut.style.background = "rgba(0,0,0,0.5)";
debugOut.style.padding = "6px";
debugOut.style.maxHeight = "150px";
debugOut.style.overflowY = "auto";
document.body.appendChild(debugOut);

onValue(ref(db, `rooms/${roomId}`), snap => {
  const data = snap.val();
  if (!data) return log("No data for room");

  const template = data.template || "commander";
  const players = data.players || {};

  layout.innerHTML = "";
  for (const pname in players) {
    const player = players[pname];
    const seat = player.seat || "p1";
    renderPlayer(seat, player, template);
  }

  if (!Object.keys(players).includes(displayName)) {
    log("You're not in the room player list!");
  }
});
