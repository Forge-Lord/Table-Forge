window.createRoom = async function () {
  try {
    if (!currentUser || !currentUser.email) {
      alert("❌ Not logged in.");
      console.warn("Missing user or email:", currentUser);
      return;
    }

    const roomName = document.getElementById("roomName").value || randomRoomName();
    const template = document.getElementById("template").value;
    const playerCount = parseInt(document.getElementById("playerCount").value);
    const roomCode = `room-${roomName.replace(/\s+/g, '').toLowerCase()}`;

    const players = {};
    for (let i = 1; i <= playerCount; i++) {
      players[`P${i}`] = i === 1 ? {
        name: currentUser.email,
        life: 40,
        status: ""
      } : {};
    }

    const roomData = {
      host: currentUser.email,
      template,
      playerCount,
      started: false,
      players
    };

    console.log("🛠️ Creating room:", roomCode);
    console.log("Data to write:", roomData);

    await set(ref(db, `rooms/${roomCode}`), roomData);

    localStorage.setItem("mySeat", "P1");
    localStorage.setItem("roomCode", roomCode);

    isHost = true;
    currentRoom = roomCode;

    console.log("✅ Room created successfully!");
    enterLobby(roomCode);
  } catch (err) {
    console.error("❌ Room creation failed:", err.message);
    alert("Room creation failed: " + err.message);
  }
};
