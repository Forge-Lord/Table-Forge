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

// 🔧 Firebase Config
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

// 🧑‍💻 PROFILE BUTTON
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

// 🔐 AUTH + BIND
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    displayName = localStorage.getItem("displayName") || "Unknown";
    document.getElementById("profileName").innerText = `Name: ${displayName}`;
    bindOverlay();
  } else {
    window.location.href = "profile.html";
  }
});

// 🔗 ROOM BINDING + PANEL LOGIC
function bindOverlay() {
  const playerRef = ref(db, `rooms/${roomId}/players/${displayName}`);
  onValue(playerRef, (snap) => {
    const pdata = snap.val();
    if (!pdata) return;
    if (pdata.isHost) isHost = true;

    const seat = pdata.seat || "p1";
    renderPanel(seat, pdata, true);
  });

  const playersRef = ref(db, `rooms/${roomId}/players`);
  onValue(playersRef, (snap) => {
    const players = snap.val();
    Object.entries(players || {}).forEach(([name, pdata]) => {
      if (name !== displayName) {
        const seat = pdata.seat || "p2";
        renderPanel(seat, pdata, false);
      }
    });
  });
}

// 🧱 PANEL RENDERING
function renderPanel(seat, player, isSelf) {
  const target = document.getElementById(seat);
  if (!target) return;

  const editable = isSelf || isHost;
  const borderColor = isSelf ? "#ffa500" : isHost ? "#00f5ff" : "#555";

  target.innerHTML = `
    <div style="background:#222; padding:1em; border:2px solid ${borderColor}; color:white;">
      <h3>${player.name}</h3>
      <p>Life: <input id="life-${seat}" value="${player.life || 40}" ${editable ? "" : "readonly"} /></p>
      <p>CMD: <input id="cmd-${seat}" value="${player.commander || 0}" ${editable ? "" : "readonly"} /></p>
      <p>Status: <input id="stat-${seat}" value="${player.status || ""}" ${editable ? "" : "readonly"} /></p>
      ${editable ? `<button onclick="save('${seat}', '${player.name}')">Save</button>` : ""}
    </div>
  `;
}

// 💾 SAVE PANEL
window.save = (seat, name) => {
  const life = parseInt(document.getElementById(`life-${seat}`).value);
  const cmd = parseInt(document.getElementById(`cmd-${seat}`).value);
  const stat = document.getElementById(`stat-${seat}`).value;

  update(ref(db, `rooms/${roomId}/players/${name}`), {
    life, commander: cmd, status: stat
  });

  if (clickSound) clickSound.play();
};

// 💬 CHAT PANEL
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

window.toggleChat = () => {
  const panel = document.getElementById("chatPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
};

onValue(chatRef, (snap) => {
  const log = document.getElementById("chatLog");
  log.innerHTML = "";
  snap.forEach((m) => {
    const { name, text } = m.val();
    log.innerHTML += `<p><strong>${name}:</strong> ${text}</p>`;
  });
});
