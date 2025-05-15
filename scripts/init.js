import { DailyTimeCircle } from './dailystats.js';
import { WeeklyStatsChart } from './weeklystats.js';

export function initializeVisualizations() {
  try {
    // Initialize daily view
    const dailyView = new DailyTimeCircle('dailyStatsChart', {
    });
    dailyView.init();

    // Initialize weekly view
    const weeklyView = new WeeklyStatsChart('weeklyStatsChart', {
      chartType: 'horizontalBar',
      noDataText: 'No data available for this week',
      errorText: 'Error loading data'
    });
    weeklyView.init();

  } catch (error) {
    console.error('Failed to initialize visualizations:', error);
    // Handle error (show user message, etc.)
  }
}

