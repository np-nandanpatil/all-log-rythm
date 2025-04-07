import { Timestamp } from 'firebase/firestore';
import { toFirestoreTimestamp, fromFirestoreTimestamp, toISOString, firestoreTimestampToDate, formatDateForStorage } from '../utils/dateHelpers';

export const dateService = {
  // Convert a log object's dates to Firestore Timestamps
  toFirestore(log: any) {
    if (!log) return log;

    return {
      ...log,
      startDate: toFirestoreTimestamp(log.startDate),
      endDate: toFirestoreTimestamp(log.endDate),
      activities: log.activities?.map((activity: any) => ({
        ...activity,
        date: toFirestoreTimestamp(activity.date)
      })),
      createdAt: log.createdAt ? toFirestoreTimestamp(log.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now()
    };
  },

  // Convert a log object's dates from Firestore Timestamps to ISO strings
  fromFirestore(log: any) {
    if (!log) return log;

    return {
      ...log,
      startDate: toISOString(log.startDate),
      endDate: toISOString(log.endDate),
      activities: log.activities?.map((activity: any) => ({
        ...activity,
        date: toISOString(activity.date)
      })),
      createdAt: fromFirestoreTimestamp(log.createdAt),
      updatedAt: fromFirestoreTimestamp(log.updatedAt)
    };
  }
}; 