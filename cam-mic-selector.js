// cam-mic-selector.js
let selectedCamId = "";
let selectedMicId = "";

async function populateDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoSelect = document.getElementById("videoInput");
  const audioSelect = document.getElementById("audioInput");

  devices.forEach((device) => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.text = device.label || `${device.kind} ${videoSelect.length + 1}`;
    if (device.kind === "videoinput") {
      videoSelect.appendChild(option);
    } else if (device.kind === "audioinput") {
      audioSelect.appendChild(option);
    }
  });

  // Restore previous selections
  const storedCam = localStorage.getItem("selectedCamera");
  const storedMic = localStorage.getItem("selectedMic");
  if (storedCam) videoSelect.value = storedCam;
  if (storedMic) audioSelect.value = storedMic;
}

async function startPreview() {
  selectedCamId = document.getElementById("videoInput").value;
  selectedMicId = document.getElementById("audioInput").value;

  localStorage.setItem("selectedCamera", selectedCamId);
  localStorage.setItem("selectedMic", selectedMicId);

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: selectedCamId ? { exact: selectedCamId } : undefined },
    audio: { deviceId: selectedMicId ? { exact: selectedMicId } : undefined }
  });

  const preview = document.getElementById("camPreview");
  if (preview) {
    preview.srcObject = stream;
    preview.play();
  }
}
