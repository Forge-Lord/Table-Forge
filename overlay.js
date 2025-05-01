// overlay.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase, ref, onValue, update
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com",
  projectId: "tableforge-app",
  appId: "1:708497363618:web:39da060b48681944923dfb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const params = new URLSearchParams(window.location.search);
const roomCode = params.get("room");
const seat = localStorage.getItem("mySeat") || "P1";

if (!roomCode) {
  alert("Missing room code in URL.");
  throw new Error("Room not specified");
}

const playerMap = {
  P1: "p1",
  P2: "p2",
  P3: "p3",
  P4: "p4"
};

async function loadCamera(targetDiv) {
  const camId = localStorage.getItem("selectedCamera");
  const micId = localStorage.getItem("selectedMic");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: camId ? { deviceId: { exact: camId } } : true,
    audio: micId ? { deviceId: { exact: micId } } : false
  });
  const video = targetDiv.querySelector("video");
  video.srcObject = stream;
  video.play();
}

// Attach camera and bind input events for YOUR seat
function setupLocalSeat(seatId) {
  const divId = playerMap[seatId];
  const container = document.getElementById(divId);
  loadCamera(container);

  ["name", "life", "status"].forEach((field) => {
    const el = document.getElementById(`${field}${divId.slice(1)}`);
    el.addEventListener("input", () => {
      const updates = {};
      updates[`rooms/${roomCode}/players/${seatId}/${field}`] = el.value;
      update(ref(db), updates);
    });
  });
}

// Watch all player slots
function bindAllSeats() {
  const roomRef = ref(db, `rooms/${roomCode}/players`);
  onValue(roomRef, (snapshot) => {
    const data = snapshot.val() || {};
    Object.keys(playerMap).forEach((seatId) => {
      const divId = playerMap[seatId].slice(1);
      const p = data[seatId] || {};
      document.getElementById(`name${divId}`).value = p.name || "";
      document.getElementById(`life${divId}`).value = p.life || "40";
      document.getElementById(`status${divId}`).value = p.status || "";
    });
  });
}

setupLocalSeat(seat);
bindAllSeats();
