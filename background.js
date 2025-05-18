/**
 * Background script for the Idle Tracker Extension
 * 
 * This script monitors user activity and idle states, tracking the time spent
 * in idle or locked states. It integrates with the ActivityStorage system
 * to maintain detailed activity records.
 */

import { activityStorage } from './utils/storage.js';

class IdleTracker {
  constructor() {
    this.idleStart = null;
    this.keepAlivePort = null;
    this.keepAliveInterval = null;
    this.initialize();
  }

  /**
   * Initializes the idle tracker
   */
  async initialize() {
    // Setup idle detection first
    this.setupIdleDetection();
    
    // Start keep-alive mechanisms
    this.startKeepAlive();
    
    // Add lifecycle listeners
    this.setupLifecycleListeners();
    
    console.log("Idle Tracker initialized with keep-alive");
  }



  /**
   * Sets up keep-alive mechanisms to prevent service worker termination
   */
  startKeepAlive() {
    

    // Chrome alarms (most reliable)
    chrome.alarms.create('keepAlive', { periodInMinutes: 4 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'keepAlive') {
        this.verifyState();
      }
    });
  }

  /**
   * Verifies current state and recovers if needed
   */
  async verifyState() {
    try {
      const currentState = await chrome.idle.queryState(15);
      const now = new Date();
      
      // Check if we missed any state transitions
      if (currentState !== 'active' && !this.idleStart) {
        // Missed idle start
        await this.handleIdleStart(now);
      } else if (currentState === 'active' && this.idleStart) {
        // Missed active state
        const today = now;
        await this.handleIdleEnd(now, today);
      }
    } catch (error) {
      console.error("State verification failed:", error);
    }
  }

   /**
   * Sets up lifecycle event listeners
   */
  setupLifecycleListeners() {
    // Handle service worker startup
    chrome.runtime.onStartup.addListener(() => {
      console.log("Browser started - reinitializing");
      this.initialize();
    });

    // Handle extension installation/update
    chrome.runtime.onInstalled.addListener((details) => {
      console.log(`Extension ${details.reason} - initializing`);
      this.initialize();
    });

    // Handle incoming messages (for keep-alive)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'keepAlivePing') {
        sendResponse({ alive: true });
      }
      return true; // Required for async response
    });
  }

  /**
   * Sets up idle detection with appropriate interval
   */
  setupIdleDetection() {
    // Set detection interval to 15 seconds
    chrome.idle.setDetectionInterval(15);
    // chrome.idle.onStateChanged.addListener((state) => this.handleIdleState(state));
    chrome.idle.onStateChanged.addListener(this.handleIdleState.bind(this));
  }

  /**
   * Handles state changes between active and idle/locked states
   * @param {string} state - Current state ("active", "idle", or "locked")
   */
  async handleIdleState(state) {
    const now = new Date();
    const today = now.toLocaleDateString().toString();

    try {
      if (state === "idle" || state === "locked") {
        await this.handleIdleStart(now);
      } else if (state === "active" && this.idleStart) {
        await this.handleIdleEnd(now, today);
      }
    } catch (error) {
      console.error("Error handling idle state:", error);
    }
  }

  /**
   * Handles the start of an idle period
   * @param {Date} startTime - When the idle period started
   */
  async handleIdleStart(startTime) {
    this.idleStart = startTime;
    console.log("User is idle or locked");
  }

  /**
   * Handles the end of an idle period
   * @param {Date} endTime - When the idle period ended
   * @param {string} date - Date string in MM/DD/YYYY format
   */
  async handleIdleEnd(endTime, date) {
    const idleDuration = Math.floor((endTime - this.idleStart) / 1000);
    
    // Create session data
    const session = {
      state: "idle",
      start_time: this.idleStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).toString(),
      end_time: endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).toString(),
      duration_seconds: idleDuration
    };

    console.log(`User is active again. Idle duration: ${idleDuration}s, Session: ${JSON.stringify(session)}`);


    // Save the session
    await activityStorage.addActivitySession(date, session);
    
    // Reset idle start time
    this.idleStart = null;
    
    console.log(`User was idle for ${idleDuration}s`);
  }

    /**
   * Cleans up keep-alive resources
   */
  cleanup() {
    if (this.keepAlivePort) {
      this.keepAlivePort.disconnect();
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    chrome.alarms.clear('keepAlive');
  }
}

let idleTracker = null;

function initTracker() {
  if (!idleTracker) {
    idleTracker = new IdleTracker();
  }
  return idleTracker;
}

// Initialize when service worker starts
initTracker();


// Ensure proper cleanup if the service worker is terminated
chrome.runtime.onSuspend.addListener(() => {
  idleTracker.cleanup();
});