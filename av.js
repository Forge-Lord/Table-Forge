export function setupAVMesh(players, currentName, roomId) {
  console.log("🔌 Setting up AV mesh for", currentName, "in", roomId);
  const localVideo = document.getElementById(`video-${players.find(p => p.name === currentName)?.seat}`);
  if (!localVideo) {
    console.warn("🎥 Local video slot not found");
    return;
  }

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: localStorage.getItem("cameraFacingMode") || "user" },
    audio: true
  }).then(stream => {
    localVideo.srcObject = stream;
    localVideo.muted = true;

    // Skipping remote peer logic (future step)
    console.log("🎥 Local stream ready");
  }).catch(err => {
    console.error("🎥 AV capture failed:", err);
  });
}
