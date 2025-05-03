import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, get, onChildAdded, onDisconnect, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import SimplePeer from "https://cdn.skypack.dev/simple-peer?min";

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
let currentName = "";

function configureLayout(playerCount) {
  const grid = document.querySelector(".overlay-grid");
  if (!grid) return;
  const seats = ["P1", "P2", "P3", "P4"];
  grid.style.gridTemplateRows = playerCount === 2 ? "1fr 1fr" : "1fr 1fr";
  grid.style.gridTemplateColumns = playerCount === 2 ? "1fr" : "1fr 1fr";

  seats.forEach((seat, index) => {
    const el = document.getElementById(seat);
    if (!el) return;
    el.style.display = index < playerCount ? "block" : "none";
  });
}

function updateNames(players) {
  for (const seat in players) {
    const box = document.getElementById(seat);
    if (box) {
      const label = box.querySelector(".name");
      if (label) label.textContent = players[seat].name || seat;
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
    console.error("Media access failed:", err);
    return false;
  }
}

function attachMyStream(seat, name) {
  const box = document.getElementById(seat);
  if (!box) return;
  const vid = box.querySelector("video");
  if (vid && localStream) {
    vid.srcObject = localStream;
    vid.muted = true;
    vid.play().catch(err => console.warn("play() failed:", err));
  }
  const label = box.querySelector(".name");
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
    onChildAdded(seatRef, (sigSnap) => {
      const val = sigSnap.val();
      if (!val || !val.signal || val.from === mySeat) return;
      if (!peers[seat]) createPeer(seat, false);
      peers[seat].signal(val.signal);
    });
  }
}

function createPeer(targetSeat, initiator) {
  try {
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: localStream
    });

    peer.on("signal", (data) => {
      push(ref(db, `signals/${roomCode}/${targetSeat}`), {
        from: mySeat,
        signal: data
      });
    });

    peer.on("stream", (stream) => {
      const box = document.getElementById(targetSeat);
      if (!box) return;
      const vid = box.querySelector("video");
      if (vid) {
        vid.srcObject = stream;
        vid.play().catch(err => console.warn("Remote play failed:", err));
      }
    });

    peer.on("error", err => console.error(`Peer error (${targetSeat}):`, err));

    peers[targetSeat] = peer;
  } catch (err) {
    console.error(`Failed to create peer for ${targetSeat}:`, err);
  }
}

function setupChat() {
  const chatBox = document.getElementById("chatBox");
  const chatInput = document.getElementById("chatInput");
  const chatSend = document.getElementById("chatSend");
  const chatRef = ref(db, `chats/${roomCode}`);

  chatSend.onclick = () => {
    const msg = chatInput.value.trim();
    if (!msg) return;
    const entry = { name: currentName || mySeat, message: msg, time: Date.now() };
    push(chatRef, entry);
    chatInput.value = "";
  };

  onChildAdded(chatRef, (snap) => {
    const msg = snap.val();
    const div = document.createElement("div");
    div.textContent = `${msg.name}: ${msg.message}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

export async function startOverlay() {
  onAuthStateChanged(auth, async (user) => {
    if (!user || !roomCode || !mySeat) {
      alert("Missing user or room context");
      return window.location.href = "/profile.html";
    }

    currentName = localStorage.getItem("displayName") || user.displayName || user.email;

    const snap = await get(ref(db, `rooms/${roomCode}`));
    const roomData = snap.val();
    if (!roomData) return alert("Room not found.");
    const playerCount = roomData.playerCount;
    const players = roomData.players;

    configureLayout(playerCount);
    updateNames(players);
    setupChat();

    const camReady = await startPreviewCompatibleCamera();
    if (!camReady) return;
    attachMyStream(mySeat, currentName);
    setupPeerSync(players);
  });
}

window.startOverlay = startOverlay;
