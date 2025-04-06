
import { app, db } from './firebase.js';
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

window.createRoom = function() {
  const code = "room" + Math.floor(Math.random() * 10000);
  window.location.href = `lobby.html?room=${code}`;
};

window.joinRoom = function() {
  const code = document.getElementById("roomCode").value.trim();
  if (code) {
    window.location.href = `lobby.html?room=${code}`;
  } else {
    alert("Please enter a room code.");
  }
};
