// av.js – Forge Spirit WebRTC Sync using PeerJS

import { db, ref, update } from './firebasejs.js';
import Peer from 'https://cdn.skypack.dev/peerjs';

let localStream = null;
let currentPlayer = null;
let currentRoom = null;
let peer = null;

export async function setupAVMesh(players, me, roomId) {
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
      renderRemoteStream(call.peer, remoteStream);
    });
  });

  players.forEach(player => {
    if (player.name !== me && player.peerId) {
      const call = peer.call(player.peerId, localStream);
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
