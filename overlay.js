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

const container = document.getElementById("overlayContainer");
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");
const displayName = localStorage.getItem("displayName") || "Unknown";

let currentStream = null;
let lastVideoId = null;
let videoDevices = [];
let currentDeviceId = null;

navigator.mediaDevices.enumerateDevices().then(devices => {
  videoDevices = devices.filter(d => d.kind === "videoinput");
});

function startCamera(videoId, deviceId = null) {
  const constraints = deviceId
    ? { video: { deviceId: { exact: deviceId } }, audio: false }
    : { video: true, audio: false };

  if (currentStream) currentStream.getTracks().forEach(track => track.stop());

  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      currentStream = stream;
      const video = document.getElementById(videoId);
      if (video) {
        video.srcObject = stream;
        currentDeviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
      }
    })
    .catch(err => console.error("Camera error:", err));
}

window.flipCamera = function () {
  if (videoDevices.length < 2) return;
  const i = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
  const nextId = videoDevices[(i + 1) % videoDevices.length].deviceId;
  startCamera(lastVideoId, nextId);
};

function getGridPosition(seat) {
  const map = {
    p1: "1 / 1",
    p2: "1 / 2",
    p3: "2 / 1",
    p4: "2 / 2"
  };
  return map[seat] || "auto";
}

function renderSeat(seat, player) {
  const slot = document.createElement("div");
  slot.className = "player-slot";
  slot.style.gridArea = getGridPosition(seat);

  const video = document.createElement("video");
  video.id = `cam-${seat}`;
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;

  const hud = document.createElement("div");
  hud.className = "hud";

  // Name + life row
  const row = document.createElement("div");
  row.className = "hud-row";

  const name = document.createElement("div");
  name.className = "player-name";
  name.textContent = player.name;

  const life = document.createElement("input");
  life.type = "number";
  life.className = "life-input";
  life.id = `life-${seat}`;
  life.value = player.life ?? 40;

  row.appendChild(name);
  row.appendChild(life);

  const status = document.createElement("input");
  status.type = "text";
  status.id = `status-${seat}`;
  status.className = "status-input";
  status.value = player.status ?? "";

  const save = document.createElement("button");
  save.textContent = "Save";
  save.onclick = () => {
    const newLife = parseInt(document.getElementById(`life-${seat}`).value);
    const newStatus = document.getElementById(`status-${seat}`).value;
    update(ref(db, `rooms/${roomId}/players/${player.name}`), {
      life: newLife,
      status: newStatus
    });
  };

  hud.appendChild(row);
  hud.appendChild(status);
  hud.appendChild(save);

  slot.appendChild(video);
  slot.appendChild(hud);
  container.appendChild(slot);

  if (player.name === displayName) {
    lastVideoId = `cam-${seat}`;
    startCamera(lastVideoId);
  }
}

onValue(ref(db, `rooms/${roomId}`), snap => {
  const data = snap.val();
  if (!data) return;

  const players = data.players || {};
  container.innerHTML = "";

  for (const pname in players) {
    const player = players[pname];
    const seat = player.seat;
    if (!seat) continue;
    renderSeat(seat, player);
  }
});
