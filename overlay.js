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

const layout = document.createElement("div");
layout.id = "overlayContainer";
layout.style.display = "grid";
layout.style.width = "100vw";
layout.style.height = "100vh";
layout.style.gap = "0px";
layout.style.padding = "0";
layout.style.margin = "0";
layout.style.boxSizing = "border-box";
document.body.style.margin = "0";
document.body.style.background = "#000";
document.body.appendChild(layout);

let currentStream = null;
let lastVideoId = null;
let currentDeviceId = null;
let videoDevices = [];

async function startCamera(videoId, deviceId = null) {
  const constraints = deviceId
    ? { video: { deviceId: { exact: deviceId } }, audio: false }
    : { video: true, audio: false };

  if (currentStream) currentStream.getTracks().forEach((track) => track.stop());

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    const el = document.getElementById(videoId);
    if (el) el.srcObject = stream;
    currentDeviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
    console.log("Camera started for", videoId);
  } catch (err) {
    console.error("Camera error", err);
  }
}

window.flipCamera = function () {
  if (videoDevices.length < 2) return;
  const i = videoDevices.findIndex((d) => d.deviceId === currentDeviceId);
  const nextId = videoDevices[(i + 1) % videoDevices.length].deviceId;
  startCamera(lastVideoId, nextId);
};

navigator.mediaDevices.enumerateDevices().then((devices) => {
  videoDevices = devices.filter((d) => d.kind === "videoinput");
});

const roomRef = ref(db, `rooms/${roomId}`);
onValue(roomRef, (snap) => {
  const data = snap.val();
  if (!data) return;

  const players = data.players || {};
  const seatOrder = ["p1", "p2", "p3", "p4"];
  const seatsUsed = seatOrder.filter((s) =>
    Object.values(players).some((p) => p.seat === s)
  );
  const template = data.template || "commander";
  const count = parseInt(data.playerCount) || seatsUsed.length;

  const layoutStyles = {
    2: "1fr / 1fr",
    3: "1fr 1fr / 1fr 1fr",
    4: "1fr 1fr / 1fr 1fr"
  };
  layout.style.gridTemplate = layoutStyles[count] || layoutStyles[4];
  layout.innerHTML = "";

  for (const seat of seatOrder) {
    const player = Object.values(players).find((p) => p.seat === seat);
    if (!player) continue;

    const div = document.createElement("div");
    div.style.position = "relative";
    div.style.background = "#111";
    div.style.color = "white";
    div.style.padding = "8px";

    const nameTag = document.createElement("div");
    nameTag.textContent = player.name;
    nameTag.style.position = "absolute";
    nameTag.style.top = "8px";
    nameTag.style.left = "8px";
    nameTag.style.fontWeight = "bold";
    nameTag.style.fontSize = "18px";
    nameTag.style.color = "#00ffff";
    div.appendChild(nameTag);

    const video = document.createElement("video");
    video.id = `cam-${seat}`;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.width = "100%";
    video.style.height = "auto";
    video.style.maxHeight = "60vh";
    div.appendChild(video);

    const lifeRow = document.createElement("div");
    lifeRow.style.marginTop = "8px";
    lifeRow.innerHTML = `
      <button onclick="adjust('${seat}', '${player.name}', -1)">-</button>
      <input id="life-${seat}" value="${player.life}" style="width:50px; text-align:center;" />
      <button onclick="adjust('${seat}', '${player.name}', 1)">+</button>
    `;
    div.appendChild(lifeRow);

    const stat = document.createElement("input");
    stat.placeholder = "Status...";
    stat.id = `stat-${seat}`;
    stat.value = player.status || "";
    stat.style.marginTop = "6px";
    div.appendChild(stat);

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.onclick = () => save(seat, player.name, template);
    div.appendChild(saveBtn);

    layout.appendChild(div);

    if (player.name === displayName) {
      lastVideoId = `cam-${seat}`;
      startCamera(lastVideoId);
    }
  }
});

function adjust(seat, name, delta) {
  const input = document.getElementById(`life-${seat}`);
  input.value = parseInt(input.value) + delta;
  save(seat, name);
}

function save(seat, name, template) {
  const life = parseInt(document.getElementById(`life-${seat}`).value);
  const status = document.getElementById(`stat-${seat}`).value;
  update(ref(db, `rooms/${roomId}/players/${name}`), {
    life,
    status
  });
}
