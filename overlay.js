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

const layout = document.getElementById("overlayContainer");
layout.innerHTML = "";

let currentStream = null;
let lastVideoId = null;
let currentDeviceId = null;

function startCamera(videoId) {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      currentStream = stream;
      const el = document.getElementById(videoId);
      if (el) el.srcObject = stream;
      currentDeviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
    })
    .catch(err => {
      console.error("Camera error: " + err.message);
    });
}

function save(seat, name, template) {
  const life = parseInt(document.getElementById(`life-${seat}`).value);
  const status = document.getElementById(`status-${seat}`).value;
  const updateData = { life, status };

  if (template === "commander") {
    ["p1", "p2", "p3", "p4"].forEach(pid => {
      const cmd = document.getElementById(`cmd-${seat}-${pid}`);
      if (cmd) updateData[`cmd_${pid}`] = parseInt(cmd.value);
    });
  }

  update(ref(db, `rooms/${roomId}/players/${name}`), updateData);
}

function adjustLife(seat, change) {
  const input = document.getElementById(`life-${seat}`);
  let val = parseInt(input.value) || 0;
  val += change;
  input.value = val;
}

function renderPlayer(seat, player, template)
