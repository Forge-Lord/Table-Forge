// nav.js – sync display name from localStorage

window.addEventListener("DOMContentLoaded", () => {
  const displayName = localStorage.getItem("displayName") || "";
  
  // Show name in nav slot
  const navSlot = document.getElementById("profileName");
  if (navSlot) navSlot.textContent = displayName;

  // Pre-fill join/create forms
  if (document.getElementById("name")) {
    document.getElementById("name").value = displayName;
  }
  if (document.getElementById("joinName")) {
    document.getElementById("joinName").value = displayName;
  }
});
