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

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");
const displayName = localStorage.getItem("displayName") || "Unknown";
document.getElementById("playerName").textContent = `You: ${displayName}`;

let currentCamMode = localStorage.getItem("cameraFacingMode") || "user"; // user or environment
let currentStream = null;

function flipCamera() {
  currentCamMode = currentCamMode === "user" ? "environment" : "user";
  localStorage.setItem("cameraFacingMode", currentCamMode);
  startCamera(lastVideoId); // restart with new mode
}

let lastVideoId = null;

const playerRef = ref(db, `rooms/${roomId}/players/${displayName}`);
onValue(playerRef, (snap) => {
  const data = snap.val();
  if (!data) return;
  const seat = data.seat || "p1";
  renderSeat(seat, data);
});

function renderSeat(seat, player) {
  const seatDiv = document.getElementById(seat);
  if (!seatDiv) return;

  seatDiv.innerHTML = `
    <div style="background:#222; padding:10px; border:2px solid #555; color:white;">
      <h3>${player.name}</h3>
      <video id="cam-${seat}" autoplay muted playsinline width="240" height="180" style="background:#000; margin-bottom:10px;"></video>
      <p>Life: <input id="life-${seat}" value="${player.life || 40}" /></p>
      <p>CMD: <input id="cmd-${seat}" value="${player.commander || 0}" /></p>
      <p>Status: <input id="stat-${seat}" value="${player.status || ""}" /></p>
      <button onclick="save('${seat}', '${player.name}')">Save</button>
    </div>
  `;

  if (player.name === displayName) {
    lastVideoId = `cam-${seat}`;
    startCamera(lastVideoId);
  }
}

function save(seat, name) {
  const life = parseInt(document.getElementById(`life-${seat}`).value);
  const cmd = parseInt(document.getElementById(`cmd-${seat}`).value);
  const stat = document.getElementById(`stat-${seat}`).value;
  update(ref(db, `rooms/${roomId}/players/${name}`), {
    life, commander: cmd, status: stat
  });
  document.getElementById("clickSound").play();

  if (name === displayName && lastVideoId) {
    startCamera(lastVideoId);
  }
}

function startCamera(videoId) {
  const facingMode = currentCamMode || "user";
  const constraints = { video: { facingMode }, audio: false };

  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      currentStream = stream;
      const videoEl = document.getElementById(videoId);
      if (videoEl) videoEl.srcObject = stream;
    })
    .catch((err) => {
      console.error("Camera failed:", err);
    });
}
