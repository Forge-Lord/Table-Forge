import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com",
  projectId: "tableforge-app",
  storageBucket: "tableforge-app.appspot.com",
  messagingSenderId: "708497363618",
  appId: "1:708497363618:web:39da060b48681944923dfb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");
document.getElementById("roomHeader").innerText = "Room: " + roomId;

const joinBtn = document.getElementById("joinBtn");
const startBtn = document.getElementById("startButton");

joinBtn?.addEventListener("click", () => {
  const name = document.getElementById("displayName").value || "Player";
  const template = document.getElementById("gameSelect").value;
  const notes = document.getElementById("hostNotes").value;

  const playerRef = ref(db, `rooms/${roomId}/players/${name}`);
  const roomRef = ref(db, `rooms/${roomId}/info`);

  set(playerRef, {
    name: name,
    template: template,
    ready: false,
    life: 40
  });

  update(roomRef, {
    host: name,
    notes: notes,
    template: template
  });

  localStorage.setItem("displayName", name);
  startBtn.style.display = "inline-block";
});

startBtn?.addEventListener("click", () => {
  window.location.href = `overlay.html?room=${roomId}`;
});

const playersRef = ref(db, `rooms/${roomId}/players`);
onValue(playersRef, (snapshot) => {
  const container = document.getElementById("players");
  if (container) {
    container.innerHTML = "<h3>Players</h3>";
    const players = snapshot.val();
    if (players) {
      Object.entries(players).forEach(([_, player]) => {
        container.innerHTML += `<p>${player.name} - Life: ${player.life}</p>`;
      });
    }
  }
});
