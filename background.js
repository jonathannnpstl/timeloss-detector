/** 
each day should track the duration of idleness
as well as the duration of browser open

so, there are horizontal bars side by side to
visually compare the two


TO ADD:
so there should be this circular graph, 
this represents to hours/time in a day.
And particular portion of the graph are
shaded by particular color, representing 
the duration of web open and idleness,
with respect to time
 * 
 */



let activeTabId = null;
let tabStartTime = null;

let switchCount = 0;
let falseStartCount = 0;
let idleEpisodeCount = 0;
let totalIdleDuration = 0;
let idleStartTime = null;

// const FALSE_START_THRESHOLD = 30 * 1000; // 30 sec

// function updateDailyStats(key, value) {
//   const today = new Date().toISOString().slice(0, 10);
//   chrome.storage.local.get(["history"], (data) => {
//     const history = data.history || {};
//     const todayStats = history[today] || { switches: 0, idleEpisodes: 0, idleDuration: 0, state: "" };

//     if (key === "switch") todayStats.switches += value;
//     if (key === "idleEpisode") todayStats.idleEpisodes += value;
//     if (key === "idleDuration") todayStats.idleDuration += value;
//     if (key === "state") todayStats.state = value;


//     history[today] = todayStats;
//     chrome.storage.local.set({ history });
//   });
// }

// // Tab switches + false starts
// chrome.tabs.onActivated.addListener((activeInfo) => {
//   const now = Date.now();

//   if (activeTabId !== null && activeTabId !== activeInfo.tabId) {
//     switchCount++;
//     chrome.storage.local.set({ switchCount });
//     updateDailyStats("switch", 1);
//   }

//   if (activeTabId !== null && tabStartTime !== null) {
//     const timeSpent = now - tabStartTime;

//     if (timeSpent < FALSE_START_THRESHOLD) {
//       chrome.tabs.get(activeTabId, (tab) => {
//         if (chrome.runtime.lastError || !tab) return;

//         const url = tab.url;
//         falseStartCount++;

//         chrome.storage.local.get(["falseStartURLs"], (data) => {
//           const urls = data.falseStartURLs || [];
//           urls.push({ url, time: new Date().toISOString() });

//           chrome.storage.local.set({
//             falseStartCount,
//             falseStartURLs: urls
//           });
//         });
//       });
//     }
//   }

//   activeTabId = activeInfo.tabId;
//   tabStartTime = now;
// });


chrome.runtime.onStartup.addListener(() => {
    console.log("🌅 Extension started");
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("🔧 Extension installed");
});


chrome.runtime.onConnect.addListener((port) => {
    console.log("Connected to content script:", port.name);
    port.onMessage.addListener((msg) => {
      if (msg.type == "idle-status") {
        console.log("Status from content script:", msg.status);
        const now = Date.now()
        const today = new Date().toISOString().split("T")[0]

        if (msg.status == "idle") {
              idleStartTime = now;
              console.log("User is idle...");
            }

            if (msg.status === "active" && idleStartTime !== null) {
              
              const idleTime = now - idleStartTime;
              totalIdleDuration += idleTime;
              idleStartTime = null;
              
              
              // store daily idle duration
              chrome.storage.local.get(["dailyIdleTimes"], (data) => {
                const daily = data.dailyIdleTimes || {};
                daily[today] = (daily[today] || 0) + idleDuration;
                
                chrome.storage.local.set({
                  totalIdleDuration,
                  dailyIdleTimes: daily,
                });
                
                console.log(`Idle time today: ${Math.round(daily[today] / 1000)}s`);
                console.log(`Total idle: ${Math.round(totalIdleDuration / 1000)}s`);
              });
              

              // store overall idle duration
              chrome.storage.local.set({ totalIdleDuration });
              console.log(`User was idle for ${Math.round(idleTime / 1000)} seconds`);
              console.log(`Total idle time: ${Math.round(totalIdleDuration / 1000)} seconds`);
            }

            // store the current status: active | idle
            chrome.storage.local.set({ currentIdleState: msg.status });
        }

        
  
    });

    port.postMessage({ greeting: "Hello from background!" });
  
    port.onDisconnect.addListener(() => {
      console.log("Content script disconnected");
    });
  });
  
  