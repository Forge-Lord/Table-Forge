let currentStream = null;
let currentVideo = null;

export async function setupAVMesh(players, currentName, roomId) {
  console.log("🔌 Setting up AV mesh for", currentName, "in", roomId);
  const player = players.find(p => p.name === currentName);
  if (!player) return console.warn("⚠️ Player not found:", currentName);

  const seat = player.seat;
  const videoEl = document.getElementById(`video-${seat}`);
  const uiBox = document.querySelector(`#seat-${seat} .player-ui`);

  if (!videoEl || !uiBox) {
    console.warn("❌ Missing elements for local player UI. Retrying...");
    setTimeout(() => setupAVMesh(players, currentName, roomId), 500);
    return;
  }

  currentVideo = videoEl;

  // === Device Selector ===
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

  dropdown.addEventListener("change", () => {
    const selectedId = dropdown.value;
    localStorage.setItem("preferredCamera", selectedId);
    startStream(selectedId, videoEl);
  });

  uiBox.appendChild(dropdown);

  // === Mic & Cam Toggles ===
  const micBtn = document.createElement("button");
  micBtn.textContent = "Mute Mic";
  micBtn.style.marginTop = "4px";
  micBtn.onclick = toggleMic;

  const camBtn = document.createElement("button");
  camBtn.textContent = "Pause Cam";
  camBtn.style.marginTop = "4px";
  camBtn.onclick = toggleCam;

  uiBox.appendChild(micBtn);
  uiBox.appendChild(camBtn);

  const startId = dropdown.value || videoInputs[0]?.deviceId;
  if (startId) startStream(startId, videoEl);
}

// === Start stream with specific cam ===
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
    videoEl.play();
    console.log("✅ Stream started with device:", deviceId);
  }).catch(err => {
    console.error("❌ Failed to start stream:", err);
  });
}

// === Toggle mic ===
window.toggleMic = function () {
  if (!currentStream) return;
  const track = currentStream.getAudioTracks()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  console.log(track.enabled ? "🎙️ Mic on" : "🔇 Mic muted");
};

// === Toggle cam ===
window.toggleCam = function () {
  if (!currentStream) return;
  const track = currentStream.getVideoTracks()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  console.log(track.enabled ? "📷 Cam on" : "📷 Cam paused");
};
