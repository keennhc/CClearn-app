import { formatDate, formatTime, formatDateTime, formatName, getInitials } from './formatting';

describe('formatDate', () => {
  it('formats a date string to short month, day, and year', () => {
    const result = formatDate('2024-03-15T10:30:00Z');
    expect(result).toContain('Mar');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});

describe('formatTime', () => {
  it('formats a date string to hours and minutes', () => {
    const result = formatTime('2024-03-15T10:30:00Z');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatDateTime', () => {
  it('combines date and time formatting', () => {
    const result = formatDateTime('2024-03-15T10:30:00Z');
    expect(result).toContain('Mar');
    expect(result).toContain('2024');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatName', () => {
  it('combines first and last name', () => {
    expect(formatName('John', 'Doe')).toBe('John Doe');
  });

  it('handles undefined first name', () => {
    expect(formatName(undefined, 'Doe')).toBe('Doe');
  });

  it('handles undefined last name', () => {
    expect(formatName('John', undefined)).toBe('John');
  });

  it('handles both undefined', () => {
    expect(formatName(undefined, undefined)).toBe('');
  });
});

describe('getInitials', () => {
  it('returns uppercase initials from first and last name', () => {
    expect(getInitials('John', 'Doe')).toBe('JD');
  });

  it('handles lowercase names', () => {
    expect(getInitials('john', 'doe')).toBe('JD');
  });

  it('returns fallback when first name is undefined', () => {
    const result = getInitials(undefined, 'Doe');
    expect(result).toContain('D');
  });

  it('returns fallback when last name is undefined', () => {
    const result = getInitials('John', undefined);
    expect(result).toContain('J');
  });

  it('returns question mark when both are undefined', () => {
    expect(getInitials(undefined, undefined)).toBe('?');
  });
});
