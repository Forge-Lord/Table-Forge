import app from './firebase.js';
function createRoom() {
  const code = 'room' + Math.floor(Math.random() * 10000);
  window.location.href = `lobby.html?room=${code}`;
}
function joinRoom() {
  const code = document.getElementById('roomCode').value.trim();
  if (code) window.location.href = `lobby.html?room=${code}`;
}