import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  getDay,
} from 'date-fns';

/**
 * Format a Date object as 'YYYY-MM-DD' using local timezone values.
 * Avoids toISOString() which shifts time to UTC.
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a 'YYYY-MM-DD' local date string into a local Date object.
 */
export function parseLocalDate(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  return new Date(year, month, day, 12, 0, 0); // midday to prevent boundary DST shifts
}

/**
 * Human-readable display of date, e.g. "Monday, Nov 2, 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return format(d, 'EEEE, MMM d, yyyy');
}

/**
 * Short date, e.g. "Nov 2"
 */
export function formatShortDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return format(d, 'MMM d');
}

/**
 * Get date string offset by days (+1 for tomorrow, -1 for yesterday)
 */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  const target = days > 0 ? addDays(d, days) : subDays(d, Math.abs(days));
  return formatLocalDate(target);
}

/**
 * Get today's local date string
 */
export function getTodayDateStr(): string {
  return formatLocalDate(new Date());
}

/**
 * Check if a date string is today
 */
export function isTodayStr(dateStr: string): boolean {
  return dateStr === getTodayDateStr();
}

/**
 * Returns Monday-Sunday week bounds for a given date
 * (Week starts on Monday, ends on Sunday)
 */
export function getWeekBounds(dateStr: string): { start: string; end: string } {
  const d = parseLocalDate(dateStr);
  const weekStart = startOfWeek(d, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(d, { weekStartsOn: 1 }); // Sunday
  return {
    start: formatLocalDate(weekStart),
    end: formatLocalDate(weekEnd),
  };
}

/**
 * Get list of dates in the Monday-Sunday week
 */
export function getDatesInWeek(dateStr: string): string[] {
  const bounds = getWeekBounds(dateStr);
  const start = parseLocalDate(bounds.start);
  const end = parseLocalDate(bounds.end);
  return eachDayOfInterval({ start, end }).map(formatLocalDate);
}

/**
 * Get day of week (0=Sun, 1=Mon, ..., 6=Sat)
 */
export function getDayOfWeek(dateStr: string): number {
  return getDay(parseLocalDate(dateStr));
}

/**
 * Get all dates for a year (for 53-week heatmap)
 */
export function getAllDaysInYear(year: number): string[] {
  const start = new Date(year, 0, 1, 12, 0, 0);
  const end = new Date(year, 11, 31, 12, 0, 0);
  return eachDayOfInterval({ start, end }).map(formatLocalDate);
}

/**
 * Number of calendar days between two date strings (end - start)
 */
export function daysBetween(startDateStr: string, endDateStr: string): number {
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  return differenceInCalendarDays(end, start);
}
