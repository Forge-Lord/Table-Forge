// script.js
import { db } from './firebase.js';
import { ref, set, onValue } from "firebase/database";

window.createRoom = function () {
  const roomCode = "room" + Math.floor(Math.random() * 10000);
  set(ref(db, 'rooms/' + roomCode), {
    createdAt: Date.now()
  }).then(() => {
    window.location.href = `lobby.html?room=${roomCode}`;
  });
};

window.joinRoom = function () {
  const code = document.getElementById('joinCode').value.trim();
  if (!code) return alert("Please enter a valid room code.");

  const roomRef = ref(db, 'rooms/' + code);
  onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      window.location.href = `lobby.html?room=${code}`;
    } else {
      alert("Room not found.");
    }
  }, { onlyOnce: true });
};
