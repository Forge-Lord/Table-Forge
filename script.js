import app from './firebase.js';
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const db = getDatabase(app);

window.createRoom = function () {
  const roomCode = "room" + Math.floor(Math.random() * 10000);
  set(ref(db, 'rooms/' + roomCode), {
    createdAt: Date.now()
  }).then(() => {
    window.location.href = `lobby.html?room=${roomCode}`;
  });
};

window.joinRoom = function () {
  const code = document.getElementById("roomCode").value.trim();
  if (code) {
    window.location.href = `lobby.html?room=${code}`;
  } else {
    alert("Please enter a room code.");
  }
};
