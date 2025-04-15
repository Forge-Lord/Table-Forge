import { db, ref, onValue } from './firebasejs.js';

let localStream = null;
let currentPlayer = null;

async function initCamera(facingMode = "user") {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true
    });
  } catch (err) {
    console.error("Camera error:", err);
  }
}

function assignPlayerVideo(box, name) {
  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.srcObject = localStream;
  box.appendChild(video);
  console.log(`Camera bound to: ${name}`);
}

function renderGrid(players) {
  const grid = document.getElementById("overlayGrid");
  grid.innerHTML = "";

  const count = Object.keys(players).length;
  grid.style.gridTemplateColumns = count > 2 ? "1fr 1fr" : "1fr";
  grid.style.gridTemplateRows = count > 2 ? "1fr 1fr" : "1fr 1fr";

  for (const pname in players) {
    const player = players[pname];
    const box = document.createElement("div");
    box.className = "player-box";

    const corner = player.seat === "p1" ? "top-left" :
                   player.seat === "p2" ? "top-right" :
                   player.seat === "p3" ? "bottom-left" : "bottom-right";

    const ui = document.createElement("div");
    ui.className = `player-ui ${corner}`;
    ui.innerHTML = `
      <strong>${player.name}</strong>
      <div>
        <button onclick="adjustLife('${pname}', -1)">-</button>
        <input type="number" id="life-${pname}" value="${player.life}" />
        <button onclick="adjustLife('${pname}', 1)">+</button>
      </div>
      <input id="status-${pname}" value="${player.status}" placeholder="Status..."/>
      <button onclick="saveStatus('${pname}')">Save</button>
      ${pname === currentPlayer ? `
        <button onclick="toggleMute()">Mute</button>
        <button onclick="toggleCamera()">Toggle Cam</button>
      ` : ''}
    `;
    box.appendChild(ui);

    if (pname === currentPlayer && localStream) {
      assignPlayerVideo(box, pname);
    }

    grid.appendChild(box);
  }
}

window.adjustLife = (name, delta) => {
  const input = document.getElementById(`life-${name}`);
  if (input) input.value = parseInt(input.value) + delta;
};

window.saveStatus = (name) => {
  const input = document.getElementById(`status-${name}`);
  const lifeInput = document.getElementById(`life-${name}`);
  const playerRef = ref(db, `rooms/${getRoomId()}/players/${name}`);
  update(playerRef, {
    status: input.value,
    life: parseInt(lifeInput.value)
  });
};

window.toggleMute = () => {
  localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
};

window.toggleCamera = () => {
  localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
};

function getRoomId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("room");
}

window.addEventListener("DOMContentLoaded", async () => {
  const name = localStorage.getItem("displayName") || "Unnamed";
  currentPlayer = name;
  const roomId = getRoomId();
  await initCamera(localStorage.getItem("cameraFacingMode") || "user");

  const roomRef = ref(db, `rooms/${roomId}/players`);
  onValue(roomRef, (snap) => {
    const players = snap.val();
    if (players) renderGrid(players);
  });
});
