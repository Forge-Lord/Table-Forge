// overlay.js for Table Forge with video, layout, and data sync

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

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

let currentStream = null;
let currentDeviceId = null;
let videoDevices = [];
let lastVideoId = null;

document.body.style.margin = "0";
document.body.style.background = "#000";
const layout = document.createElement("div");
layout.id = "overlayContainer";
layout.style.display = "grid";
layout.style.height = "100vh";
document.body.appendChild(layout);

navigator.mediaDevices.enumerateDevices().then(devices => {
  videoDevices = devices.filter(d => d.kind === "videoinput");
});

async function startCamera(videoId, deviceId = null) {
  const constraints = deviceId
    ? { video: { deviceId: { exact: deviceId } }, audio: false }
    : { video: true, audio: false };

  if (currentStream) currentStream.getTracks().forEach(track => track.stop());

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

window.flipCamera = function () {
  if (videoDevices.length < 2) return;
  const i = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
  const nextId = videoDevices[(i + 1) % videoDevices.length].deviceId;
  startCamera(lastVideoId, nextId);
};

const roomRef = ref(db, `rooms/${roomId}`);
onValue(roomRef, snap => {
  const data = snap.val();
  if (!data) return;

  const template = data.template || "commander";
  const playerCount = parseInt(data.playerCount) || 4;
  const players = data.players || {};
  const seatOrder = ["p1", "p2", "p3", "p4"];
  const seatsUsed = seatOrder.filter(seat => Object.values(players).some(p => p.seat === seat));

  const gridLayout = {
    2: "1fr / 1fr",
    3: "1fr 1fr / 1fr 1fr",
    4: "1fr 1fr / 1fr 1fr"
  };

  layout.style.gridTemplate = gridLayout[playerCount] || gridLayout[4];
  layout.innerHTML = "";

  for (const seat of seatOrder) {
    const player = Object.values(players).find(p => p.seat === seat);
    if (!player) continue;

    const slot = document.createElement("div");
    slot.id = seat;
    slot.style.border = "2px solid #333";
    slot.style.padding = "1em";
    slot.style.color = "white";
    slot.innerHTML = `
      <h2>${player.name}</h2>
      <video id="cam-${seat}" autoplay muted playsinline width="100%" style="background:#000; height:180px;"></video>
      <div>Life: <input id="life-${seat}" value="${player.life}" /></div>
    `;

    if (template === "commander") {
      const cmd = seatOrder.filter(x => x !== seat).map(pid => {
        return `<label>${pid.toUpperCase()}: <input id="cmd-${seat}-${pid}" value="${player[`cmd_${pid}`] || 0}" style="width:40px;" /></label>`;
      }).join(" ");
      slot.innerHTML += `
        <div>Status: <input id="stat-${seat}" value="${player.status || ''}" /></div>
        <div>CMD:<br/>${cmd}</div>
      `;
    }

    slot.innerHTML += `<button onclick="save('${seat}', '${player.name}', '${template}')">Save</button>`;
    layout.appendChild(slot);

    if (player.name === displayName) {
      lastVideoId = `cam-${seat}`;
      startCamera(lastVideoId);
    }
  }
});

window.save = function (seat, name, template) {
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
};
