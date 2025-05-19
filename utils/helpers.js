export function formatDurationNatural(seconds) {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const secs = seconds % 60;

    let result = [];
    if (hours) result.push(`${hours}h`);
    if (mins) result.push(`${mins}m`);
 
    if (hours === 0 && (secs || result.length === 0)) result.push(`${secs}s`);
    return result.join(' ');
  }

  export function formatDateReadable(dateStr) {
    const [month, day, year] = dateStr.split('/');
    const date = new Date(`${year}-${month}-${day}`);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }