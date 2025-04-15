// ✅ av.js – Browser-safe with PeerJS global + Firebase CDN inline

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

export async function setupAVMesh(players, me, roomId) {
  console.log("🚀 setupAVMesh called", { players, me, roomId });

  currentPlayer = me;
  currentRoom = roomId;

  peer = new Peer(me);

  peer.on('open', id => {
    const playerRef = ref(db, `rooms/${roomId}/players/${me}`);
    update(playerRef, { peerId: id });
  });

  peer.on('call', call => {
    call.answer(localStream);
    call.on('stream', remoteStream => {
      renderRemoteStream(call.metadata?.seat || call.peer, remoteStream);
    });
  });

  players.forEach(player => {
    if (player.name !== me && player.peerId) {
      const call = peer.call(player.peerId, localStream, { metadata: { seat: player.seat } });
      call.on('stream', remoteStream => {
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
  } catch (err) {
    console.error("Camera access error:", err);
  }
}

function renderRemoteStream(seat, stream) {
  const vid = document.getElementById(`video-${seat}`);
  if (vid) vid.srcObject = stream;
}

window.addEventListener("DOMContentLoaded", async () => {
  currentRoom = new URLSearchParams(location.search).get("room");
  currentPlayer = localStorage.getItem("displayName") || "Unknown";
  await initCamera(localStorage.getItem("cameraFacingMode") || "user");
});
