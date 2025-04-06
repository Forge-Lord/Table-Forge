import { db } from './firebase.js';
import { collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

function createRoom() {
  const code = "room" + Math.floor(Math.random() * 10000);
  setDoc(doc(collection(db, "rooms"), code), { created: true });
  window.location.href = "lobby.html?room=" + code;
}

function joinRoom() {
  const code = document.getElementById('roomCode').value.trim();
  if (code) {
    window.location.href = "lobby.html?room=" + code;
  }
}

window.createRoom = createRoom;
window.joinRoom = joinRoom;
