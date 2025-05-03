import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onChildAdded, push, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import SimplePeer from "https://cdn.skypack.dev/simple-peer?min";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com",
  projectId: "tableforge-app",
  appId: "1:708497363618:web:39da060b48681944923dfb",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const params = new URLSearchParams(window.location.search);
const roomCode = params.get("room");
let localStream;
let peers = {};

// Initialize local media stream
async function setupLocalStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStream = stream;
    attachStreamToElement("P1", localStream, true); // Attach local stream to P1
  } catch (err) {
    console.error("Failed to get local media:", err);
  }
}

// Attach a stream to a player element
function attachStreamToElement(seat, stream, muted = false) {
  const box = document.getElementById(seat);
  const video = box.querySelector("video");
  if (video) {
    video.srcObject = stream;
    video.muted = muted;
    video.play().catch((err) => console.warn("Video play failed:", err));
  }
}

// Setup peer signaling
function setupSignaling() {
  const signalingRef = ref(db, `rooms/${roomCode}/signals`);

  onChildAdded(signalingRef, (snapshot) => {
    const data = snapshot.val();
    if (data.from === "P1") return; // Ignore our own signals

    const peer = new SimplePeer({
      initiator: data.initiator || false,
      stream: localStream,
    });

    peers[data.from] = peer;

    peer.on("signal", (signal) => {
      push(signalingRef, { from: "P1", to: data.from, signal });
    });

    peer.on("stream", (stream) => {
      attachStreamToElement(data.from, stream); // Attach remote stream
    });

    peer.signal(data.signal);
  });
}

// Start the overlay
async function startOverlay() {
  await setupLocalStream();
  setupSignaling();
  document.querySelector(".overlay-grid").style.display = "grid";
}

document.getElementById("startBtn").addEventListener("click", startOverlay);
