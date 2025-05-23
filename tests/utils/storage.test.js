import { ActivityStorage } from '../../utils/storage.js';

const mockStorage = {
  data: {"05/20/2025": { date: "05/20/2025", activity_sessions: [], hourly_activity: [], daily_summary: { total_idle_seconds: 15 } } },
  get(keys, callback) {
    if (keys === null) {
      callback(this.data);
    } else if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => { result[key] = this.data[key]; });
      callback(result);
    } else {
      callback({ [keys]: this.data[keys] });
    }
  },
  set(items, callback) {
    Object.assign(this.data, items);
    if (callback) callback();
  }
};

describe('ActivityStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new ActivityStorage(mockStorage);
    mockStorage.data = {"05/20/2025": { date: "05/20/2025", activity_sessions: [], hourly_activity: [], daily_summary: { total_idle_seconds: 15 } } }; // reset mock storage
  });

  it('returns empty day data if none exists', async () => {
    const data = await storage.getActivityData('05/21/2025');
    expect(data.date).toBe('05/21/2025');
    expect(Array.isArray(data.activity_sessions)).toBe(true);
    expect(data.activity_sessions.length).toBe(0);
    expect(Array.isArray(data.hourly_activity)).toBe(true);
    expect(data.hourly_activity.length).toBe(24);
    expect(data.daily_summary).toEqual({ total_idle_seconds: 0 });
  });

  it('saves and retrieves activity data correctly', async () => {
    const date = '05/20/2025';
    const data = {
      date,
      activity_sessions: [{ start: "03:15:18", end: "03:25:18" }],
      hourly_activity: [{ hour: 0, idle_seconds: 5 }],
      daily_summary: { total_idle_seconds: 15 }
    };

    await storage.saveActivityData(date, data);
    const retrievedData = await storage.getActivityData(date);

    expect(retrievedData).toEqual(data);
  });

  it('returns top 5 longest idle sessions', async () => {
    const date = '05/20/2025';
    const data = {
      date,
      activity_sessions: [
        { state: "idle", start_time: "03:15:18", end_time: "03:25:18", duration_seconds: 600 },
        { state: "idle", start_time: "04:15:18", end_time: "04:25:18", duration_seconds: 300 },
        { state: "idle", start_time: "05:15:18", end_time: "05:25:18", duration_seconds: 200 },
        { state: "idle", start_time: "06:15:18", end_time: "06:25:18", duration_seconds: 700 },
        { state: "idle", start_time: "07:15:18", end_time: "07:25:18", duration_seconds: 400 }
      ],
      hourly_activity: [{ hour: 0, idle_seconds: 5 }],
      daily_summary: { total_idle_seconds: 15 }
    };

    await storage.saveActivityData(date, data);
    const topSessions = await storage.getTop5LongestIdleSessions(date);

    expect(topSessions.length).toBe(5);
    expect(topSessions[0].duration_seconds).toBe(700);
    expect(topSessions[1].duration_seconds).toBe(600);
    expect(topSessions[2].duration_seconds).toBe(400);
    expect(topSessions[3].duration_seconds).toBe(300);
    expect(topSessions[4].duration_seconds).toBe(200);
  });

  it('returns top longest idle sessions fewer than 5 sessions', async () => {
    const date = '05/21/2025';
    const data = {
      date,
      activity_sessions: [
        { state: "idle", start_time: "03:15:18", end_time: "03:25:18", duration_seconds: 600 },
        { state: "idle", start_time: "04:15:18", end_time: "04:25:18", duration_seconds: 300 }
      ],
      hourly_activity: [{ hour: 0, idle_seconds: 5 }],
      daily_summary: { total_idle_seconds: 15 }
    };

    await storage.saveActivityData(date, data);
    const topSessions = await storage.getTop5LongestIdleSessions(date);

    expect(topSessions.length).toBe(2);
  });
});