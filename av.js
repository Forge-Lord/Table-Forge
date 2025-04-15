const peers = {};
let localStream = null;

async function getLocalStream() {
  if (localStream) return localStream;
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  return localStream;
}

export async function setupAVMesh(players, currentName, roomId) {
  const stream = await getLocalStream();

  players.forEach(player => {
    const seat = player.seat;
    const name = player.name;
    const videoEl = document.getElementById(`video-${seat}`);
    if (!videoEl) return;

    if (name === currentName) {
      videoEl.srcObject = stream;
    } else {
      if (!peers[name]) {
        // Simulate remote stream for now (will be replaced by true WebRTC soon)
        videoEl.srcObject = stream;
        peers[name] = true;
      }
    }
  });
}

window.toggleMic = () => {
  if (!localStream) return;
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
};

window.toggleCam = () => {
  if (!localStream) return;
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
};
