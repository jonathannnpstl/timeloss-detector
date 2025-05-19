import { activityStorage } from '../utils/storage.js';
import { formatDurationNatural } from '../utils/helpers.js';


export class DailyTimeCircle {
  constructor(containerId, options = {}) {
    // Configuration with defaults
    this.config = {
      radius: 140,
      centerX: 200,
      centerY: 200,
      strokeWidth: 30,
      strokeColor: '#4fc3f7',
      labelOffset: 25,
      ...options
    };

    // DOM elements
    this.container = document.getElementById(containerId);
    this.segments = document.getElementById("segments");
    this.labels = document.getElementById("labels");
    this.centerTextToday = document.querySelector(".today");
    this.centerTextTime = document.querySelector(".time");
    this.titleTextDay = document.querySelector(".title-day");
    this.titleTextDate = document.querySelector(".title-date");
    this.topIdleSessionContent = document.getElementById("topIdleSessionContent");

    // Data
    this.totalDuration = 0;
    this.date = new Date();
    this.daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  }

  // Initialize the visualization
  async init() {
    try {
      // Load data from storage
      const storedData = await activityStorage.getActivityData(this.date.toLocaleDateString());
    
      // Process data if needed (convert to array format if different)
      this.data = storedData.activity_sessions || this.data;

      // Set the date for the title
      this.titleTextDay.textContent = "Today is " + this.daysOfWeek[this.date.getDay()];

      this.drawSegments();
      this.drawHourLabels();
      this.updateCenterText();
      this.listTopIdleDurationSessions();
    } catch (error) {
      console.error("Error initializing visualization:", error);
    }
  }

  listTopIdleDurationSessions() {
    activityStorage.getTop5LongestIdleSessions(this.date.toLocaleDateString())
      .then(sessions => {
        // Process and display the top idle sessions
        const ul = document.createElement("ul");
        this.topIdleSessionContent.innerHTML = ""; // Clear previous content
        sessions.forEach(session => {
          const listItem = document.createElement("li");

          listItem.innerHTML = `<span class="time-range">${session.start_time} to ${session.end_time}</span> <span class="duration">(${formatDurationNatural((session.duration_seconds+1))})</span>`;
          ul.appendChild(listItem);
        });
        this.topIdleSessionContent.appendChild(ul);
      });
  }

  // Convert time string to minutes
  _timeToMinutes(timeStr) {
    const parts = timeStr.split(":").map(Number);
    const [h, m, s] = [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    return h * 60 + m;
  }

  // Convert polar coordinates to Cartesian
  polarToCartesian(radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: this.config.centerX + radius * Math.cos(angleInRadians),
      y: this.config.centerY + radius * Math.sin(angleInRadians)
    };
  }

  // Generate SVG path for an arc
  describeArc(startAngle, endAngle) {
    const start = this.polarToCartesian(this.config.radius, endAngle);
    const end = this.polarToCartesian(this.config.radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", start.x, start.y,
      "A", this.config.radius, this.config.radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  }

  // Calculate duration between two times in seconds (supports HH:MM:SS format)
  getDurationInSeconds(start, end) {
    const timeToSeconds = (timeStr) => {
      const parts = timeStr.split(":").map(Number);
      const [h, m, s] = [parts[0] || 0, parts[1] || 0, parts[2] || 0];
      return h * 3600 + m * 60 + s;
    };

    const startSeconds = timeToSeconds(start);
    const endSeconds = timeToSeconds(end);

    if (endSeconds >= startSeconds) {
      return endSeconds - startSeconds;
    } else {
      return (86400 - startSeconds) + endSeconds; // crosses midnight
    }
  }

  // Format duration in natural language
  

  // Draw all time segments
  drawSegments() {
    this.totalDuration = 0; // Reset total duration
    
    this.data.forEach(({ start_time, end_time }) => {
      const duration = this.getDurationInSeconds(start_time, end_time);
      this.totalDuration += duration;

      let startDeg = (this._timeToMinutes(start_time) / 1440) * 360;
      let endDeg = (this._timeToMinutes(end_time) / 1440) * 360;

      // If start_time and end_time are the same, give it a default 1 minute degree
      if (startDeg === endDeg) {
        endDeg = ((this._timeToMinutes(end_time) + 1) / 1440) * 360;
      }

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      
      path.setAttribute("d", this.describeArc(startDeg, endDeg));
      path.setAttribute("stroke", this.config.strokeColor);
      path.setAttribute("stroke-width", this.config.strokeWidth);
      path.setAttribute("fill", "none");
      path.classList.add("time-segment");
      
      title.textContent = `${start_time} - ${end_time}`;
      path.appendChild(title);

      // Add interactivity
      path.addEventListener('mouseenter', () => {
        this.centerTextToday.textContent = `${start_time} - ${end_time}`;
        this.centerTextTime.textContent = formatDurationNatural(duration);
      });
      
      path.addEventListener('mouseleave', () => {
        this.updateCenterText();
      });

      this.segments.appendChild(path);
    });
  }

  // Draw hour labels around the circle
  drawHourLabels() {
    for (let h = 0; h < 24; h++) {
      const angle = (h / 24) * 360;
      const pos = this.polarToCartesian(this.config.radius + this.config.labelOffset, angle);
      
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", pos.x);
      text.setAttribute("y", pos.y + 4);
      text.setAttribute("text-anchor", "middle");
      text.classList.add("hour-label");
      text.textContent = h === 0 ? "00" : h.toString().padStart(2, '0');
      
      this.labels.appendChild(text);
    }
  }

  // Update the center text with total duration
  updateCenterText() {
    this.centerTextToday.textContent = "Today";
    this.centerTextTime.textContent = formatDurationNatural(this.totalDuration);
  }

  // Public method to update data
  updateData(newData) {
    this.data = newData;
    this.clearVisualization();
    this.drawSegments();
    this.updateCenterText();
  }

  // Clear existing visualization
  clearVisualization() {
    this.segments.innerHTML = '';
    this.totalDuration = 0;
  }
}
