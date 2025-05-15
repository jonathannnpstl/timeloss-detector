/**
 * DATA MODEL
 * 
 *"date": "2023-11-15",
  "activity_sessions": [
    {
      "state": "active", // or "idle"
      "start_time": "2023-11-15T09:15:00Z",
      "end_time": "2023-11-15T09:30:00Z",
      "duration_seconds": 900
    },
    {
      "state": "idle",
      "start_time": "2023-11-15T09:30:00Z",
      "end_time": "2023-11-15T09:45:00Z",
      "duration_seconds": 900
    }
  ],
  "hourly_activity": [
    {"hour": 0, "idle_seconds": 3300},
    {"hour": 1, "idle_seconds": 3150}
  ]
  "daily_summary": {
    "total_active_seconds": 18000,
    "total_idle_seconds": 68400,
    "active_periods": 12
  }
 * 
 */

/**
 * Storage implementation for activity tracking data
 * 
 * This class manages the storage and retrieval of user activity data,
 * including idle time tracking across different hours of the day.
 * 
 * Data Structure:
 * {
 *   date: "YYYY-MM-DD",
 *   activity_sessions: [
 *     {
 *       state: "idle",
 *       start_time: "ISO_TIMESTAMP",
 *       end_time: "ISO_TIMESTAMP",
 *       duration_seconds: number
 *     }
 *   ],
 *   hourly_activity: [
 *     { hour: 0-23, idle_seconds: number },
 *     ...
 *   ],
 *   daily_summary: {
 *     total_idle_seconds: number,
 *   }
 * }
 */

class ActivityStorage {
  constructor() {
    this.storage = chrome.storage.local;
  }

  /**
   * Retrieves activity data for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} - Activity data for the date
   */
  async getActivityData(date) {
    return new Promise((resolve) => {
      this.storage.get([date], (result) => {
        resolve(result[date] || this._createEmptyDayData(date));
      });
    });
  }

  /** 
   * Retrieves all activity data from storage
   * @returns {Promise<Object>} - All activity data
   */
  async getAllActivityData() {
    return new Promise((resolve) => {
      this.storage.get(null, (result) => {
        resolve(result);
      });
    });
  }

  /**
   * Saves activity data for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} data - Activity data to save
   */
  async saveActivityData(date, data) {
    return new Promise((resolve) => {
      this.storage.set({ [date]: data }, () => resolve());
    });
  }

  /**
   * Adds a new activity session and updates related statistics
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} session - Activity session data
   */
  async addActivitySession(date, session) {
    const data = await this.getActivityData(date);
    
    data.activity_sessions.push(session);
    this._updateHourlyActivity(data, session);
    this._updateDailySummary(data);
    
    await this.saveActivityData(date, data);
  }

  /**
   * Creates an empty data structure for a new day
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Object} - Empty day data structure
   */
  _createEmptyDayData(date) {
    return {
      date,
      activity_sessions: [],
      hourly_activity: this._initializeHourlyActivity(),
      daily_summary: this._initializeDailySummary()
    };
  }

  /**
   * Creates an array of 24 hours with zero idle time
   * @returns {Array} - Array of hourly activity objects
   */
  _initializeHourlyActivity() {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      idle_seconds: 0
    }));
  }

  /**
   * Creates an empty daily summary object
   * @returns {Object} - Daily summary with zero values
   */
  _initializeDailySummary() {
    return {
      total_idle_seconds: 0,
    };
  }

  /**
   * Updates hourly activity data based on a new session
   * @param {Object} data - Day data
   * @param {Object} session - Activity session
   */
  _updateHourlyActivity(data, session) {
    // Only process idle sessions
    if (session.state !== 'idle') return;

    const { startTime, endTime, startHour, endHour } = this._getSessionTimeInfo(session);
    const duration = session.duration_seconds;

    if (startHour === endHour) {
      // Session within a single hour
      this._updateSingleHour(data, startHour, duration);
    } else {
      // Session spans multiple hours
      this._updateMultipleHours(data, startTime, endTime, startHour, endHour);
    }
  }

  /**
   * Extracts time information from a session
   * @param {Object} session - Activity session
   * @returns {Object} - Time information
   */
  _getSessionTimeInfo(session) {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    return {
      startTime,
      endTime,
      startHour: startTime.getHours(),
      endHour: endTime.getHours()
    };
  }

  /**
   * Updates activity for a session within a single hour
   * @param {Object} data - Day data
   * @param {number} hour - Hour to update
   * @param {number} duration - Duration in seconds
   */
  _updateSingleHour(data, hour, duration) {
    // data.hourly_activity[hour].idle_seconds += duration;
    // Ensure hourly_activity exists
  if (!data.hourly_activity) data.hourly_activity = {};
  
  // Initialize hour record if missing
  if (!data.hourly_activity[hour]) {
    data.hourly_activity[hour] = { idle_seconds: 0 };
  }
  
  // Safely increment (handle undefined/NaN cases)
  const current = data.hourly_activity[hour].idle_seconds;
  data.hourly_activity[hour].idle_seconds =  (typeof current === 'number' ? current : 0) + duration;
  }

  /**
   * Updates activity for a session spanning multiple hours
   * @param {Object} data - Day data
   * @param {Date} startTime - Session start time
   * @param {Date} endTime - Session end time
   * @param {number} startHour - Starting hour
   * @param {number} endHour - Ending hour
   */
  _updateMultipleHours(data, startTime, endTime, startHour, endHour) {
    // Calculate first hour duration (from start to end of first hour)
    const firstHourEnd = new Date(startTime);
    firstHourEnd.setHours(startHour + 1, 0, 0, 0);
    const firstHourDuration = Math.floor((firstHourEnd - startTime) / 1000);
    this._updateSingleHour(data, startHour, firstHourDuration);

    // Update all complete hours in between
    for (let hour = startHour + 1; hour < endHour; hour++) {
      this._updateSingleHour(data, hour, 3600); // 3600 seconds = 1 hour
    }

    // Calculate last hour duration (from start of last hour to end)
    const lastHourStart = new Date(endTime);
    lastHourStart.setHours(endHour, 0, 0, 0);
    const lastHourDuration = Math.floor((endTime - lastHourStart) / 1000);
    this._updateSingleHour(data, endHour, lastHourDuration);
  }

  /**
   * Updates daily summary based on all sessions
   * @param {Object} data - Day data
   */
  _updateDailySummary(data) {
    const summary = this._initializeDailySummary();

    data.activity_sessions.forEach(session => {
        summary.total_idle_seconds += session.duration_seconds;
    });

    data.daily_summary = summary;
  }

  /**
   * Retrieves the week range (Sunday to Saturday) for a given date
   * @param {Date} date - Date object (default: today)
   * @returns {Array} - Array of dates in YYYY-MM-DD format
   */
  _getWeekRange(date = new Date()) {
    const day = date.getDay(); // 0=Sunday, 6=Saturday
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - day);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      dates.push(d.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
    return dates;
  }

  /**
   * Retrieves stored dates from local storage
   * @returns {Promise<Array>} - Array of stored dates
   */
  async getWeeklyData() {
    const weekDates = this._getWeekRange();
    const storedDates = await this.getAllActivityData();
    console.log("Stored data",storedDates);
    
    return new Promise((resolve) => {
      // Only request dates that exist in storage
      const existingDates = typeof storedDates === 'object' && storedDates !== null 
        ? weekDates.filter(date => Object.prototype.hasOwnProperty.call(storedDates, date)) 
        : [];
      console.log("Existing dates",existingDates);
      
      if (existingDates.length === 0) {
        resolve(weekDates.map(date => ({ date, data: null })));
        return;
      }
      
      chrome.storage.local.get(existingDates, (result) => {
        const weekData = weekDates.map(date => ({
          date,
          data: result[date] || null
        }));
        resolve(weekData);
      });
    });
  }

}

// Export a singleton instance
export const activityStorage = new ActivityStorage();