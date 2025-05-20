import { formatDurationNatural, formatDateReadable } from '../../utils/helpers.js';

describe('formatDurationNatural', () => {
  it('formats seconds to hours and minutes', () => {
    expect(formatDurationNatural(3661)).toBe('1h 1m');
    expect(formatDurationNatural(59)).toBe('59s');
    expect(formatDurationNatural(3600)).toBe('1h');
    expect(formatDurationNatural(0)).toBe('0s');
  });
});

describe('formatDateReadable', () => {
  it('formats MM/DD/YYYY to readable date', () => {
    expect(formatDateReadable('04/27/2024')).toMatch(/April 27, 2024/);
  });
});