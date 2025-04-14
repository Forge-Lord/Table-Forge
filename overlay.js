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

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");
const displayName = localStorage.getItem("displayName") || "Unknown";

const layout = document.getElementById("overlayContainer");
let currentStream = null;
let lastVideoId = null;
let currentDeviceId = null;
let videoDevices = [];

navigator.mediaDevices.enumerateDevices().then(devices => {
  videoDevices = devices.filter(d => d.kind === "videoinput");
});

function flipCamera() {
  if (videoDevices.length < 2) return;
  const i = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
  const nextId = videoDevices[(i + 1) % videoDevices.length].deviceId;
  startCamera(lastVideoId, nextId);
}

async function startCamera(videoId, deviceId = null) {
  const constraints = deviceId
    ? { video: { deviceId: { exact: deviceId } }, audio: false }
    : { video: true, audio: false };

  if (currentStream) currentStream.getTracks().forEach(t => t.stop());

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    const el = document.getElementById(videoId);
    if (el) el.srcObject = stream;
    currentDeviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
    console.log("Camera started for", videoId);
  } catch (e) {
    console.error("Camera error", e);
  }
}

function adjustLife(seat, delta) {
  const el = document.getElementById(`life-${seat}`);
  el.value = parseInt(el.value) + delta;
}

function save(seat, name) {
  const life = parseInt(document.getElementById(`life-${seat}`).value);
  const status = document.getElementById(`stat-${seat}`).value;
  update(ref(db, `rooms/${roomId}/players/${name}`), { life, status });
}

onValue(ref(db, `rooms/${roomId}`), snap => {
  const data = snap.val();
  if (!data) return;

  layout.innerHTML = "";
  const playerCount = data.playerCount || 4;
  const template = data.template || "commander";
  const players = data.players || {};
  const seatOrder = ["p1", "p2", "p3", "p4"];
  const seatMap = {
    p1: "top-left", p2: "top-right",
    p3: "bottom-left", p4: "bottom-right"
  };

  layout.style.gridTemplateColumns = playerCount === 2 ? "1fr 1fr" : "1fr 1fr";
  layout.style.gridTemplateRows = playerCount === 2 ? "1fr" : "1fr 1fr";

  for (const seat of seatOrder) {
    const player = Object.values(players).find(p => p.seat === seat);
    if (!player) continue;

    const vid = document.createElement("video");
    vid.id = `cam-${seat}`;
    vid.autoplay = true;
    vid.muted = true;
    vid.playsInline = true;
    layout.appendChild(vid);

    if (player.name === displayName) {
      lastVideoId = `cam-${seat}`;
      startCamera(lastVideoId);
    }

    const corner = seatMap[seat];
    const ui = document.createElement("div");
    ui.className = `player-corner ${corner}`;
    ui.innerHTML = `
      <strong>${player.name}</strong>
      <div>
        <button onclick="adjustLife('${seat}', -1)">-</button>
        <input id="life-${seat}" value="${player.life}" />
        <button onclick="adjustLife('${seat}', 1)">+</button>
      </div>
      <input id="stat-${seat}" placeholder="Status..." value="${player.status || ''}" />
      <button onclick="save('${seat}', '${player.name}')">Save</button>
    `;
    layout.appendChild(ui);
  }
});

window.flipCamera = flipCamera;
window.adjustLife = adjustLife;
window.save = save;
