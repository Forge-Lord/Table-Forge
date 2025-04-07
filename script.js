import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase, ref, get, set, update
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const roomCode = "roomforge";
const playerSlot = "P1"; // static for now, future: find available
const roomRef = ref(db, `rooms/${roomCode}`);

window.joinLobby = async function () {
  const name = document.getElementById("displayName").value || "Player";
  const template = document.getElementById("templateSelect").value;
  await update(roomRef, {
    template,
    playerCount: 4,
    [`players/${playerSlot}`]: {
      name,
      ready: false
    }
  });
  loadPlayers();
};

async function loadPlayers() {
  const snap = await get(roomRef);
  const data = snap.val();
  const playersDiv = document.getElementById("players");
  playersDiv.innerHTML = "";
  for (const [slot, info] of Object.entries(data.players || {})) {
    playersDiv.innerHTML += `<div>${slot}: ${info.name || "(no name)"} [${info.ready ? "Ready" : "Not Ready"}]</div>`;
  }
}

loadPlayers();