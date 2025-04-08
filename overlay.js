import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzvVpMCdg3Y6i5vCGWarorcTmzBzjmPow",
  authDomain: "tableforge-app.firebaseapp.com",
  databaseURL: "https://tableforge-app-default-rtdb.firebaseio.com",
  projectId: "tableforge-app",
  storageBucket: "tableforge-app.appspot.com",
  messagingSenderId: "708497363618",
  appId: "1:708497363618:web:39da060b48681944923dfb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const roomId = new URLSearchParams(window.location.search).get("room");

const playersRef = ref(db, `rooms/${roomId}/players`);
onValue(playersRef, (snapshot) => {
  const container = document.getElementById("playerPanels");
  container.innerHTML = "";
  const players = snapshot.val();
  if (players) {
    Object.entries(players).forEach(([_, player]) => {
      container.innerHTML += `
        <div style="
          border: 2px solid #ffa500;
          padding: 1em;
          min-width: 150px;
          text-align: center;
          background: #222;
        ">
          <h3>${player.name}</h3>
          <p>Life: ${player.life}</p>
          <p>Status: ${player.ready ? "Ready" : "Waiting"}</p>
        </div>
      `;
    });
  }
});
