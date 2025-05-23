import { activityStorage } from '../utils/storage.js';
import { formatDurationNatural } from '../utils/helpers.js';
import { formatDateReadable } from '../utils/helpers.js';

export class AllTimeStats {

    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.chartContainer = document.getElementById("allTimeStatsChartContent");
        this.canvasId = "allTimeChart"
        this.totalSessions = 0;
        this.totalIdleTime = 0;
        this.averageIdleTime = 0;
        this.mostIdleDay = null;
        this.allTimeData = null;
        this.totalIdleTimeContainer = document.getElementById('totalIdleTime');
        this.averageIdleTimeContainer = document.getElementById('averageIdleTime');
        this.mostActiveDayContainer = document.getElementById('mostInactiveDay');
        this.chart = null;
        this.options = {
            noDataText: 'No data available for all time',
            errorText: 'Error loading data',
            ...options
        };
    }

    async init() {
        try {
            this.allTimeData = await activityStorage.getAllActivityData();
            this.totalIdleTime = this._computeTotalIdleTime();
            this.averageIdleTime = this._computeAverageIdleTime();
            this.mostIdleDay = this._mostIdleDay();
            if (this.isDataEmpty(this.allTimeData)) {
                this.showNoDataState();
                return;
            }
            this._updateUI();

        } catch (error) {
            console.error('Error initializing all-time stats:', error);
        }
    }

    isDataEmpty(data) {
        return !data || Object.keys(data).length === 0 || Object.values(data).every(item => !item || item === 0);
    }

    _computeTotalIdleTime() {
        if (!this.allTimeData) return 0;
        let totalIdle = 0;
        for (const date in this.allTimeData) {
            if (this.allTimeData[date] && this.allTimeData[date].daily_summary && typeof this.allTimeData[date].daily_summary.total_idle_seconds === 'number') {
                totalIdle += this.allTimeData[date].daily_summary.total_idle_seconds;
            }
        }
        return totalIdle;
    }

    _computeAverageIdleTime() {
        if (!this.allTimeData) return 0;
        return this.totalIdleTime / Object.keys(this.allTimeData).length;
    }

    _mostIdleDay() {
        if (!this.allTimeData) return null;
        let mostIdle = { date: null, totalIdle: 0 };
        for (const date in this.allTimeData) {
            if (this.allTimeData[date] && this.allTimeData[date].daily_summary && typeof this.allTimeData[date].daily_summary.total_idle_seconds === 'number') {
                if (this.allTimeData[date].daily_summary.total_idle_seconds > mostIdle.totalIdle) {
                    mostIdle.date = date;
                    mostIdle.totalIdle = this.allTimeData[date].daily_summary.total_idle_seconds;
                }
            }
        }
        return mostIdle;
    }

    _updateUI() {
        if (this.totalIdleTimeContainer) {
            this.totalIdleTimeContainer.textContent = `${formatDurationNatural(this.totalIdleTime)}`;
        }
        if (this.averageIdleTimeContainer) {
            this.averageIdleTimeContainer.textContent = `${formatDurationNatural(this.averageIdleTime)}`;
        }
        if (this.mostActiveDayContainer) {
            this.mostActiveDayContainer.textContent = `${formatDateReadable(this.mostIdleDay.date)} (${formatDurationNatural(this.mostIdleDay.totalIdle)})`;
        }
    }

    showNoDataState() {
        this.container.innerHTML = `<p>${this.options.noDataText}</p>`;
    }

    destroy() {
        if (this.chart) {
        this.chart.destroy();
        }
    }


}