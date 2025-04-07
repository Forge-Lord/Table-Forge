// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "YOUR-KEY",
  authDomain: "YOUR-DOMAIN",
  databaseURL: "YOUR-DB",
  projectId: "YOUR-ID",
  storageBucket: "YOUR-BUCKET",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.createRoom = function () {
  const roomCode = "room-" + Math.random().toString(36).substr(2, 4);
  window.location.href = `lobby.html?room=${roomCode}`;
};// JS placeholder
