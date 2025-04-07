import { format, parse, isValid, startOfDay } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Standard date format for display
export const DISPLAY_DATE_FORMAT = 'MMM d, yyyy';
// Standard date format for storage
export const STORAGE_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";
// Standard date format for input
export const INPUT_DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Formats a date for display in the UI
 */
export const formatDateForDisplay = (date: Date | string | null): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, DISPLAY_DATE_FORMAT);
};

/**
 * Formats a date for storage in Firebase
 */
export const formatDateForStorage = (date: Date | string | null): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Create a new date at midnight UTC
  const utcDate = new Date(Date.UTC(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    0, 0, 0, 0
  ));
  
  return utcDate.toISOString();
};

/**
 * Parses a date string into a Date object
 */
export const parseDateString = (dateStr: string | Date | null): Date | null => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  // Try parsing with different formats
  const formats = [
    INPUT_DATE_FORMAT,
    DISPLAY_DATE_FORMAT,
    STORAGE_DATE_FORMAT,
    'yyyy-MM-dd',
    'MM/dd/yyyy'
  ];

  for (const formatStr of formats) {
    const parsedDate = parse(dateStr, formatStr, new Date());
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }

  // If no format matches, try direct parsing
  const directDate = new Date(dateStr);
  return isValid(directDate) ? directDate : null;
};

/**
 * Validates if a date is within a range
 */
export const isDateInRange = (date: Date | string, startDate: Date | string, endDate: Date | string): boolean => {
  const start = startOfDay(typeof startDate === 'string' ? new Date(startDate) : startDate);
  const end = startOfDay(typeof endDate === 'string' ? new Date(endDate) : endDate);
  const check = startOfDay(typeof date === 'string' ? new Date(date) : date);
  return check >= start && check <= end;
};

/**
 * Converts a Firestore timestamp to a Date object
 */
export const firestoreTimestampToDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  return new Date(timestamp);
};

/**
 * Formats a date range for display
 */
export const formatDateRange = (startDate: Date | string | null, endDate: Date | string | null): string => {
  if (!startDate || !endDate) return '';
  return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
};

/**
 * Converts a date to a Firestore Timestamp
 */
export const toFirestoreTimestamp = (date: any): Timestamp | null => {
  if (!date) return null;
  
  // If it's already a Timestamp, return it
  if (date && typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
    return date;
  }
  
  // Create a Date object from the input
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return null;
  
  // Create a UTC midnight date
  const utcDate = new Date(Date.UTC(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    0, 0, 0, 0
  ));
  
  return Timestamp.fromDate(utcDate);
};

/**
 * Converts a Firestore timestamp to an ISO string
 */
export const fromFirestoreTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = firestoreTimestampToDate(timestamp);
  return date ? date.toISOString() : '';
};

/**
 * Converts a value to an ISO string (handles Firestore timestamps and dates)
 */
export const toISOString = (value: any): string => {
  if (!value) return '';
  
  // If it's a Timestamp, convert to Date first
  if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
    return fromFirestoreTimestamp(value);
  }
  
  // If it's a Date
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  // If it's a string, assume it's already in proper format
  if (typeof value === 'string') {
    return value;
  }
  
  return '';
}; 