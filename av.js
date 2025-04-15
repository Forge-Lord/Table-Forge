// av.js – Audio/Video Mesh Sync

const Peer = window.Peer;

let localStream = null;
let currentPlayer = null;
let currentRoom = null;
let peer = null;

export async function setupAVMesh(players, me, roomId) {
  currentPlayer = me;
  currentRoom = roomId;

  peer = new Peer(me);

  peer.on('call', call => {
    call.answer(localStream);
    call.on('stream', remoteStream => {
      attachRemoteStream(call.metadata?.seat || call.peer, remoteStream);
    });
  });

  peer.on('open', id => {
    const mySeat = guessMySeat(players);
    const localVid = document.getElementById(`video-${mySeat}`);
    if (localVid) {
      localVid.srcObject = localStream;
      localVid.muted = true;
      localVid.play();
    }

    players.forEach(p => {
      if (p.name !== me && p.peerId) {
        const call = peer.call(p.peerId, localStream, {
          metadata: { seat: mySeat }
        });
        call.on('stream', remoteStream => {
          attachRemoteStream(p.seat, remoteStream);
        });
      }
    });
  });
}

function attachRemoteStream(seat, stream) {
  const vid = document.getElementById(`video-${seat}`);
  if (vid) {
    vid.srcObject = stream;
    vid.play();
  }
}

function guessMySeat(players) {
  const myPlayer = players.find(p => p.name === currentPlayer);
  return myPlayer?.seat || "p1";
}

async function initCamera(facingMode = "user") {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true
    });
  } catch (err) {
    alert("Failed to access camera/microphone.");
    console.error(err);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initCamera(localStorage.getItem("cameraFacingMode") || "user");
});
