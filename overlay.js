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
const debug = document.getElementById("debugLog");

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");
const displayName = localStorage.getItem("displayName") || "Unknown";

let lastVideoId = null;
let currentStream = null;
let videoDevices = [];
let currentDeviceId = null;

function log(msg) {
  console.log("[Overlay]", msg);
  debug.textContent += "\n" + msg;
}

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
      const el = document.getElementById(videoId);
      if (el) {
        el.srcObject = stream;
        currentDeviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
        log("Camera started for " + videoId);
      }
    })
    .catch(err => log("Camera error: " + err.message));
}

window.flipCamera = function () {
  if (videoDevices.length < 2) return;
  const i = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
  const nextId = videoDevices[(i + 1) % videoDevices.length].deviceId;
  startCamera(lastVideoId, nextId);
  log("Camera flipped.");
};

function renderSeat(seat, player) {
  const div = document.createElement("div");
  div.className = "player-slot";
  div.style.gridArea = seat;

  div.innerHTML = `
    <h2>${player.name}</h2>
    <video id="cam-${seat}" autoplay muted playsinline></video>
    <div class="life-controls">
      <button onclick="adjustLife('${seat}', -1)">-</button>
      <input id="life-${seat}" value="${player.life || 40}" />
      <button onclick="adjustLife('${seat}', 1)">+</button>
    </div>
    <input class="status-bar" id="status-${seat}" value="${player.status || ''}" placeholder="Status..." />
    <button onclick="save('${seat}', '${player.name}')">Save</button>
  `;
  container.appendChild(div);

  if (player.name === displayName) {
    lastVideoId = `cam-${seat}`;
    startCamera(lastVideoId);
  }
}

function adjustLife(seat, delta) {
  const input = document.getElementById(`life-${seat}`);
  input.value = parseInt(input.value || 0) + delta;
}

function save(seat, name) {
  const life = parseInt(document.getElementById(`life-${seat}`).value);
  const status = document.getElementById(`status-${seat}`).value;
  update(ref(db, `rooms/${roomId}/players/${name}`), { life, status });
  log(`Saved ${name}: life=${life}, status=${status}`);
}

onValue(ref(db, `rooms/${roomId}`), snap => {
  const data = snap.val();
  if (!data) return log("No room found.");

  const players = data.players || {};
  container.innerHTML = "";

  const layout = {
    p1: "1 / 1",
    p2: "1 / 2",
    p3: "2 / 1",
    p4: "2 / 2"
  };
  container.style.gridTemplateRows = "1fr 1fr";
  container.style.gridTemplateColumns = "1fr 1fr";

  for (const pname in players) {
    const player = players[pname];
    const seat = player.seat;
    if (!seat) continue;

    renderSeat(seat, player);
  }
});
