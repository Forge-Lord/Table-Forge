export function setupAVMesh(players, currentName, roomId) {
  console.log("🔌 Setting up AV mesh for", currentName, "in", roomId);

  const player = players.find(p => p.name === currentName);
  const localVideo = document.getElementById(`video-${player?.seat}`);
  if (!localVideo) {
    console.warn("🎥 Local video slot not found");
    return;
  }

  const camSelectId = `cam-select-${player.seat}`;
  const muteBtnId = `mute-btn-${player.seat}`;
  const pauseBtnId = `pause-btn-${player.seat}`;

  // Camera and mic state
  let currentStream = null;
  let isMicMuted = false;
  let isCamPaused = false;

  // UI elements
  const camSelect = document.createElement("select");
  camSelect.id = camSelectId;
  camSelect.style.marginTop = "6px";

  const muteBtn = document.createElement("button");
  muteBtn.id = muteBtnId;
  muteBtn.textContent = "Mute Mic";

  const pauseBtn = document.createElement("button");
  pauseBtn.id = pauseBtnId;
  pauseBtn.textContent = "Pause Cam";

  localVideo.parentNode.appendChild(camSelect);
  localVideo.parentNode.appendChild(muteBtn);
  localVideo.parentNode.appendChild(pauseBtn);

  // Populate camera options
  navigator.mediaDevices.enumerateDevices().then(devices => {
    const videoInputs = devices.filter(d => d.kind === "videoinput");
    videoInputs.forEach(device => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${camSelect.length + 1}`;
      camSelect.appendChild(option);
    });

    // Select saved camera or default
    const savedCam = localStorage.getItem("preferredCamera");
    if (savedCam && [...camSelect.options].some(opt => opt.value === savedCam)) {
      camSelect.value = savedCam;
    }

    startStream(camSelect.value);
  });

  function startStream(deviceId) {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: true
    }).then(stream => {
      currentStream = stream;
      localVideo.srcObject = stream;
      localVideo.muted = true;
      localStorage.setItem("preferredCamera", deviceId);
      console.log("🎥 Stream started with", deviceId);
    }).catch(err => {
      console.error("❌ Error accessing camera/mic:", err);
    });
  }

  camSelect.addEventListener("change", () => {
    const selectedDevice = camSelect.value;
    startStream(selectedDevice);
  });

  muteBtn.addEventListener("click", () => {
    if (!currentStream) return;
    isMicMuted = !isMicMuted;
    currentStream.getAudioTracks().forEach(t => t.enabled = !isMicMuted);
    muteBtn.textContent = isMicMuted ? "Unmute Mic" : "Mute Mic";
  });

  pauseBtn.addEventListener("click", () => {
    if (!currentStream) return;
    isCamPaused = !isCamPaused;
    currentStream.getVideoTracks().forEach(t => t.enabled = !isCamPaused);
    pauseBtn.textContent = isCamPaused ? "Resume Cam" : "Pause Cam";
  });
}
