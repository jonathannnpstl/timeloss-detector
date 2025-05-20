import { activityStorage } from "../utils/storage.js";


export class WeeklyStatsChart {
  constructor(containerId, options = {}) {
    this.options = {
      type: 'bar',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
      noDataText: 'No data available for all time',
      errorText: 'Error loading data',
      ...options
    };
    this.container = document.getElementById(containerId);
    this.lineChart = null;
    this.barChart = null;
  }

  async init() {
    try {
      const rawData = await activityStorage.getWeeklyData();
      const weeklyBarChartData = this._processBarChartData(rawData);
      const weeklyLineChartData = this._processLineChartData(rawData);
      console.log(weeklyBarChartData, weeklyLineChartData);
      
      

      // Check if data is empty (all zeros or undefined)
      if (this.isDataEmpty(weeklyBarChartData)|| weeklyLineChartData.length === 0) {
        this.showNoDataState();
      } else {
        this.renderBarChart(weeklyBarChartData);
        this.renderLineChart(weeklyLineChartData);
      }
    } catch (error) {
      console.error('Error initializing weekly chart:', error);
    }
  }

  _processLineChartData(rawData) {
    // Aggregate hourly idle durations across all days
    if (!rawData || rawData.length === 0) return Array(24).fill(0);

    const hourlyTotals = Array(24).fill(0);
  
    rawData.forEach(entry => {
      const hours = entry.data?.hourly_activity || [];
      for (let i = 0; i < 24; i++) {
        hourlyTotals[i] += hours[i]?.idle_seconds || 0;
      }
    });

    hourlyTotals.forEach((value, index) => {
      hourlyTotals[index] = Math.floor(value / 60); // Convert seconds to minutes
    });
    return hourlyTotals;
  }

  _processBarChartData(rawData) {
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

  renderLineChart(lineChartData) {
    if (this.lineChart) {
      this.lineChart.destroy();
    }

    const canvas = document.createElement('canvas');
    canvas.id = 'weeklyLineChart';
    this.container.appendChild(canvas);

    const maxMinutes = Math.max(...lineChartData);
    if (maxMinutes === 0) {
        this.container.innerHTML = `<p>${this.options.noDataText}</p>`;
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
    throw new Error(`Canvas element with ID ${canvas.id} not found`);
    }

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
      labels: [...Array(24).keys()].map(h => h.toString().padStart(2, '0')), // '00' to '23'
      datasets: [{
          label: 'Idle Duration (minutes)',
          data: lineChartData,
          borderColor: 'rgba(30, 144, 255, 1)',
          backgroundColor: 'rgba(30, 144, 255, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: 'rgba(30, 144, 255, 1)'
      }]
      },
      options: {
      responsive: true,
      scales: {
          x: {
          title: {
              display: true,
              text: 'Hour of Day',
              color: '#ccc'
          },
          ticks: {
              color: '#ccc'
          },
          grid: {
              color: '#333'
          }
          },
          y: {
          title: {
              display: true,
              text: 'Idle Time (minutes)',
              color: '#ccc'
          },
          beginAtZero: true,
          max: 60,
          ticks: {
              color: '#ccc'
          },
          grid: {
              color: '#333'
          }
          }
      },
      plugins: {
          legend: {
          labels: {
              color: '#ccc'
          }
          },
          tooltip: {
          callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y} mins`
          }
          }
      }
    }
    });
  }

  renderBarChart(data) {

    if (this.barChart) {
      this.barChart.destroy();
    }


    const canvas = document.createElement('canvas');
    canvas.id = 'weeklyBarChart';
    this.container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error(`Canvas element with ID ${canvas.id} not found`);
    }

    this.barChart = new Chart(ctx, {
      type: this.options.type,
      data: {
        labels: data.dates, 
        datasets: [{
          label: 'Idle Duration',
          data: data.durations,
          backgroundColor: this.options.backgroundColor,
          borderColor: this.options.borderColor,
          borderWidth: this.options.borderWidth
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Seconds'
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
    message.textContent = this.options.noDataText;

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


  destroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}