// ✅ overlay.js - Enhanced peer debug version with cam fallback
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, get, onChildAdded, onDisconnect, push } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com",
  projectId: "tableforge-app",
  appId: "1:708497363618:web:39da060b48681944923dfb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const params = new URLSearchParams(window.location.search);
const roomCode = params.get("room");
const mySeat = localStorage.getItem("mySeat");

let selectedCamera = localStorage.getItem("selectedCamera") || "";
let selectedMic = localStorage.getItem("selectedMic") || "";
let localStream;
let peers = {};

function startOverlay() {
  console.log("▶️ Start Overlay triggered");
  onAuthStateChanged(auth, async (user) => {
    if (!user || !roomCode || !mySeat) {
      alert("Missing user or room context");
      return window.location.href = "/profile.html";
    }
    const name = localStorage.getItem("displayName") || user.displayName || user.email;
    const snap = await get(ref(db, `rooms/${roomCode}`));
    const roomData = snap.val();
    const playerCount = roomData.playerCount;
    const players = roomData.players;
    configureLayout(playerCount);
    updateNames(players);
    syncLifeFromFirebase(players);
    const camSuccess = await startPreviewCompatibleCamera();
    if (!camSuccess) return;
    console.log("📷 Local camera stream ready");
    attachMyStream(mySeat, name);
    setupPeerSync(players);
  });
}

function configureLayout(playerCount) {
  const grid = document.querySelector(".overlay-grid");
  const seats = ["P1", "P2", "P3", "P4"];
  if (!grid) return;
  if (playerCount === 2) {
    grid.style.gridTemplateRows = "1fr 1fr";
    grid.style.gridTemplateColumns = "1fr";
    hideSeats(["P3", "P4"]);
  } else if (playerCount === 3) {
    grid.style.gridTemplateRows = "1fr 1fr";
    grid.style.gridTemplateColumns = "1fr 1fr";
    hideSeats(["P4"]);
  } else {
    grid.style.gridTemplateRows = "1fr 1fr";
    grid.style.gridTemplateColumns = "1fr 1fr";
    showAllSeats(seats);
  }
}

function hideSeats(seats) {
  for (const s of seats) {
    const el = document.getElementById(s);
    if (el) el.style.display = "none";
  }
}

function showAllSeats(seats) {
  for (const s of seats) {
    const el = document.getElementById(s);
    if (el) el.style.display = "block";
  }
}

function updateNames(players) {
  for (const seat in players) {
    const box = document.getElementById(seat);
    const label = box?.querySelector(".name");
    if (box && label) {
      label.textContent = players[seat].name || seat;
    }
  }
}

async function startPreviewCompatibleCamera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d => d.kind === "videoinput");
    const mics = devices.filter(d => d.kind === "audioinput");
    if (!selectedCamera && cams.length) selectedCamera = cams[0].deviceId;
    if (!selectedMic && mics.length) selectedMic = mics[0].deviceId;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
      audio: selectedMic ? { deviceId: { exact: selectedMic } } : true
    });
    localStream = stream;
    return true;
  } catch (err) {
    console.error("❌ Camera preview failed:", err);
    return false;
  }
}

function attachMyStream(seat, name) {
  const box = document.getElementById(seat);
  const vid = box?.querySelector("video");
  const label = box?.querySelector(".name");
  if (vid && localStream) {
    vid.srcObject = localStream;
    vid.muted = true;
    vid.play().catch(err => console.warn("⚠️ play() failed:", err));
  }
  if (label) label.textContent = name;
}

function setupPeerSync(players) {
  const myRef = ref(db, `signals/${roomCode}/${mySeat}`);
  const myId = push(myRef).key;
  onDisconnect(ref(db, `signals/${roomCode}/${mySeat}/${myId}`)).remove();

  for (const seat in players) {
    if (seat !== mySeat && players[seat]?.name) {
      if (!peers[seat]) {
        console.log(`📤 Initiating peer to ${seat}`);
        createPeer(seat, true);
      }
    }
  }

  for (const seat in players) {
    if (seat === mySeat) continue;
    const seatRef = ref(db, `signals/${roomCode}/${seat}`);
    onChildAdded(seatRef, (sigSnap) => {
      const val = sigSnap.val();
      if (!val || !val.signal || val.from === mySeat) return;
      if (!peers[seat]) {
        console.log(`📥 Responding to peer from ${seat}`);
        createPeer(seat, false);
      }
      peers[seat].signal(val.signal);
    });
  }
}

function createPeer(targetSeat, initiator) {
  try {
    const peer = new window.SimplePeer({ initiator, trickle: false, stream: localStream });
    let timeout = setTimeout(() => {
      console.warn(`⏳ No stream from ${targetSeat} after 5s`);
      const box = document.getElementById(targetSeat);
      if (box) box.style.border = "2px solid red";
    }, 5000);

    peer.on("signal", (data) => {
      const payload = { from: mySeat, signal: data };
      push(ref(db, `signals/${roomCode}/${targetSeat}`), payload);
      console.log(`📡 Signal sent to ${targetSeat}`);
    });

    peer.on("stream", (stream) => {
      const box = document.getElementById(targetSeat);
      const vid = box?.querySelector("video");
      if (vid) {
        vid.srcObject = stream;
        vid.play().catch(err => console.warn("Remote play failed", err));
        box.style.border = "2px solid limegreen";
        clearTimeout(timeout);
        console.log(`🎥 Video stream connected from ${targetSeat}`);
      }
    });

    peer.on("connect", () => console.log(`🔗 Peer connected: ${targetSeat}`));
    peer.on("error", (err) => console.error(`❌ Peer error (${targetSeat}):`, err));
    peers[targetSeat] = peer;
  } catch (err) {
    console.error(`❌ Failed to create peer for ${targetSeat}:`, err);
  }
}

function adjustLife(seat, delta) {
  const input = document.getElementById(`life-${seat}`);
  if (input) {
    const newVal = parseInt(input.value || "0", 10) + delta;
    input.value = newVal;
    push(ref(db, `rooms/${roomCode}/players/${seat}/lifeUpdates`), {
      value: newVal,
      at: Date.now()
    });
  }
}

function syncLifeFromFirebase(players) {
  for (const seat in players) {
    const lifeRef = ref(db, `rooms/${roomCode}/players/${seat}/lifeUpdates`);
    onChildAdded(lifeRef, (snap) => {
      const val = snap.val();
      const input = document.getElementById(`life-${seat}`);
      if (input) input.value = val.value;
    });
  }
}

window.startOverlay = startOverlay;
window.adjustLife = adjustLife;
