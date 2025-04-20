function main() {
  
  const port = chrome.runtime.connect({ name: "idle-tracker" });

  port.onMessage.addListener((msg) => {
    console.log("Received from background:", msg);
  });

  function sendStatus(status) {
    port.postMessage({ type: "idle-status", status });
  }

  // Debounce mechanism to limit message frequency
  let idleTimer;
  const IDLE_DELAY = 60000; // 1 minute

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    sendStatus("active");
    idleTimer = setTimeout(() => sendStatus("idle"), IDLE_DELAY);
  }

  ["mousemove", "keydown", "scroll", "click"].forEach((event) => {
    window.addEventListener(event, resetIdleTimer, { passive: true });
  });

  resetIdleTimer();
}

window.addEventListener("load", () => {

  function destructor() {
    // Destruction is needed only once
    document.removeEventListener(destructionEvent, destructor);
    // Tear down content script: Unbind events, clear timers, restore DOM, etc.
  }
  
  var destructionEvent = 'destructmyextension_' + chrome.runtime.id;
  // Unload previous content script if needed
  document.dispatchEvent(new CustomEvent(destructionEvent));
  document.addEventListener(destructionEvent, destructor);
  main();

});

