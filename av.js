// ⚒️ Forge Sync AV.JS v2.8 – Stream guard, error logging, call tracking

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
let alreadySetup = false;

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
  if (alreadySetup) return;
  alreadySetup = true;
  logToScreen("🛠️ setupAVMesh called for " + me);
  currentPlayer = me;
  currentRoom = roomId;

  peer = new Peer(me);

  peer.on('call', call => {
    logToScreen("📞 Incoming call from: " + call.peer);
    waitForStreamReady(() => {
      call.answer(localStream);
    });
    call.on('stream', remoteStream => {
      logToScreen("📡 Received remote stream from " + call.peer);
      renderRemoteStream(call.metadata?.seat || call.peer, remoteStream);
    });
    call.on('error', err => {
      logToScreen("❌ Call error from " + call.peer + ": " + err.message);
    });
    call.on('close', () => {
      logToScreen("📴 Call closed by " + call.peer);
    });
  });

  peer.on('open', async id => {
    logToScreen("🔑 Peer ID created: " + id);
    const playerRef = ref(db, `rooms/${roomId}/players/${me}`);
    await update(playerRef, { peerId: id });

    await delay(1000);
    players.forEach(player => {
      if (player.name !== me && player.peerId) {
        logToScreen("📤 Calling peer: " + player.peerId);
        waitForStreamReady(() => {
          const call = peer.call(player.peerId, localStream, { metadata: { seat: player.seat } });
          call.on('stream', remoteStream => {
            logToScreen("🎥 Got remote stream from " + player.name);
            renderRemoteStream(player.seat, remoteStream);
          });
          call.on('error', err => {
            logToScreen("❌ Outgoing call error to " + player.name + ": " + err.message);
          });
          call.on('close', () => {
            logToScreen("📴 Call closed with " + player.name);
          });
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
    const localVid = await waitForVideoElement(mySeat);
    if (localVid) {
      localVid.srcObject = localStream;
      localVid.onloadedmetadata = () => {
        logToScreen("📺 Local video loaded in " + mySeat);
        localVid.play().catch(err => logToScreen("⚠️ play() failed: " + err.message));
      };
    } else {
      logToScreen("⚠️ video-" + mySeat + " not found");
    }
  } catch (err) {
    logToScreen("🚫 Webcam error: " + err.message);
  }
}

function renderRemoteStream(seat, stream) {
  const vid = document.getElementById(`video-${seat}`);
  if (!vid) {
    logToScreen(`⚠️ No video-${seat} found. Will retry.`);
    retryAttach(seat, stream);
    return;
  }
  vid.srcObject = stream;
  vid.onloadedmetadata = () => {
    logToScreen("🎥 Remote stream visible in video-" + seat);
    vid.play().catch(err => logToScreen("⚠️ play() failed: " + err.message));
  };
}

function retryAttach(seat, stream, attempt = 1) {
  if (attempt > 10) return;
  setTimeout(() => {
    const vid = document.getElementById(`video-${seat}`);
    if (vid) {
      vid.srcObject = stream;
      logToScreen("✅ Retry: attached stream to video-" + seat);
      vid.play().catch(err => logToScreen("⚠️ play() retry failed: " + err.message));
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

function waitForVideoElement(seat, maxTries = 10) {
  return new Promise((resolve) => {
    let tries = 0;
    const check = () => {
      const el = document.getElementById(`video-${seat}`);
      if (el) return resolve(el);
      tries++;
      if (tries > maxTries) return resolve(null);
      setTimeout(check, 200);
    };
    check();
  });
}

function waitForStreamReady(cb) {
  let tries = 0;
  const check = () => {
    if (localStream) return cb();
    if (tries++ > 10) return logToScreen("❌ Timed out waiting for stream");
    setTimeout(check, 200);
  };
  check();
}

// Mute workaround
window.toggleMic = () => {
  logToScreen("🔇 toggleMic placeholder called (not implemented)");
};

window.addEventListener("DOMContentLoaded", async () => {
  currentRoom = new URLSearchParams(location.search).get("room");
  currentPlayer = localStorage.getItem("displayName") || "Unknown";
  logToScreen("🌐 DOM Ready – " + currentPlayer + " in room " + currentRoom);
  await initCamera(localStorage.getItem("cameraFacingMode") || "user");
});
