// chrome.storage.local.get("idleLog", ({ idleLog }) => {
//   const summary = document.getElementById("summary");
//   summary.innerHTML = idleLog ? Object.entries(idleLog || {}).map(([date, seconds]) =>
//     `<div><b>${date}</b>: ${Math.round(seconds / 60)} mins</div>`
//   ).join('') : 0;
// });


import { initializeVisualizations } from "../scripts/init.js";

document.addEventListener('DOMContentLoaded', () => {
  initializeVisualizations();

  setInterval(() => {
  chrome.runtime.sendMessage({ type: 'keepAlivePing' })
  
  .catch(() => {
    // This will help wake up the service worker if needed
  });
  console.log("Sending keep-alive ping");
}, 30000); // Every 30 seconds
});
