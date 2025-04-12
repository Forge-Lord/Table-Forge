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

document.body.style.margin = 0;
document.body.style.background = "#000";

const layout = document.createElement("div");
layout.id = "overlayContainer";
layout.style.padding = "16px";
layout.style.color = "white";
document.body.appendChild(layout);

let currentStream = null;
let lastVideoId = null;
let currentDeviceId = null;
let videoDevices = [];

async function flipCamera() {
  if (videoDevices.length < 2) return;
  const i = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
  const nextId = videoDevices[(i + 1) % videoDevices.length].deviceId;
  startCamera(lastVideoId, nextId);
}

async function startCamera(videoId, deviceId = null) {
  const constraints = deviceId
    ? { video: { deviceId: { exact: deviceId } }, audio: false }
    : { video: true, audio: false };

  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    const el = document.getElementById(videoId);
    if (el) el.srcObject = stream;
    currentDeviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
  } catch (err) {
    console.error("Camera error", err);
  }
}

navigator.mediaDevices.enumerateDevices().then(devices => {
  videoDevices = devices.filter(d => d.kind === "videoinput");
});

const roomRef = ref(db, `rooms/${roomId}`);
onValue(roomRef, snap => {
  const data = snap.val();
  if (!data) return;

  const template = data.template || "commander";
  const players = data.players || {};
  layout.innerHTML = "";

  for (const seat of ["p1", "p2", "p3", "p4"]) {
    const player = Object.values(players).find(p => p.seat === seat);
    if (!player) continue;

    const div = document.createElement("div");
    div.style.border = "1px solid #444";
    div.style.padding = "10px";
    div.style.marginBottom = "16px";
    div.innerHTML = `
      <h3>${player.name}</h3>
      <video id="cam-${seat}" autoplay muted playsinline width="240" height="180" style="background:#000; margin-bottom:10px;"></video>
      <div>Life: <input id="life-${seat}" value="${player.life || 40}" /></div>
    `;

    if (template === "commander") {
      div.innerHTML += `
        <div>Status: <input id="stat-${seat}" value="${player.status || ""}" /></div>
        <div>CMD:
          ${["p1", "p2", "p3", "p4"].filter(pid => pid !== seat).map(pid => `
            ${pid.toUpperCase()}: <input id="cmd-${seat}-${pid}" value="${player["cmd_" + pid] || 0}" style="width:40px;" />
          `).join(" ")}
        </div>
      `;
    }

    div.innerHTML += `<button onclick="save('${seat}', '${player.name}', '${template}')">Save</button>`;
    layout.appendChild(div);

    if (player.name === displayName) {
      lastVideoId = `cam-${seat}`;
      startCamera(lastVideoId);
    }
  }
});

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
}
