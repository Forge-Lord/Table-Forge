// nav.js
export function renderNav() {
  const nav = document.createElement("nav");
  nav.style.cssText = `
    background: #222;
    padding: 10px 20px;
    display: flex;
    justify-content: center;
    gap: 20px;
    font-family: sans-serif;
  `;

  const links = [
    { label: "Home", href: "index.html" },
    { label: "Lobbies", href: "lobbies.html" },
    { label: "Lobby", href: "lobby.html" },
    { label: "Profile", href: "profile.html" }
  ];

  links.forEach(({ label, href }) => {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    a.style.cssText = `
      color: white;
      text-decoration: none;
      font-weight: bold;
    `;
    nav.appendChild(a);
  });

  const logout = document.createElement("button");
  logout.textContent = "Sign Out";
  logout.style.cssText = `
    margin-left: 40px;
    background: #444;
    color: white;
    border: none;
    padding: 6px 12px;
    cursor: pointer;
    border-radius: 6px;
  `;
  logout.onclick = () => {
    localStorage.clear();
    window.location.href = "/profile.html";
  };

  nav.appendChild(logout);
  document.body.prepend(nav);
}
