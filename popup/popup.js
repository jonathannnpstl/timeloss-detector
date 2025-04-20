document.addEventListener("DOMContentLoaded", () => {

    
    chrome.storage.local.get(
      ["switchCount", "idleEpisodeCount", "totalIdleDuration", "falseStartCount", "falseStartURLs", "currentIdleState"],
      (data) => {
        document.getElementById("switchCount").textContent = data.switchCount || 0;
        document.getElementById("idleEpisodes").textContent = data.idleEpisodeCount || 0;
        document.getElementById("idleTime").textContent = ((data.totalIdleDuration || 0) / 1000).toFixed(1);
        document.getElementById("falseStarts").textContent = data.falseStartCount || 0;
        document.getElementById("idleStatus").textContent = data.currentIdleState || "Unknown";


  
        const urlList = document.getElementById("falseStartURLs");
        (data.falseStartURLs || []).forEach(entry => {
          const li = document.createElement("li");
          li.textContent = `${entry.url} @ ${entry.time}`;
          urlList.appendChild(li);
        });
      }
    );

    ///faasdasdasdasdasdadsad/////
    const svg = document.getElementById("clockSVG");
    const centerX = 200, centerY = 200;
    const radius = 150;
    const ringWidth = 20;
  
    // Example segments: startHour, endHour, type
    const segments = [
      { start: 1, end: 3, type: "idle" },
      { start: 5, end: 8, type: "active" },
      { start: 13, end: 14.5, type: "idle" },
      { start: 17, end: 20, type: "active" },
    ];
  
    const colors = {
      idle: "#cba0ff",
      active: "#4dabf7"
    };
  
    // Background ring
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bg.setAttribute("cx", centerX);
    bg.setAttribute("cy", centerY);
    bg.setAttribute("r", radius);
    bg.setAttribute("stroke", "#333");
    bg.setAttribute("stroke-width", ringWidth);
    bg.setAttribute("fill", "none");
    svg.appendChild(bg);
  
    // Draw segments
    segments.forEach(({ start, end, type }) => {
      const startAngle = (start / 24) * 2 * Math.PI - Math.PI / 2;
      const endAngle = (end / 24) * 2 * Math.PI - Math.PI / 2;
      const largeArc = (end - start) > 12 ? 1 : 0;
  
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
  
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const d = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
      ].join(" ");
  
      path.setAttribute("d", d);
      path.setAttribute("stroke", colors[type] || "gray");
      path.setAttribute("stroke-width", ringWidth);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      svg.appendChild(path);
    });
  
    // Add hour labels (1 to 24)
    for (let h = 0; h < 24; h++) {
      const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
      const labelRadius = radius + 15;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x);
      label.setAttribute("y", y);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "middle");
      label.textContent = h;
      svg.appendChild(label);
    }
  });
  
