import {
  getDatabase, ref, push, set, onValue, get, update
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";

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

let currentRoom = null;
let isHost = false;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("You must be logged in");
    window.location.href = "/profile.html";
    return;
  }

  const currentUser = user;

  // ✅ CREATE ROOM
  window.createRoom = async function () {
    try {
      const roomName = document.getElementById("roomName").value || randomRoomName();
      const template = document.getElementById("template").value;
      const playerCount = parseInt(document.getElementById("playerCount").value);
      const roomCode = `room-${roomName.replace(/\s+/g, '').toLowerCase()}`;

      const players = {};
      for (let i = 1; i <= playerCount; i++) {
        players[`P${i}`] = i === 1 ? {
          name: currentUser.email,
          life: 40,
          status: ""
        } : {};
      }

      const roomData = {
        host: currentUser.email,
        template,
        playerCount,
        started: false,
        players
      };

      console.log("🛠️ Creating room:", roomCode);
      console.log("Data to write:", roomData);

      await set(ref(db, `rooms/${roomCode}`), roomData);

      localStorage.setItem("mySeat", "P1");
      localStorage.setItem("roomCode", roomCode);

      isHost = true;
      currentRoom = roomCode;

      console.log("✅ Room created successfully!");
      enterLobby(roomCode);
    } catch (err) {
      console.error("❌ Room creation failed:", err.message);
      alert("Room creation failed: " + err.message);
    }
  };

  // ✅ JOIN ROOM
  window.joinRoom = async function () {
    const code = document.getElementById("roomCode").value.trim();
    if (!code) return alert("Enter a room code");

    const roomRef = ref(db, `rooms/${code}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return alert("Room not found.");

    const roomData = snap.val();
    const players = roomData.players || {};
    let seat = null;

    for (let i = 1; i <= roomData.playerCount; i++) {
      const slot = `P${i}`;
      if (!players[slot] || !players[slot].name) {
        seat = slot;
        break;
      }
    }

    if (!seat) return alert("Room is full.");

    const updates = {};
    updates[`rooms/${code}/players/${seat}`] = {
      name: currentUser.email,
      life: 40,
      status: ""
    };
    await update(ref(db), updates);

    localStorage.setItem("mySeat", seat);
    localStorage.setItem("roomCode", code);

    isHost = (roomData.host === currentUser.email);
    currentRoom = code;

    enterLobby(code);
  };

  // ✅ ENTER LOBBY
  function enterLobby(code) {
    document.getElementById("preGame").style.display = "none";
    document.getElementById("lobbyView").style.display = "block";
    document.getElementById("roomDisplay").textContent = code;

    if (isHost) {
      document.getElementById("startGameBtn").style.display = "inline-block";
    }

    const playersRef = ref(db, `rooms/${code}/players`);
    onValue(playersRef, (snapshot) => {
      const container = document.getElementById("playerList");
      container.innerHTML = "";
      snapshot.forEach((child) => {
        const p = child.val();
        if (p?.name) {
          const div = document.createElement("div");
          div.className = "player-entry";
          div.textContent = `${child.key}: ${p.name}`;
          container.appendChild(div);
        }
      });
    });
  }

  // ✅ START GAME
  window.startGame = function () {
    const code = localStorage.getItem("roomCode");
    update(ref(db, `rooms/${code}`), { started: true });
    window.location.href = `overlay.html?room=${code}`;
  };

});

// 🧠 Utility
function randomRoomName() {
  const words = ["blaze", "anvil", "ember", "spark", "forge", "fire", "core"];
  return words[Math.floor(Math.random() * words.length)] + "-" + Math.floor(Math.random() * 1000);
}
