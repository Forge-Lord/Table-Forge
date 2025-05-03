import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  onChildAdded,
  onDisconnect,
  push,
  set,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import SimplePeer from "https://cdn.skypack.dev/simple-peer?min";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com",
  projectId: "tableforge-app",
  appId: "1:708497363618:web:39da060b48681944923dfb",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const params = new URLSearchParams(window.location.search);
const roomCode = params.get("room");
const mySeat = localStorage.getItem("mySeat");

let localStream;
let peers = {};
let selectedCamera = localStorage.getItem("selectedCamera") || "";
let selectedMic = localStorage.getItem("selectedMic") || "";

onAuthStateChanged(auth, async (user) => {
  if (!user || !roomCode || !mySeat) {
    alert("Missing user or room context");
    return (window.location.href = "/profile.html");
  }

  const name = localStorage.getItem("displayName") || user.displayName || user.email;

  const snap = await get(ref(db, `rooms/${roomCode}`));
  const roomData = snap.val();
  const playerCount = roomData.playerCount;
  const players = roomData.players;

  configureLayout(playerCount);
  updateNames(players);
  await startCameraPreview();
  attachMyStream(mySeat, name);
  setupPeerSync(players);
  startLifeSync();
  setupChat();
});

function configureLayout(count) {
  const grid = document.querySelector(".overlay-grid");
  if (!grid) return;
  grid.style.gridTemplateColumns = count === 2 ? "1fr" : "1fr 1fr";
  grid.style.gridTemplateRows = count < 3 ? "1fr 1fr" : "1fr 1fr";
  ["P3", "P4"].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.style.display = count > 2 + i ? "block" : "none";
  });
}

function updateNames(players) {
  for (const seat in players) {
    const el = document.getElementById(seat);
    const label = el?.querySelector(".name");
    if (label) label.textContent = players[seat].name || seat;
  }
}

async function startCameraPreview() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");
    const mics = devices.filter((d) => d.kind === "audioinput");

    if (!selectedCamera && cams.length) selectedCamera = cams[0].deviceId;
    if (!selectedMic && mics.length) selectedMic = mics[0].deviceId;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
      audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
    });
    localStream = stream;
    return true;
  } catch (e) {
    console.error("❌ Failed to access media devices:", e);
    return false;
  }
}

function attachMyStream(seat, name) {
  const el = document.getElementById(seat);
  const vid = el?.querySelector("video");
  if (vid && localStream) {
    vid.srcObject = localStream;
    vid.muted = true;
    vid.play().catch((err) => console.warn("⚠️ play() failed:", err));
  }
  const label = el?.querySelector(".name");
  if (label) label.textContent = name;
}

function setupPeerSync(players) {
  const myRef = ref(db, `signals/${roomCode}/${mySeat}`);
  const myId = push(myRef).key;
  onDisconnect(ref(db, `signals/${roomCode}/${mySeat}/${myId}`)).remove();

  for (const seat in players) {
    if (seat !== mySeat && players[seat]?.name) {
      if (!peers[seat]) createPeer(seat, true);
    }
  }

  for (const seat in players) {
    if (seat === mySeat) continue;
    const seatRef = ref(db, `signals/${roomCode}/${seat}`);
    onChildAdded(seatRef, (snap) => {
      const { from, signal } = snap.val();
      if (from === mySeat) return;
      if (!peers[seat]) createPeer(seat, false);
      peers[seat].signal(signal);
    });
  }
}

function createPeer(targetSeat, initiator) {
  try {
    const peer = new SimplePeer({ initiator, trickle: false, stream: localStream });

    peer.on("signal", (data) => {
      push(ref(db, `signals/${roomCode}/${targetSeat}`), {
        from: mySeat,
        signal: data,
      });
    });

    peer.on("stream", (stream) => {
      const box = document.getElementById(targetSeat);
      const vid = box?.querySelector("video");
      if (vid) {
        vid.srcObject = stream;
        vid.play().catch((err) => console.warn("⚠️ Remote play failed:", err));
      }
    });

    peer.on("error", (err) => console.error(`❌ Peer error (${targetSeat}):`, err));
    peers[targetSeat] = peer;
  } catch (err) {
    console.error(`❌ Failed to create peer for ${targetSeat}:`, err);
  }
}

function startLifeSync() {
  const boxes = document.querySelectorAll(".player-box");
  boxes.forEach((box) => {
    const seat = box.id;
    const input = box.querySelector(".life input");
    const minus = box.querySelector(".life .minus");
    const plus = box.querySelector(".life .plus");

    if (!input || !minus || !plus) return;

    minus.onclick = () => updateLife(seat, parseInt(input.value || 0) - 1);
    plus.onclick = () => updateLife(seat, parseInt(input.value || 0) + 1);
    input.onchange = () => updateLife(seat, parseInt(input.value || 0));

    onChildAdded(ref(db, `life/${roomCode}/${seat}`), (snap) => {
      if (seat !== mySeat && input) input.value = snap.val();
    });
  });
}

function updateLife(seat, value) {
  set(ref(db, `life/${roomCode}/${seat}`), value);
}

function setupChat() {
  const input = document.getElementById("chatInput");
  const log = document.getElementById("chatLog");
  if (!input || !log) return;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      const msg = { seat: mySeat, text: input.value.trim(), time: Date.now() };
      push(ref(db, `chat/${roomCode}`), msg);
      input.value = "";
    }
  });

  onChildAdded(ref(db, `chat/${roomCode}`), (snap) => {
    const { seat, text } = snap.val();
    const div = document.createElement("div");
    div.textContent = `${seat}: ${text}`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  });
}

document.getElementById("toggleCam")?.addEventListener("click", () => {
  localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
});
document.getElementById("toggleMic")?.addEventListener("click", () => {
  localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
});
document.getElementById("leaveBtn")?.addEventListener("click", () => {
  window.location.href = "/";
});
