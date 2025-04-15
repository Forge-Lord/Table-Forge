import { db, ref, onValue, update } from './firebasejs.js';

let localStream = null;
let currentPlayer = null;
let currentRoom = null;

function getRoomId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("room");
}

async function initCamera(facingMode = "user") {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true
    });
    return true;
  } catch (err) {
    console.error("Camera access error:", err);
    return false;
  }
}

function assignVideo(box, isSelf) {
  const video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;
  video.muted = isSelf;
  video.srcObject = localStream;
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "cover";
  box.appendChild(video);
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
      <input id="status-${pname}" value="${player.status}" placeholder="Status..." />
      <button onclick="saveStatus('${pname}')">Save</button>
      ${pname === currentPlayer ? `
        <button onclick="toggleMute()">Mute</button>
        <button onclick="toggleCamera()">Toggle Cam</button>
      ` : ''}
    `;
    box.appendChild(ui);

    if (pname === currentPlayer) {
      assignVideo(box, true);
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
  const playerRef = ref(db, `rooms/${currentRoom}/players/${name}`);
  update(playerRef, {
    status: input.value,
    life: parseInt(lifeInput.value)
  });
};

window.toggleMute = () => {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
  }
};

window.toggleCamera = () => {
  if (localStream) {
    localStream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
  }
};

window.addEventListener("DOMContentLoaded", async () => {
  currentRoom = getRoomId();
  currentPlayer = localStorage.getItem("displayName") || "Unknown";

  const cameraReady = await initCamera(localStorage.getItem("cameraFacingMode") || "user");
  if (!cameraReady) return alert("Camera or mic permissions denied.");

  const roomRef = ref(db, `rooms/${currentRoom}/players`);
  onValue(roomRef, (snap) => {
    const data = snap.val();
    if (data) renderGrid(data);
  });
});
