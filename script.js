
import { app, db } from './firebase.js';
import { collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-lite.js";

window.createRoom = async function() {
  const code = "room" + Math.floor(Math.random() * 10000);
  await setDoc(doc(collection(db, "rooms"), code), { created: Date.now() });
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
