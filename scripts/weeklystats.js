import { activityStorage } from "../utils/storage.js";


export class WeeklyStatsChart {
  constructor(containerId, options = {}) {
    this.canvasId = "weeklyChart";
    this.defaultOptions = {
      type: 'bar',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
      ...options
    };
    this.chart = null;
    this.container= document.getElementById(containerId)
  }

  async init() {
    try {
      const weeklyData = await this.fetchData();
      console.log("Weekly data:", weeklyData);
      
      // Check if data is empty (all zeros or undefined)
      if (this.isDataEmpty(weeklyData)) {
        this.showNoDataState();
      } else {
        this.renderChart(weeklyData);
      }
    } catch (error) {
      console.error('Error initializing weekly chart:', error);
      this.showErrorState();
    }
  }

  async fetchData() {
    const rawData = await activityStorage.getWeeklyData();
    return this.processData(rawData);
  }

  processData(rawData) {
    // Convert your storage format to chart-compatible format
    // Example: { Monday: { duration: 120 }, ... } → [120, ...]

    let data = {
      durations:  [],
      dates: []
    };
    rawData.forEach(entry => {
      data.durations.push(entry.data?.daily_summary.total_idle_seconds || 0);
      data.dates.push(entry.date || null);
    });
    return data;
  }

  isDataEmpty(data) {
    return !data || data.length === 0 || data.durations.every(item => !item || item === 0);
  }

  renderChart(data) {
    this.container.innerHTML = `<canvas id="${this.canvasId}"></canvas>`;

    const ctx = document.getElementById(this.canvasId);
    if (!ctx) {
      throw new Error(`Canvas element with ID ${this.canvasId} not found`);
    }

    this.chart = new Chart(ctx, {
      type: this.defaultOptions.type,
      data: {
        labels: data.dates, 
        datasets: [{
          label: 'Activity Duration',
          data: data.durations,
          backgroundColor: this.defaultOptions.backgroundColor,
          borderColor: this.defaultOptions.borderColor,
          borderWidth: this.defaultOptions.borderWidth
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Minutes'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const mins = Math.floor(context.raw / 60);
                const secs = context.raw % 60;
                return `${mins > 0 ? mins + 'm ' : ''}${secs}s`;
              }
            }
          }
        }
      }
    });
  }

  showNoDataState() {
    if (!this.container) return
    this.container.innerHTML = '';

    const message = document.createElement('div');
    message.className = 'no-data-message';
    message.textContent = this.defaultOptions.noDataText;

     message.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 300px; /* Ensure minimum height */
      width: 100%;
      color: #666;
      font-size: 1.2rem;
      font-style: italic;
      border-radius: 8px;
      border: 1px dashed #ddd;
    `;
    
    this.container.appendChild(message);
  }

  showErrorState() {
    const ctx = document.getElementById(this.canvasId);
    if (ctx) {
      ctx.innerHTML = '<p class="chart-error">Failed to load activity data</p>';
    }
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}