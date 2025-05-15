import { activityStorage } from '../utils/storage.js';

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

    // Data storage
    this.data = [
        { start: "01:45", end: "02:00" },
        { start: "02:00", end: "03:30" },
        { start: "04:30", end: "06:00" },
        { start: "09:15", end: "10:00" }
    ];
    this.totalDuration = 0;
    this.date = new Date().toISOString().split("T")[0];
  }

  // Initialize the visualization
  async init() {
    try {
      // Load data from storage
      const storedData = await activityStorage.getActivityData(this.date);
    
      // Process data if needed (convert to array format if different)
      this.data = storedData.activity_sessions || this.data;
      
      
      // Draw visualization
      this.drawSegments();
      this.drawHourLabels();
      this.updateCenterText();
    } catch (error) {
      console.error("Error initializing visualization:", error);
    }
  }

  // Process raw data into the required format
  processData(rawData) {
    // Example conversion - adjust based on your actual data structure
    return rawData.activity_sessions.map(session => ({
        start: session.start_time,
        end: session.end_time
    }));
  }

  // Convert time string to minutes
  timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
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

  // Calculate duration between two times
  getDurationInMinutes(start, end) {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (endMinutes >= startMinutes) {
      return endMinutes - startMinutes;
    } else {
      return (1440 - startMinutes) + endMinutes; // crosses midnight
    }
  }

  // Format duration in natural language
  formatDurationNatural(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours && mins) return `${hours}h ${mins}m`;
    if (hours) return `${hours}h`;
    if (mins) return `${mins}m`;
    return "0m";
  }

  // Draw all time segments
  drawSegments() {
    this.totalDuration = 0; // Reset total duration
    
    this.data.forEach(({ start_time, end_time }) => {
      const duration = this.getDurationInMinutes(start_time, end_time);
      this.totalDuration += duration;

      const startDeg = (this.timeToMinutes(start_time) / 1440) * 360;
      const endDeg = (this.timeToMinutes(end_time) / 1440) * 360;

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
        this.centerTextTime.textContent = this.formatDurationNatural(duration);
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
    this.centerTextTime.textContent = this.formatDurationNatural(this.totalDuration);
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
