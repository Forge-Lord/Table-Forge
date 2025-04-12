import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"; import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", projectId: "tableforge-app", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com" }; const app = initializeApp(firebaseConfig); const db = getDatabase(app);

function makeCode(length = 5) { const chars = "abcdefghijklmnopqrstuvwxyz0123456789"; return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }

window.createRoom = async function () { const name = document.getElementById("name").value.trim(); const roomName = document.getElementById("roomName").value.trim(); const template = document.getElementById("template").value; const playerCount = document.getElementById("playerCount").value; if (!name) return alert("Please enter your name"); localStorage.setItem("displayName", name);

const roomId = "room-" + makeCode(); const roomRef = ref(db, rooms/${roomId});

await set(roomRef, { roomName: roomName || null, template, playerCount: parseInt(playerCount), host: name, started: false, players: { [name]: { name, life: template === "commander" ? 40 : 8000, commander: 0, status: "", seat: "p1" } } });

// Display room code to user before redirect alert(Room created! Room code: ${roomId}\nCopied to clipboard.); try { await navigator.clipboard.writeText(roomId); } catch (err) { console.warn("Clipboard write failed", err); }

window.location.href = /overlay.html?room=${roomId}; };

window.joinRoom = async function () { const name = document.getElementById("joinName").value.trim(); const code = document.getElementById("roomCode").value.trim(); if (!name || !code) return alert("Please enter name and room code"); localStorage.setItem("displayName", name);

const fullId = code.startsWith("room-") ? code : room-${code}; const roomSnap = await get(child(ref(db), rooms/${fullId})); if (!roomSnap.exists()) return alert("Room not found");

window.location.href = /overlay.html?room=${fullId}; };

