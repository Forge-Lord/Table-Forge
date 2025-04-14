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

const roomId = new URLSearchParams(window.location.search).get("room");
const displayName = localStorage.getItem("displayName") || "Unknown";
const grid = document.getElementById("overlayGrid");

let currentStream = null;
let videoDevices = [];
let currentDeviceId = null;

navigator.mediaDevices.enumerateDevices().then(devices => {
  videoDevices = devices.filter(d => d.kind === "videoinput");
});

function startCamera(videoId) {
  const mode = localStorage.getItem("cameraFacingMode") || "user";
  const constraints = { video: { facingMode: { exact: mode } }, audio: false };

  if (currentStream) currentStream.getTracks().forEach(t => t.stop());

  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    const vid = document.getElementById(videoId);
    if (vid) vid.srcObject = stream;
    currentStream = stream;
    currentDeviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
  }).catch(console.error);
}

window.flipCamera = () => {
  const mode = localStorage.getItem("cameraFacingMode");
  localStorage.setItem("cameraFacingMode", mode === "environment" ? "user" : "environment");
  setTimeout(() => {
    const cam = document.querySelector("video[id^='cam-']");
    if (cam) startCamera(cam.id);
  }, 300);
};

function getHudPosition(seat, playerCount) {
  const positions = {
    p1: playerCount === 2 ? "top:8px;left:8px;" : "top:8px;left:8px;",
    p2: playerCount === 2 ? "bottom:8px;left:8px;" : "top:8px;right:8px;",
    p3: "bottom:8px;left:8px;",
    p4: "bottom:8px;right:8px;"
  };
  return positions[seat] || "top:8px;left:8px;";
}

function createPlayerBox(seat, player, playerCount) {
  const div = document.createElement("div");
  div.className = "playerBox";

  const video = document.createElement("video");
  video.id = `cam-${seat}`;
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  div.appendChild(video);

  const hud = document.createElement("div");
  hud.className = "hud";
  hud.style.cssText = getHudPosition(seat, playerCount);
  hud.style.position = "absolute";

  const row = document.createElement("div");
  row.className = "hud-row";

  const name = document.createElement("div");
  name.textContent = player.name;
  name.style.fontWeight = "bold";

  const life = document.createElement("input");
  life.type = "number";
  life.value = player.life ?? 40;
  life.id = `life-${seat}`;

  const minus = document.createElement("button");
  minus.textContent = "-";
  minus.onclick = () => life.value = parseInt(life.value) - 1;

  const plus = document.createElement("button");
  plus.textContent = "+";
  plus.onclick = () => life.value = parseInt(life.value) + 1;

  row.append(name, minus, life, plus);
  hud.appendChild(row);

  const status = document.createElement("input");
  status.type = "text";
  status.placeholder = "Status";
  status.value = player.status || "";
  status.id = `stat-${seat}`;
  hud.appendChild(status);

  const save = document.createElement("button");
  save.textContent = "Save";
  save.onclick = () => {
    const newLife = parseInt(document.getElementById(`life-${seat}`).value);
    const newStatus = document.getElementById(`stat-${seat}`).value;
    update(ref(db, `rooms/${roomId}/players/${player.name}`), {
      life: newLife,
      status: newStatus
    });
  };
  hud.appendChild(save);

  div.appendChild(hud);

  if (player.name === displayName) {
    startCamera(`cam-${seat}`);
  }

  return div;
}

onValue(ref(db, `rooms/${roomId}`), snap => {
  const data = snap.val();
  if (!data) return;

  const players = Object.values(data.players || {});
  const seats = ["p1", "p2", "p3", "p4"];
  const active = seats.map(seat => players.find(p => p.seat === seat)).filter(Boolean);
  const playerCount = active.length;

  grid.innerHTML = "";
  grid.style.gridTemplate = playerCount === 2 ? "1fr 1fr / 1fr" : "1fr 1fr / 1fr 1fr";

  active.forEach(player => {
    const div = createPlayerBox(player.seat, player, playerCount);
    grid.appendChild(div);
  });
});
