// av.js – Table Forge AV Sync (Fresh Start)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js"; import { getDatabase, ref, update, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow", authDomain: "tableforge-app.firebaseapp.com", projectId: "tableforge-app", databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app);

let localStream = null; let currentPlayer = null; let currentRoom = null; let peer = null;

function log(msg) { console.log("[Forge AV]", msg); }

export async function setupAVMesh(players, me, roomId) { currentPlayer = me; currentRoom = roomId;

const Peer = window.Peer; peer = new Peer(me);

peer.on('call', call => { log("Incoming call from " + call.peer); waitForStream(() => { call.answer(localStream); }); call.on('stream', stream => attachRemote(call.metadata?.seat || call.peer, stream)); });

peer.on('open', async id => { log("My peer ID: " + id); await update(ref(db, rooms/${roomId}/players/${me}), { peerId: id });

await delay(800);
players.forEach(p => {
  if (p.name !== me && p.peerId) {
    waitForStream(() => {
      const call = peer.call(p.peerId, localStream, { metadata: { seat: p.seat } });
      call.on('stream', stream => attachRemote(p.seat, stream));
    });
  }
});

}); }

async function initCamera(facing = "user") { try { localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: true }); const mySeat = findMySeat(); const video = await waitForVideo(mySeat); if (video) { video.srcObject = localStream; video.onloadedmetadata = () => video.play(); } } catch (err) { log("Camera error: " + err.message); } }

function attachRemote(seat, stream) { const vid = document.getElementById(video-${seat}); if (!vid) return retryAttach(seat, stream); vid.srcObject = stream; vid.onloadedmetadata = () => vid.play(); }

function retryAttach(seat, stream, tries = 0) { if (tries > 10) return; setTimeout(() => { const vid = document.getElementById(video-${seat}); if (vid) { vid.srcObject = stream; vid.play(); } else { retryAttach(seat, stream, tries + 1); } }, 300); }

function findMySeat() { const boxes = document.querySelectorAll('[id^="seat-"]'); for (const box of boxes) { if (box.innerHTML.includes(currentPlayer)) { return box.id.replace("seat-", ""); } } return "p1"; }

function waitForStream(cb, tries = 0) { if (localStream) return cb(); if (tries > 10) return; setTimeout(() => waitForStream(cb, tries + 1), 200); }

function waitForVideo(seat, tries = 0) { return new Promise(resolve => { const check = () => { const el = document.getElementById(video-${seat}); if (el) resolve(el); else if (tries > 10) resolve(null); else setTimeout(() => check(++tries), 200); }; check(); }); }

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

window.addEventListener("DOMContentLoaded", async () => { const facing = localStorage.getItem("cameraFacingMode") || "user"; currentPlayer = localStorage.getItem("displayName") || "Unknown"; currentRoom = new URLSearchParams(location.search).get("room"); await initCamera(facing); });

