export async function setupAVMesh(players, currentName, roomId) {
  console.log("🔌 Setting up AV mesh for", currentName, "in", roomId);
  const player = players.find(p => p.name === currentName);
  if (!player) return console.warn("Player not found:", currentName);

  const videoEl = document.getElementById(`video-${player.seat}`);
  if (!videoEl) return console.warn("🎥 Local video slot not found");

  const dropdownId = `cam-select-${player.seat}`;

  // Create dropdown
  const dropdown = document.createElement("select");
  dropdown.id = dropdownId;
  dropdown.style.marginTop = "6px";

  // Add to UI
  const uiBox = document.querySelector(`#seat-${player.seat} .player-ui`);
  if (uiBox) uiBox.appendChild(dropdown);

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === "videoinput");

    const savedDeviceId = localStorage.getItem("preferredCamera");
    videoInputs.forEach(device => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `Camera ${dropdown.length + 1}`;
      dropdown.appendChild(option);

      if (device.deviceId === savedDeviceId) {
        option.selected = true;
      }
    });

    // Setup initial stream
    const selectedId = dropdown.value || videoInputs[0]?.deviceId;
    if (selectedId) {
      startStream(selectedId, videoEl);
    }

    // Handle dropdown change
    dropdown.addEventListener("change", () => {
      const selectedDeviceId = dropdown.value;
      localStorage.setItem("preferredCamera", selectedDeviceId);
      startStream(selectedDeviceId, videoEl);
    });
  } catch (err) {
    console.error("🎥 Could not access media devices:", err);
  }
}

function startStream(deviceId, videoEl) {
  navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: deviceId } },
    audio: true
  }).then(stream => {
    videoEl.srcObject = stream;
    videoEl.muted = true;
    console.log("🎥 Stream started with", deviceId);
  }).catch(err => {
    console.error("🎥 Failed to start stream:", err);
  });
}
