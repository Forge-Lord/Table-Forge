import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  onChildAdded,
  onDisconnect,
  push
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import SimplePeer from "https://cdn.skypack.dev/simple-peer";

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
const selectedCamera = localStorage.getItem("selectedCamera");
const selectedMic = localStorage.getItem("selectedMic");

let localStream;
let peers = {};
let peerId;

onAuthStateChanged(auth, async (user) => {
  if (!user || !roomCode || !mySeat) {
    alert("Missing room or seat. Please rejoin.");
    window.location.href = "/lobby.html";
    return;
  }

  const name = localStorage.getItem("displayName") || user.displayName || user.email;

  // Load video/audio
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
      audio: selectedMic ? { deviceId: { exact: selectedMic } } : true
    });
    console.log("✅ Local stream acquired");
  } catch (err) {
    console.error("❌ Camera/mic permission error:", err);
    alert("Please allow camera/mic and refresh the page.");
    return;
  }

  const myBox = document.getElementById(mySeat);
  const myVideo = myBox.querySelector("video");
  myVideo.srcObject = localStream;
  myVideo.muted = true;

  myBox.querySelector(".name").textContent = name;

  // Register as participant
  peerId = push(ref(db, `signals/${roomCode}/${mySeat}`)).key;
  onDisconnect(ref(db, `signals/${roomCode}/${mySeat}/${peerId}`)).remove();

  // Listen for incoming signals
  onChildAdded(ref(db, `signals/${roomCode}`), (snap) => {
    const seat = snap.key;
    if (seat === mySeat) return;

    onChildAdded(ref(db, `signals/${roomCode}/${seat}`), (sigSnap) => {
      const { from, signal } = sigSnap.val();
      if (from === mySeat) return;

      if (!peers[seat]) {
        createPeer(seat, false);
      }

      peers[seat].signal(signal);
    });
  });

  // Create offers for other players
  const roomSnap = await get(ref(db, `rooms/${roomCode}/players`));
  const players = roomSnap.val();

  for (let seat in players) {
    if (seat !== mySeat && players[seat].name) {
      createPeer(seat, true);
    }
  }
});

function createPeer(targetSeat, initiator) {
  const peer = new SimplePeer({
    initiator,
    trickle: false,
    stream: localStream
  });

  peer.on("signal", (data) => {
    const payload = {
      from: mySeat,
      signal: data
    };
    push(ref(db, `signals/${roomCode}/${targetSeat}`), payload);
  });

  peer.on("stream", (stream) => {
    const box = document.getElementById(targetSeat);
    if (box) {
      const vid = box.querySelector("video");
      vid.srcObject = stream;
      vid.play();
    }
  });

  peer.on("error", (err) => console.error("Peer error:", err));
  peers[targetSeat] = peer;
}
