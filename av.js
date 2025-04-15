// ⚒️ Forge Sync AV.JS v2.5 – Robust Peer Init and Retry Logic

const Peer = window.Peer;

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase,
  ref,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let localStream = null;
let currentPlayer = null;
let currentRoom = null;
let peer = null;

function logToScreen(msg) {
  console.log(msg);
  const el = document.createElement("pre");
  el.style.position = "fixed";
  el.style.bottom = "0";
  el.style.left = "0";
  el.style.width = "100vw";
  el.style.maxHeight = "50vh";
  el.style.overflow = "auto";
  el.style.background = "rgba(0,0,0,0.85)";
  el.style.color = "lime";
  el.style.fontSize = "11px";
  el.style.zIndex = "9999";
  el.style.margin = "0";
  el.innerText = msg;
  document.body.appendChild(el);
}

export async function setupAVMesh(players, me, roomId) {
  logToScreen("🛠️ setupAVMesh called for " + me);
  currentPlayer = me;
  currentRoom = roomId;

  // Pre-bind Peer
  peer = new Peer(me);

  peer.on('call', call => {
    logToScreen("📞 Incoming call from: " + call.peer);
    call.answer(localStream);
    call.on('stream', remoteStream => {
      logToScreen("📡 Received remote stream from " + call.peer);
      renderRemoteStream(call.metadata?.seat || call.peer, remoteStream);
    });
  });

  peer.on('open', async id => {
    logToScreen("🔑 Peer ID created: " + id);
    const playerRef = ref(db, `rooms/${roomId}/players/${me}`);
    await update(playerRef, { peerId: id });

    await delay(800); // give DOM time
    players.forEach(player => {
      if (player.name !== me && player.peerId) {
        logToScreen("📤 Calling peer: " + player.peerId);
        const call = peer.call(player.peerId, localStream, { metadata: { seat: player.seat } });
        call.on('stream', remoteStream => {
          logToScreen("🎥 Got remote stream from " + player.name);
          renderRemoteStream(player.seat, remoteStream);
        });
      }
    });
  });
}

async function initCamera(facingMode = "user") {
  try {
    logToScreen("📷 Attempting to access webcam...");
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true
    });
    logToScreen("✅ Local camera stream ready");

    const mySeat = guessMySeat();
    const localVid = document.getElementById(`video-${mySeat}`);
    if (localVid) {
      localVid.srcObject = localStream;
      logToScreen("📺 Attached local cam to video-" + mySeat);
    } else {
      logToScreen("⚠️ video-" + mySeat + " not found for local cam");
    }
  } catch (err) {
    logToScreen("🚫 Webcam error: " + err.message);
  }
}

function renderRemoteStream(seat, stream) {
  const target = document.getElementById(`video-${seat}`);
  if (!target) {
    logToScreen(`⚠️ No video-${seat} found. Retry pending...`);
    retryAttach(seat, stream);
    return;
  }
  target.srcObject = stream;
  logToScreen(`🎥 Stream assigned to video-${seat}`);
}

function retryAttach(seat, stream, attempt = 1) {
  if (attempt > 10) return;
  setTimeout(() => {
    const target = document.getElementById(`video-${seat}`);
    if (target) {
      target.srcObject = stream;
      logToScreen("✅ Retry worked: video-" + seat);
    } else {
      retryAttach(seat, stream, attempt + 1);
    }
  }, 300);
}

function guessMySeat() {
  const boxes = document.querySelectorAll('[id^="seat-"]');
  for (const box of boxes) {
    if (box.innerHTML.includes(currentPlayer)) {
      return box.id.replace("seat-", "");
    }
  }
  return "p1";
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

window.addEventListener("DOMContentLoaded", async () => {
  currentRoom = new URLSearchParams(location.search).get("room");
  currentPlayer = localStorage.getItem("displayName") || "Unknown";
  logToScreen("🌐 DOM Ready – " + currentPlayer + " in room " + currentRoom);
  await initCamera(localStorage.getItem("cameraFacingMode") || "user");
});
