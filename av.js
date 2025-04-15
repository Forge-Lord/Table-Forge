import { getDatabase, ref, onDisconnect, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const roomId = new URLSearchParams(location.search).get("room");
const localName = localStorage.getItem("displayName");

let localStream = null;
let connections = {};

async function getLocalMedia() {
  if (localStream) return localStream;
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localStream = stream;
  return stream;
}

export async function setupPeer(seat, isSelf, name) {
  const stream = await getLocalMedia();
  const seatRef = ref(db, `rooms/${roomId}/streams/${name}`);
  const vidEl = document.getElementById(`video-${seat}`);

  if (isSelf) {
    vidEl.srcObject = stream;
    await set(seatRef, { online: true });
    onDisconnect(seatRef).remove();
  } else {
    onValue(seatRef, async snap => {
      const data = snap.val();
      if (!data) return;
      vidEl.srcObject = stream; // simplified demo — replace with WebRTC remote stream
    });
  }
}

window.toggleMic = () => {
  if (!localStream) return;
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
};

window.toggleCam = () => {
  if (!localStream) return;
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
};
