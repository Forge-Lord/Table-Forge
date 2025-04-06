function joinRoom() {
  const room = document.getElementById('roomInput').value.trim();
  if (room) {
    alert('Joining room: ' + room);
  } else {
    alert('Please enter a room code.');
  }
}

function createRoom() {
  const room = document.getElementById('roomInput').value.trim();
  if (room) {
    alert('Creating room: ' + room);
  } else {
    alert('Please enter a new room code to create.');
  }
}