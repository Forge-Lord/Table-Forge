import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  push
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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
const auth = getAuth(app);

const roomId = new URLSearchParams(window.location.search).get("room");
const clickSound = document.getElementById("clickSound");

let currentUser = null;
let displayName = null;
let isHost = false;

// 🔓 Profile panel
document.getElementById("profileBtn").addEventListener("click", () => {
  const pop = document.getElementById("profilePopup");
  pop.style.display = pop.style.display === "none" ? "block" : "none";
});

window.logout = () => {
  signOut(auth).then(() => {
    localStorage.clear();
    window.location.href = "profile.html";
  });
};

// 🔁 Auth + overlay binding
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    displayName = localStorage.getItem("displayName") || "Unknown";

    document.getElementById("profileName").innerText = `Name: ${displayName}`;
    document.getElementById("profileDiscord").innerText = "";

    bindRoom();
  } else {
    window.location.href = "profile.html";
  }
});

// 🔗 ROOM BINDING
function bindRoom() {
  const playerRef = ref(db, `rooms/${roomId}/players/${displayName}`);
  onValue(playerRef, (snap) => {
    const pdata = snap.val();
    if (!pdata) return;
    if (pdata.isHost) isHost = true;

    const seat = pdata.seat || "p1";
    renderPanel(seat, pdata);
  });

  const playersRef = ref(db, `rooms/${roomId}/players`);
  onValue(playersRef, (snap) => {
    const all = snap.val();
    Object.entries(all || {}).forEach(([name, pdata]) => {
      if (name !== displayName) {
        const seat = pdata.seat || "p2";
        renderPanel(seat, pdata, false);
      }
    });
  });
}

// 🎮 PANEL RENDERING
function renderPanel(seat, player, editable = true) {
  const panel = document.getElementById(seat);
  if (!panel) return;

  const override = isHost && !editable;
  const isSelf = player.name === displayName;

  panel.innerHTML = `
    <div style="background:#222; padding:1em; border:2px solid #${isSelf ? "ffa500" : "555"};">
      <h3>${player.name}</h3>
      <p>Life: <input id="life-${seat}" value="${player.life || 40}" ${!isSelf && !override ? "readonly" : ""}></p>
      <p>CMD: <input id="cmd-${seat}" value="${player.commander || 0}" ${!isSelf && !override ? "readonly" : ""}></p>
      <p>Status: <input id="stat-${seat}" value="${player.status || ""}" ${!isSelf && !override ? "readonly" : ""}></p>
      ${(isSelf || override) ? `<button onclick="save('${seat}', '${player.name}')">Save</button>` : ""}
    </div>
  `;
}

// 💾 SAVE PANEL
window.save = (seat, name) => {
  const life = parseInt(document.getElementById(`life-${seat}`).value);
  const cmd = parseInt(document.getElementById(`cmd-${seat}`).value);
  const stat = document.getElementById(`stat-${seat}`).value;

  const refPath = `rooms/${roomId}/players/${name}`;
  update(ref(db, refPath), {
    life, commander: cmd, status: stat
  });

  if (clickSound) clickSound.play();
};

// 💬 CHAT
const chatRef = ref(db, `rooms/${roomId}/chat`);
window.sendChat = () => {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;
  push(chatRef, {
    name: displayName,
    text: msg,
    time: new Date().toLocaleTimeString()
  });
  input.value = "";
  if (clickSound) clickSound.play();
};

function toggleChat() {
  const panel = document.getElementById("chatPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
}

onValue(chatRef, (snap) => {
  const log = document.getElementById("chatLog");
  log.innerHTML = "";
  snap.forEach((m) => {
    const { name, text } = m.val();
    log.innerHTML += `<p><strong>${name}:</strong> ${text}</p>`;
  });
});
