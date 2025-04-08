import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  push
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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
const roomId = new URLSearchParams(window.location.search).get("room");
const displayName = localStorage.getItem("displayName") || "Unknown";

const playersRef = ref(db, `rooms/${roomId}/players`);
const chatRef = ref(db, `rooms/${roomId}/chat`);

onValue(playersRef, (snapshot) => {
  const container = document.getElementById("playerPanels");
  container.innerHTML = "";
  const players = snapshot.val();
  if (players) {
    Object.entries(players).forEach(([key, player]) => {
      container.innerHTML += `
        <div style="border:2px solid #ffa500; padding:1em; min-width:200px; background:#222">
          <h3>${player.name}</h3>
          <p>Life: <input type="number" id="life-${key}" value="${player.life}" style="width:60px"/></p>
          <p>Commander Dmg: <input type="number" id="cd-${key}" value="${player.commander || 0}" style="width:60px"/></p>
          <p>Status: <input type="text" id="status-${key}" value="${player.status || ''}" style="width:100px"/></p>
          <button onclick="savePlayer('${key}')">Save</button>
        </div>
      `;
    });
  }
});

window.savePlayer = (playerKey) => {
  const newLife = parseInt(document.getElementById(`life-${playerKey}`).value);
  const newCD = parseInt(document.getElementById(`cd-${playerKey}`).value);
  const newStatus = document.getElementById(`status-${playerKey}`).value;

  update(ref(db, `rooms/${roomId}/players/${playerKey}`), {
    life: newLife,
    commander: newCD,
    status: newStatus
  });
};

// Chat
document.getElementById("toggleChatBtn").addEventListener("click", () => {
  const chat = document.getElementById("chatPanel");
  chat.style.display = chat.style.display === "none" ? "block" : "none";
});

onValue(chatRef, (snapshot) => {
  const log = document.getElementById("chatLog");
  log.innerHTML = "";
  snapshot.forEach((msgSnap) => {
    const msg = msgSnap.val();
    log.innerHTML += `<p><strong>${msg.name}:</strong> ${msg.text}</p>`;
  });
});

window.sendChat = () => {
  const input = document.getElementById("chatInput");
  if (input.value.trim()) {
    push(chatRef, {
      name: displayName,
      text: input.value.trim()
    });
    input.value = "";
  }
};
