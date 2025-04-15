// ⚒️ Forge Sync AV.JS v2.7 – Cam render fix + retry + log

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
      requestAnimationFrame(() => {
        localVid.onloadedmetadata = () => {
          localVid.play().then(() => {
            logToScreen("📺 Local video successfully playing in " + mySeat);
            showReadyMark(mySeat);
          }).catch(err => {
            logToScreen("⚠️ Local video play() failed: " + err.message);
            retryPlay(localVid, mySeat);
          });
        };
      });
    } else {
      logToScreen("⚠️ video-" + mySeat + " not found");
    }
  } catch (err) {
    logToScreen("🚫 Webcam error: " + err.message);
  }
}

function retryPlay(videoEl, seat, attempt = 1) {
  if (attempt > 5) return;
  setTimeout(() => {
    videoEl.play().then(() => {
      logToScreen("✅ Retry succeeded: video playing in " + seat);
      showReadyMark(seat);
    }).catch(err => {
      logToScreen("⚠️ Retry #" + attempt + " play() failed: " + err.message);
      retryPlay(videoEl, seat, attempt + 1);
    });
  }, 500);
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

function showReadyMark(seat) {
  const target = document.getElementById("seat-" + seat);
  if (!target) return;
  const mark = document.createElement("span");
  mark.innerText = " ✅";
  mark.style.color = "lime";
  mark.style.fontSize = "14px";
  mark.style.marginLeft = "4px";
  target.appendChild(mark);
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

window.addEventListener("DOMContentLoaded", async () => {
  currentRoom = new URLSearchParams(location.search).get("room");
  currentPlayer = localStorage.getItem("displayName") || "Unknown";
  logToScreen("🌐 DOM Ready – " + currentPlayer + " in room " + currentRoom);
  await initCamera(localStorage.getItem("cameraFacingMode") || "user");
});
