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
const clickSound = document.getElementById("clickSound");

// DOM refs
const overlay = document.getElementById("overlay");
const templateSelect = document.getElementById("templateSelect");

let template = "commander";
templateSelect.addEventListener("change", () => {
  template = templateSelect.value;
  loadOverlay();
});

// ---------------------
// COMMANDER OVERLAY UI
// ---------------------
const loadCommander = () => {
  overlay.innerHTML = `
    <h2>Commander Overlay</h2>
    <p>(Placeholder - future expansion continues here)</p>
  `;
};

// ---------------------
// YU-GI-OH! OVERLAY UI
// ---------------------
let life = 8000;
let lifeLog = [];

const loadYGO = () => {
  overlay.innerHTML = `
    <div style="text-align:center;">
      <h2>${displayName} - Life Points</h2>
      <input id="lifeInput" type="number" value="${life}" style="font-size:2em; width:100px; text-align:center;" />
      <div style="margin-top:1em;">
        <button onclick="updateLife()">Update</button>
        <button onclick="undoLife()">Undo</button>
        <button onclick="resetLife()">Reset</button>
      </div>
      <div style="margin-top:2em;">
        <h3>Life Log</h3>
        <ul id="lifeLog" style="max-height:200px; overflow-y:auto;"></ul>
      </div>
      <div style="margin-top:2em;">
        <h3>Card Lookup</h3>
        <input id="cardInput" placeholder="Search Yu-Gi-Oh! card..." />
        <button onclick="searchCard()">Search</button>
        <div id="cardResult" style="margin-top:1em;"></div>
      </div>
    </div>
  `;

  renderLog();
};

window.updateLife = () => {
  const newLife = parseInt(document.getElementById("lifeInput").value);
  if (newLife !== life) {
    lifeLog.push({ old: life, new: newLife, time: new Date().toLocaleTimeString() });
    life = newLife;
    renderLog();
    if (clickSound) clickSound.play();
  }
};

window.undoLife = () => {
  const last = lifeLog.pop();
  if (last) {
    life = last.old;
    document.getElementById("lifeInput").value = life;
    renderLog();
    if (clickSound) clickSound.play();
  }
};

window.resetLife = () => {
  lifeLog.push({ old: life, new: 8000, time: new Date().toLocaleTimeString() });
  life = 8000;
  document.getElementById("lifeInput").value = 8000;
  renderLog();
  if (clickSound) clickSound.play();
};

const renderLog = () => {
  const logEl = document.getElementById("lifeLog");
  if (!logEl) return;
  logEl.innerHTML = "";
  lifeLog.slice().reverse().forEach((entry) => {
    logEl.innerHTML += `<li>${entry.time} - ${entry.old} → ${entry.new}</li>`;
  });
};

// ---------------------
// CARD LOOKUP
// ---------------------
window.searchCard = () => {
  const query = document.getElementById("cardInput").value.trim();
  const output = document.getElementById("cardResult");
  output.innerHTML = "Searching...";

  // YGOProDeck fuzzy search
  fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      const card = data.data?.[0];
      if (card) {
        output.innerHTML = `
          <img src="${card.card_images[0].image_url}" style="width:100%;" />
          <p><strong>${card.name}</strong></p>
          <p style="font-size:0.9em;">${card.desc}</p>
        `;
        if (clickSound) clickSound.play();
      } else {
        output.innerHTML = "No card found.";
      }
    })
    .catch(err => {
      output.innerHTML = "Search error.";
      console.error(err);
    });
};

// ---------------------
const loadOverlay = () => {
  if (template === "commander") loadCommander();
  if (template === "yugioh") loadYGO();
};

loadOverlay();
