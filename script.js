import { db, doc, getDoc, setDoc, updateDoc, onSnapshot } from './firebase.js';

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || "roomforge";
const roomRef = doc(db, "rooms", roomId);
let currentSeat = "";

function joinLobby() {
  const name = document.getElementById("displayName").value || "Anonymous";
  getDoc(roomRef).then(async (snap) => {
    let data = snap.data();
    if (!data) {
      await setDoc(roomRef, { players: {} });
      data = { players: {} };
    }
    const seats = ["P1", "P2", "P3", "P4"];
    for (const seat of seats) {
      if (!data.players[seat]) {
        currentSeat = seat;
        await updateDoc(roomRef, { [`players.${seat}`]: { name: name, ready: false } });
        break;
      }
    }
  });
}

function renderPlayers(data) {
  const box = document.getElementById("players");
  if (!box) return;
  box.innerHTML = "<h2>Players</h2>";
  for (const seat in data.players) {
    const p = data.players[seat];
    const div = document.createElement("div");
    div.textContent = `${seat}: ${p.name} ${p.ready ? "[Ready]" : "[Not Ready]"}`;
    box.appendChild(div);
  }
}

onSnapshot(roomRef, (doc) => {
  const data = doc.data();
  if (data && data.players) renderPlayers(data);
});
