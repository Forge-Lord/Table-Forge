// ✅ FINAL av.js – Self-cam auto-seat detection + debug + mesh

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
    console.log("🔑 Peer ID created:", id);
    const playerRef = ref(db, `rooms/${roomId}/players/${me}`);
    update(playerRef, { peerId: id });
  });

  peer.on('call', call => {
    console.log("📞 Incoming call from:", call.peer);
    call.answer(localStream);
    call.on('stream', remoteStream => {
      console.log("📡 Receiving remote stream:", remoteStream);
      renderRemoteStream(call.metadata?.seat || call.peer, remoteStream);
    });
  });

  players.forEach(player => {
    if (player.name !== me && player.peerId) {
      console.log("📤 Calling peer:", player.peerId);
      const call = peer.call(player.peerId, localStream, { metadata: { seat: player.seat } });
      call.on('stream', remoteStream => {
        console.log("🎥 Stream from", player.name, "at seat", player.seat, remoteStream);
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
    console.log("📷 Camera stream acquired:", localStream);

    // 🪞 Show own video in correct seat based on player name match
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
      console.log(`🎥 Showing local cam in ${mySeat}`);
      localVid.srcObject = localStream;
    } else {
      console.warn("⚠️ Could not find local video element for:", mySeat);
    }
  } catch (err) {
    console.error("🚫 Camera access error:", err);
  }
}

function renderRemoteStream(seat, stream) {
  const vid = document.getElementById(`video-${seat}`);
  if (!vid) {
    console.warn(`⚠️ No video element found for seat ${seat}`);
    return;
  }
  console.log(`🎥 Attaching stream to video-${seat}`, stream);
  vid.srcObject = stream;
}

window.addEventListener("DOMContentLoaded", async () => {
  currentRoom = new URLSearchParams(location.search).get("room");
  currentPlayer = localStorage.getItem("displayName") || "Unknown";
  await initCamera(localStorage.getItem("cameraFacingMode") || "user");
  console.log("🧠 DOM Ready — Player:", currentPlayer, "Room:", currentRoom);
});
