// This will be the core logic in overlay.js for adaptive, game-aware overlays // It detects the game template and player count and injects the proper layout logic

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, get, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"; import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"; import SimplePeer from "https://cdn.skypack.dev/simple-peer";

const firebaseConfig = { /* your config */ }; const app = initializeApp(firebaseConfig); const db = getDatabase(app); const auth = getAuth(app);

const roomCode = new URLSearchParams(window.location.search).get("room"); const mySeat = localStorage.getItem("mySeat"); const selectedCamera = localStorage.getItem("selectedCamera"); const selectedMic = localStorage.getItem("selectedMic");

let localStream; let peers = {};

onAuthStateChanged(auth, async (user) => { if (!user || !roomCode || !mySeat) return (window.location.href = "/profile.html");

const name = localStorage.getItem("displayName") || user.displayName || user.email;

const roomRef = ref(db, rooms/${roomCode}); const snap = await get(roomRef); const roomData = snap.val();

const template = roomData.template; const playerCount = roomData.playerCount;

setupGridLayout(playerCount); await startCamera(); setupMySeat(mySeat, name);

// Inject template-specific logic if (template === "commander") injectCommanderUI(); else if (template === "yugioh") injectYGOUI(); else if (template === "digimon") injectDigimonUI(); else injectDefaultUI();

syncWithPeers(roomData.players); });

function setupGridLayout(playerCount) { const grid = document.querySelector(".overlay-grid"); if (playerCount === 2) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr"; hideSeats(["P3", "P4"]); } else if (playerCount === 3) { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr 1fr"; hideSeats(["P4"]); } else { grid.style.gridTemplateRows = "1fr 1fr"; grid.style.gridTemplateColumns = "1fr 1fr"; } }

async function startCamera() { try { localStream = await navigator.mediaDevices.getUserMedia({ video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true, audio: selectedMic ? { deviceId: { exact: selectedMic } } : true }); } catch (e) { alert("Please enable camera/mic."); console.error(e); } }

function setupMySeat(seat, name) { const box = document.getElementById(seat); const vid = box.querySelector("video"); if (vid) { vid.srcObject = localStream; vid.muted = true; vid.play(); } box.querySelector(".name").textContent = name; }

function hideSeats(seats) { seats.forEach(s => { const el = document.getElementById(s); if (el) el.style.display = "none"; }); }

function injectCommanderUI() { console.log("Injecting Commander overlay"); // life total UI is already default }

function injectYGOUI() { console.log("Injecting Yu-Gi-Oh! overlay"); document.querySelectorAll(".life").forEach(el => el.textContent = "8000"); }

function injectDigimonUI() { console.log("Injecting Digimon overlay"); const memory = document.createElement("div"); memory.id = "memoryBar"; memory.style.cssText = position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; background: #333; border: 2px solid #888; border-radius: 12px; overflow: hidden; z-index: 5;; for (let i = 10; i >= -10; i--) { const seg = document.createElement("div"); seg.textContent = i; seg.style.cssText = padding: 8px; min-width: 32px; text-align: center; color: white; background: ${i === 0 ? '#444' : '#222'}; cursor: pointer;; seg.onclick = () => document.querySelectorAll("#memoryBar div").forEach((el, idx) => { el.style.background = (el.textContent == i) ? '#0ff' : (el.textContent == '0' ? '#444' : '#222'); }); memory.appendChild(seg); } document.body.appendChild(memory); }

function injectDefaultUI() { console.log("Using default UI layout."); }

function syncWithPeers(players) { console.log("Connecting peers:", players); // Hook in SimplePeer and Firebase signaling logic (you’ve already built this part) }

