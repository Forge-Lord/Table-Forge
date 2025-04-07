import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSy...REDACTED",
  authDomain: "tableforge-app.firebaseapp.com",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com",
  projectId: "tableforge-app",
  storageBucket: "tableforge-app.appspot.com",
  messagingSenderId: "REDACTED",
  appId: "REDACTED"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.joinLobby = () => {
  const name = document.getElementById("displayName").value || "Player";
  const template = document.getElementById("templateSelect").value;
  const roomCode = new URLSearchParams(window.location.search).get("room") || "roomforge";
  const playerRef = ref(db, `rooms/${roomCode}/players/${name}`);

  set(playerRef, {
    name: name,
    ready: false,
    template: template
  });
};

const roomCode = new URLSearchParams(window.location.search).get("room") || "roomforge";
const playersRef = ref(db, `rooms/${roomCode}/players`);
onValue(playersRef, (snapshot) => {
  const container = document.getElementById("players");
  container.innerHTML = "<h3>Players</h3>";
  const players = snapshot.val();
  if (players) {
    Object.entries(players).forEach(([key, player]) => {
      const p = document.createElement("p");
      p.textContent = `${player.name} [${player.ready ? "Ready" : "Not Ready"}]`;
      container.appendChild(p);
    });
  }
});
