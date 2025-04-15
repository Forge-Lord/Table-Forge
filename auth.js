// auth.js – Login enforcement and logout control
export function requireLogin() {
  const name = localStorage.getItem("displayName");
  if (!name) {
    alert("🚫 You must register before entering the forge.");
    window.location.href = "/profile.html";
  }
}

export function logout() {
  localStorage.removeItem("displayName");
  window.location.href = "/profile.html";
}
