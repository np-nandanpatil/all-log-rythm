import { format, parse, isValid, startOfDay, addMinutes } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Standard date format for display
export const DISPLAY_DATE_FORMAT = 'MMM d, yyyy';
// Standard date format for storage
export const STORAGE_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"; // Strictly UTC
// Standard date format for input
export const INPUT_DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Formats a date for display in the UI (e.g. "Feb 5, 2024")
 * CRITICAL: This treats the date as "floating" or checks the UTC day.
 */
export const formatDateForDisplay = (date: Date | string | null): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // If the date is valid, format it. 
  // NOTE: date-fns format() uses local time by default. 
  // If we stored "2024-02-05T00:00:00.000Z", in NY (UTC-5) this is "2024-02-04 19:00".
  // We want to display "Feb 5".
  // So we must access the UTC components or shift it.

  const utcYear = dateObj.getUTCFullYear();
  const utcMonth = dateObj.getUTCMonth();
  const utcDay = dateObj.getUTCDate();

  // Create a local date for formatting that LOOKS like the UTC date
  const displayDate = new Date(utcYear, utcMonth, utcDay);

  return format(displayDate, DISPLAY_DATE_FORMAT);
};

/**
 * Formats a date for storage in Firebase (ISO String at UTC Midnight)
 * This ensures that no matter where the user is, "Feb 5th" is stored as "2024-02-05T00:00:00.000Z"
 */
export const formatDateForStorage = (date: Date | string | null): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (!isValid(dateObj)) return '';

  // We assume the user selected "Feb 5" in their local calendar.
  // We want to store this as "Feb 5 UTC".
  // The input 'date' from mantine might be "2024-02-05T00:00:00.000 LocalTime"

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();

  const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

  return utcDate.toISOString();
};

/**
 * Parses a date string into a Date object
 * Used when reading from DB/Input
 */
export const parseDateString = (dateStr: string | Date | null): Date | null => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  // If it ends in Z, it is likely our stored UTC date.
  // We want to convert "2024-02-05T00:00:00.000Z" -> Local Date Object for "Feb 5 00:00"
  // so that the Calendar picker shows "Feb 5".

  const d = new Date(dateStr);
  if (!isValid(d)) return null;

  // We want to treat the UTC components as Local components for the UI
  const utcYear = d.getUTCFullYear();
  const utcMonth = d.getUTCMonth();
  const utcDay = d.getUTCDate();

  return new Date(utcYear, utcMonth, utcDay);
};

/**
 * Validates if a date is within a range
 */
export const isDateInRange = (date: Date | string, startDate: Date | string, endDate: Date | string): boolean => {
  // Convert everything to timestamps for easy comparison
  const d = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const s = typeof startDate === 'string' ? new Date(startDate).getTime() : startDate.getTime();
  const e = typeof endDate === 'string' ? new Date(endDate).getTime() : endDate.getTime();

  return d >= s && d <= e;
};

/**
 * Converts a Firestore timestamp to a Date object, preserving the "Day" logic
 */
export const firestoreTimestampToDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;

  let date: Date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }

  // Reuse our parse logic to ensure we get a Local Date representing the stored UTC Day
  return parseDateString(date.toISOString());
};

/**
 * Formats a date range for display
 */
export const formatDateRange = (startDate: Date | string | null, endDate: Date | string | null): string => {
  if (!startDate || !endDate) return '';
  return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
};

/**
 * Converts a date to a Firestore Timestamp (UTC Midnight)
 */
export const toFirestoreTimestamp = (date: any): Timestamp | null => {
  if (!date) return null;

  if (date && typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
    return date;
  }

  // Format for storage ensures it is a UTC string
  const storageStr = formatDateForStorage(date);
  if (!storageStr) return null;

  return Timestamp.fromDate(new Date(storageStr));
};

/**
 * Converts a Firestore timestamp to an ISO string
 */
export const fromFirestoreTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  // If it is a timestamp, .toDate() converts to JS Date (Local/UTC aware)
  // We want the raw ISO string of that instant
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return new Date(timestamp).toISOString();
};

/**
 * Converts a value to an ISO string
 */
export const toISOString = (value: any): string => {
  if (!value) return '';
  if (value && typeof value === 'object' && 'seconds' in value) {
    return fromFirestoreTimestamp(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}; 