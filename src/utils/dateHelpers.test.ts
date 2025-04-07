import { Timestamp } from 'firebase/firestore';
import {
  formatDateForDisplay,
  formatDateForStorage,
  parseDateString,
  isDateInRange,
  firestoreTimestampToDate,
  toFirestoreTimestamp,
  fromFirestoreTimestamp,
  toISOString
} from './dateHelpers';

describe('Date Helpers', () => {
  const testDate = new Date('2025-04-20T00:00:00.000Z');
  const testTimestamp = Timestamp.fromDate(testDate);
  const testISOString = '2025-04-20T00:00:00.000Z';

  describe('toFirestoreTimestamp', () => {
    it('should convert Date to Timestamp', () => {
      const result = toFirestoreTimestamp(testDate);
      expect(result instanceof Timestamp).toBe(true);
      expect(result?.toDate().getTime()).toBe(testDate.getTime());
    });

    it('should handle ISO string', () => {
      const result = toFirestoreTimestamp(testISOString);
      expect(result instanceof Timestamp).toBe(true);
      expect(result?.toDate().getTime()).toBe(testDate.getTime());
    });
  });

  describe('fromFirestoreTimestamp', () => {
    it('should convert Timestamp to ISO string', () => {
      const result = fromFirestoreTimestamp(testTimestamp);
      expect(result).toBe(testISOString);
    });

    it('should handle null', () => {
      const result = fromFirestoreTimestamp(null);
      expect(result).toBe('');
    });
  });

  describe('toISOString', () => {
    it('should convert Date to ISO string', () => {
      const date = new Date('2025-04-20T15:30:45.123Z');
      const result = toISOString(date);
      expect(result).toBe(date.toISOString());
    });

    it('should handle Timestamp', () => {
      const result = toISOString(testTimestamp);
      expect(result).toBe(testISOString);
    });

    it('should handle string date', () => {
      const result = toISOString('2025-04-20T15:30:45.123Z');
      expect(result).toBe('2025-04-20T15:30:45.123Z');
    });
  });

  describe('parseDateString', () => {
    it('should parse ISO string to Date', () => {
      const result = parseDateString(testISOString);
      expect(result instanceof Date).toBe(true);
      expect(result?.toISOString()).toBe(testISOString);
    });

    it('should handle null', () => {
      const result = parseDateString(null);
      expect(result).toBeNull();
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format Date for display', () => {
      const result = formatDateForDisplay(testDate);
      expect(result).toBe('Apr 20, 2025');
    });

    it('should handle string date', () => {
      const result = formatDateForDisplay(testISOString);
      expect(result).toBe('Apr 20, 2025');
    });
  });

  describe('firestoreTimestampToDate', () => {
    it('should convert Timestamp to Date', () => {
      const result = firestoreTimestampToDate(testTimestamp);
      expect(result instanceof Date).toBe(true);
      expect(result?.getTime()).toBe(testDate.getTime());
    });

    it('should handle null', () => {
      const result = firestoreTimestampToDate(null);
      expect(result).toBeNull();
    });
  });
}); 