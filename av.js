let currentStream = null;

export async function setupAVMesh(players, currentName, roomId) {
  console.log("🔌 Setting up AV mesh for", currentName, "in", roomId);
  const player = players.find(p => p.name === currentName);
  if (!player) return console.warn("Player not found:", currentName);

  const seat = player.seat;
  const videoEl = document.getElementById(`video-${seat}`);
  if (!videoEl) return console.warn("🎥 Local video slot not found");

  const uiBox = document.querySelector(`#seat-${seat} .player-ui`);
  if (!uiBox) return console.warn("UI box not found");

  // --- Camera Dropdown ---
  const dropdown = document.createElement("select");
  dropdown.style.marginTop = "6px";
  dropdown.style.fontSize = "12px";

  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoInputs = devices.filter(d => d.kind === "videoinput");

  const savedDeviceId = localStorage.getItem("preferredCamera");
  videoInputs.forEach(device => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.text = device.label || `Camera ${dropdown.length + 1}`;
    if (device.deviceId === savedDeviceId) option.selected = true;
    dropdown.appendChild(option);
  });

  uiBox.appendChild(dropdown);

  dropdown.addEventListener("change", () => {
    const selectedDeviceId = dropdown.value;
    localStorage.setItem("preferredCamera", selectedDeviceId);
    startStream(selectedDeviceId, videoEl);
  });

  // --- Control Buttons ---
  const micBtn = document.createElement("button");
  micBtn.textContent = "Mute";
  micBtn.style.marginTop = "4px";
  micBtn.onclick = toggleMic;

  const camBtn = document.createElement("button");
  camBtn.textContent = "Pause Cam";
  camBtn.style.marginTop = "4px";
  camBtn.onclick = toggleCam;

  uiBox.appendChild(micBtn);
  uiBox.appendChild(camBtn);

  // --- Start with saved or first cam ---
  const initialId = dropdown.value || videoInputs[0]?.deviceId;
  if (initialId) startStream(initialId, videoEl);
}

function startStream(deviceId, videoEl) {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: deviceId } },
    audio: true
  }).then(stream => {
    currentStream = stream;
    videoEl.srcObject = stream;
    videoEl.muted = true;
    console.log("🎥 Stream started");
  }).catch(err => {
    console.error("🎥 Failed to start stream:", err);
  });
}

// --- Toggle Microphone ---
window.toggleMic = function () {
  if (!currentStream) return;
  const audioTrack = currentStream.getAudioTracks()[0];
  if (!audioTrack) return;
  audioTrack.enabled = !audioTrack.enabled;
  console.log(audioTrack.enabled ? "🎤 Mic unmuted" : "🔇 Mic muted");
};

// --- Toggle Camera Video ---
window.toggleCam = function () {
  if (!currentStream) return;
  const videoTrack = currentStream.getVideoTracks()[0];
  if (!videoTrack) return;
  videoTrack.enabled = !videoTrack.enabled;
  console.log(videoTrack.enabled ? "📷 Cam resumed" : "📷 Cam paused");
};
