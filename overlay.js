// overlay.js — quadrant grid layout with floating player info
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
const grid = document.getElementById("overlayGrid");

let currentStream = null;
let currentDeviceId = null;
let videoDevices = [];

function createPlayerBox(seat, player, template) {
  const box = document.createElement("div");
  box.className = "playerBox";

  const vid = document.createElement("video");
  vid.id = `cam-${seat}`;
  vid.autoplay = true;
  vid.muted = true;
  vid.playsInline = true;
  box.appendChild(vid);

  const nameTag = document.createElement("div");
  nameTag.className = "nameTag";
  nameTag.textContent = player.name;
  box.appendChild(nameTag);

  const lifeRow = document.createElement("div");
  lifeRow.className = "lifeRow";

  const minusBtn = document.createElement("button");
  minusBtn.textContent = "-";
  const plusBtn = document.createElement("button");
  plusBtn.textContent = "+";

  const lifeInput = document.createElement("input");
  lifeInput.type = "number";
  lifeInput.value = player.life;

  minusBtn.onclick = () => lifeInput.value = parseInt(lifeInput.value) - 1;
  plusBtn.onclick = () => lifeInput.value = parseInt(lifeInput.value) + 1;

  lifeRow.append(minusBtn, lifeInput, plusBtn);
  box.appendChild(lifeRow);

  const statusRow = document.createElement("div");
  statusRow.className = "statusBar";
  const statusInput = document.createElement("input");
  statusInput.type = "text";
  statusInput.placeholder = "Status...";
  statusInput.value = player.status || "";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";

  saveBtn.onclick = () => {
    const updateData = {
      life: parseInt(lifeInput.value),
      status: statusInput.value
    };
    update(ref(db, `rooms/${roomId}/players/${player.name}`), updateData);
  };

  statusRow.append(statusInput, saveBtn);
  box.appendChild(statusRow);

  if (player.name === displayName) {
    startCamera(`cam-${seat}`);
  }

  return box;
}

function startCamera(videoId) {
  const constraints = localStorage.getItem("cameraFacingMode") === "environment"
    ? { video: { facingMode: { exact: "environment" } }, audio: false }
    : { video: { facingMode: "user" }, audio: false };

  if (currentStream) currentStream.getTracks().forEach(track => track.stop());

  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    const el = document.getElementById(videoId);
    if (el) el.srcObject = stream;
    currentStream = stream;
    currentDeviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
  }).catch(console.error);
}

navigator.mediaDevices.enumerateDevices().then(devices => {
  videoDevices = devices.filter(d => d.kind === "videoinput");
});

onValue(ref(db, `rooms/${roomId}`), snap => {
  const data = snap.val();
  if (!data) return;

  const players = data.players || {};
  const seatOrder = ["p1", "p2", "p3", "p4"];
  const playerList = seatOrder.map(seat =>
    Object.values(players).find(p => p.seat === seat)
  ).filter(Boolean);

  grid.innerHTML = "";

  playerList.forEach(p => {
    const box = createPlayerBox(p.seat, p, data.template || "commander");
    grid.appendChild(box);
  });
});

window.flipCamera = function () {
  const current = localStorage.getItem("cameraFacingMode") || "user";
  localStorage.setItem("cameraFacingMode", current === "user" ? "environment" : "user");
  setTimeout(() => {
    const mySeat = document.querySelector("video")?.id?.replace("cam-", "");
    if (mySeat) startCamera(`cam-${mySeat}`);
  }, 300);
};
