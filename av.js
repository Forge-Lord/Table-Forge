// ✅ FINAL av.js – with visual fallback logs on-screen for mobile debugging

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
  el.style.background = "rgba(0,0,0,0.8)";
  el.style.color = "lime";
  el.style.fontSize = "10px";
  el.style.zIndex = "9999";
  el.innerText = msg;
  document.body.appendChild(el);
}

export async function setupAVMesh(players, me, roomId) {
  logToScreen("🚀 setupAVMesh called for " + me);

  currentPlayer = me;
  currentRoom = roomId;

  peer = new Peer(me);

  await new Promise(resolve => {
    peer.on('open', id => {
      logToScreen("🔑 Peer ID created: " + id);
      const playerRef = ref(db, `rooms/${roomId}/players/${me}`);
      update(playerRef, { peerId: id });
      resolve();
    });
  });

  peer.on('call', call => {
    logToScreen("📞 Incoming call from: " + call.peer);
    call.answer(localStream);
    call.on('stream', remoteStream => {
      logToScreen("📡 Receiving remote stream from " + call.peer);
      renderRemoteStream(call.metadata?.seat || call.peer, remoteStream);
    });
  });

  players.forEach(player => {
    if (player.name !== me && player.peerId) {
      logToScreen("📤 Calling peer: " + player.peerId);
      const call = peer.call(player.peerId, localStream, { metadata: { seat: player.seat } });
      call.on('stream', remoteStream => {
        logToScreen("🎥 Stream from " + player.name + " at seat " + player.seat);
        renderRemoteStream(player.seat, remoteStream);
      });
    }
  });
}

async function initCamera(facingMode = "user") {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true
    });
    logToScreen("📷 Camera stream acquired");

    const mySeat = (() => {
      const boxes = document.querySelectorAll('[id^="seat-"]');
      for (const box of boxes) {
        if (box.innerHTML.includes(currentPlayer)) {
          return box.id.replace("seat-", "");
        }
      }
      return "p1";
    })();

    const localVid = document.getElementById(`video-${mySeat}`);
    if (localVid) {
      logToScreen("🎥 Showing local cam in " + mySeat);
      localVid.srcObject = localStream;
    } else {
      logToScreen("⚠️ Could not find local video element for: " + mySeat);
    }
  } catch (err) {
    logToScreen("🚫 Camera access error: " + err);
  }
}

function renderRemoteStream(seat, stream) {
  const vid = document.getElementById(`video-${seat}`);
  if (!vid) {
    logToScreen(`⚠️ No video element found for seat ${seat}`);
    return;
  }
  logToScreen(`🎥 Attaching stream to video-${seat}`);
  vid.srcObject = stream;
}

window.addEventListener("DOMContentLoaded", async () => {
  currentRoom = new URLSearchParams(location.search).get("room");
  currentPlayer = localStorage.getItem("displayName") || "Unknown";
  await initCamera(localStorage.getItem("cameraFacingMode") || "user");
  logToScreen("🧠 DOM Ready — Player: " + currentPlayer + " Room: " + currentRoom);
});
