import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  projectId: "tableforge-app",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get("room");

if (!roomId) {
  roomId = `room-${Math.random().toString(36).substring(2, 7)}`;
  window.history.replaceState({}, "", `?room=${roomId}`);
}

document.getElementById("roomCode").textContent = `Room: ${roomId}`;

const displayName = localStorage.getItem("displayName") || `Guest${Math.floor(Math.random() * 1000)}`;
const playerRef = ref(db, `rooms/${roomId}/players/${displayName}`);

set(playerRef, {
  name: displayName,
  isHost: true,
  seat: "p1",
  life: 40,
  status: "",
  commander: 0
});

const playersDiv = document.getElementById("players");
const playersRef = ref(db, `rooms/${roomId}/players`);
onValue(playersRef, (snapshot) => {
  playersDiv.innerHTML = "<h2>Players in this room:</h2>";
  const data = snapshot.val();
  if (data) {
    Object.values(data).forEach(player => {
      const p = document.createElement("p");
      p.textContent = player.name;
      playersDiv.appendChild(p);
    });
  }

  if (data && Object.keys(data).length >= 1 && displayName in data && data[displayName].isHost) {
    document.getElementById("startGame").style.display = "inline-block";
  }
});

window.startGame = () => {
  window.location.href = `overlay.html?room=${roomId}`;
};

window.joinRoomByCode = () => {
  const code = document.getElementById("roomCodeInput").value.trim();
  if (code) {
    window.location.href = `lobby.html?room=${code}`;
  }
};
