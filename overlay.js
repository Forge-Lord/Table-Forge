import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { setupAVMesh } from "./av.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const roomId = new URLSearchParams(location.search).get("room");
const displayName = localStorage.getItem("displayName") || "Unknown";

const layout = document.getElementById("overlayGrid");
const seatMap = { p1: "top-left", p2: "top-right", p3: "bottom-left", p4: "bottom-right" };

let localStream = null; // Make sure this is set by setupAVMesh

onValue(ref(db, `rooms/${roomId}`), snap => {
  const data = snap.val();
  if (!data) return;

  layout.innerHTML = "";
  const players = data.players || {};
  const template = data.template || "commander";
  const playerCount = Object.keys(players).length;

  layout.style.gridTemplate = playerCount === 2 ? "1fr / 1fr" : "1fr 1fr / 1fr 1fr";

  Object.values(players).forEach(player => {
    const seat = player.seat;
    const box = document.createElement("div");
    box.className = "player-box";
    box.id = `seat-${seat}`;

    const vid = document.createElement("video");
    vid.id = `video-${seat}`;
    vid.autoplay = true;
    vid.playsInline = true;
    box.appendChild(vid);

    const ui = document.createElement("div");
    ui.className = `player-ui ${seatMap[seat]}`;
    ui.innerHTML = `
      <strong>${player.name}</strong>
      <div>
        <button onclick="adjustLife('${seat}', -1)">-</button>
        <input id="life-${seat}" value="${player.life}" />
        <button onclick="adjustLife('${seat}', 1)">+</button>
      </div>
      <input id="stat-${seat}" value="${player.status || ''}" placeholder="Status..." />
      ${player.name === displayName ? `
        <button onclick="toggleMic()">Mute</button>
        <button onclick="toggleCam()">Toggle Cam</button>
      ` : ""}
      <button onclick="save('${seat}', '${player.name}', '${template}')">Save</button>
    `;
    box.appendChild(ui);
    layout.appendChild(box);
  });

  setupAVMesh(Object.values(players), displayName, roomId).then(stream => {
    localStream = stream; // 💡 Assign for use in mic/cam toggle
  });
});

window.adjustLife = (seat, delta) => {
  const el = document.getElementById(`life-${seat}`);
  el.value = parseInt(el.value) + delta;
};

window.save = (seat, name, template) => {
  const life = parseInt(document.getElementById(`life-${seat}`).value);
  const status = document.getElementById(`stat-${seat}`).value;
  update(ref(db, `rooms/${roomId}/players/${name}`), { life, status });
};

window.toggleCam = () => {
  const videoTrack = localStream?.getVideoTracks?.()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
  }
};

window.toggleMic = () => {
  const audioTrack = localStream?.getAudioTracks?.()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
  }
};
