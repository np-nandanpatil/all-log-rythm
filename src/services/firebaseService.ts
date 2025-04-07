import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import usersData from '../data/users.json';
import logsData from '../data/logs.json';
import { firestoreTimestampToDate } from '../utils/dateHelpers';

interface User {
  id: string;
  username: string;
  role: string;
  name: string;
  password?: string;
}

// Helper functions for date conversion
// const timestampToISOString = (timestamp: any): string => {
//   if (!timestamp) return '';
//   if (timestamp.toDate) {
//     return timestamp.toDate().toISOString();
//   }
//   return timestamp;
// };

// Helper to convert activity dates to Timestamps
function convertActivityDates(activities: any[]): any[] {
  if (!activities || !Array.isArray(activities)) return [];
  
  return activities.map(activity => ({
    ...activity,
    date: activity.date ? Timestamp.fromDate(new Date(activity.date)) : null
  }));
}

// Helper to convert log dates to Timestamps
function convertLogDates(log: any): any {
  if (!log) return log;
  
  return {
    ...log,
    startDate: log.startDate ? Timestamp.fromDate(new Date(log.startDate)) : null,
    endDate: log.endDate ? Timestamp.fromDate(new Date(log.endDate)) : null,
    createdAt: log.createdAt ? Timestamp.fromDate(new Date(log.createdAt)) : serverTimestamp(),
    updatedAt: log.updatedAt ? Timestamp.fromDate(new Date(log.updatedAt)) : serverTimestamp()
  };
}

// Helper to convert log to Firestore format
function convertLogToFirestore(log: any): any {
  if (!log) return null;
  
  const data = { ...log };
  delete data.id;
  
  // Convert dates to Timestamps
  const convertedData = convertLogDates(data);
  
  // Convert activity dates to Timestamps
  if (data.activities && Array.isArray(data.activities)) {
    convertedData.activities = convertActivityDates(data.activities);
  }
  
  return convertedData;
}

// Helper to convert Firestore document to log object
function convertLogFromFirestore(doc: any): any {
  if (!doc) return null;
  
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    startDate: data.startDate ? firestoreTimestampToDate(data.startDate) : null,
    endDate: data.endDate ? firestoreTimestampToDate(data.endDate) : null,
    createdAt: data.createdAt ? firestoreTimestampToDate(data.createdAt) : null,
    updatedAt: data.updatedAt ? firestoreTimestampToDate(data.updatedAt) : null,
    activities: data.activities?.map((activity: any) => ({
      ...activity,
      date: activity.date ? firestoreTimestampToDate(activity.date) : null
    })) || []
  };
}

// Helper to convert Firestore document to user object
function convertUserFromFirestore(doc: any): any {
  if (!doc) return null;
  
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt ? Timestamp.fromDate(new Date(data.createdAt)) : null
  };
}

export const firebaseService = {
  // User operations
  async getUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as User[];
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', id);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return null;
      return {
        ...userDoc.data(),
        id: userDoc.id
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, 
        where('username', '==', username),
        where('password', '==', password)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const userDoc = snapshot.docs[0];
      return {
        ...userDoc.data(),
        id: userDoc.id
      } as User;
    } catch (error) {
      console.error('Error authenticating:', error);
      throw error;
    }
  },

  // Log operations
  async getLogs() {
    try {
      const logsRef = collection(db, 'logs');
      const snapshot = await getDocs(logsRef);
      return snapshot.docs.map(doc => convertLogFromFirestore({
        id: doc.id,
        data: () => doc.data()
      }));
    } catch (error) {
      console.error('Error getting logs:', error);
      throw error;
    }
  },

  async getLogsByUser(userId: string) {
    try {
      const logsRef = collection(db, 'logs');
      const q = query(logsRef, where('createdBy', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => convertLogFromFirestore({
        id: doc.id,
        data: () => doc.data()
      }));
    } catch (error) {
      console.error('Error getting user logs:', error);
      throw error;
    }
  },

  async getLogById(id: string) {
    try {
      const logDoc = await getDoc(doc(db, 'logs', id));
      if (logDoc.exists()) {
        return convertLogFromFirestore({
          id: logDoc.id,
          data: () => logDoc.data()
        });
      }
      return null;
    } catch (error) {
      console.error('Error getting log by ID:', error);
      // Fallback to JSON data if Firestore is not available
      return logsData.logs.find((log: any) => log.id === id);
    }
  },

  // Check if a week number already exists
  async isWeekNumberExists(weekNumber: number, excludeLogId?: string) {
    try {
      const logsQuery = query(
        collection(db, 'logs'),
        where('weekNumber', '==', weekNumber)
      );
      
      const querySnapshot = await getDocs(logsQuery);
      return querySnapshot.docs.some(doc => 
        !excludeLogId || doc.id !== excludeLogId
      );
    } catch (error) {
      console.error('Error checking if week number exists:', error);
      // Fallback to JSON data if Firestore is not available
      return logsData.logs.some((log: any) => 
        log.weekNumber === weekNumber && 
        (!excludeLogId || log.id !== excludeLogId)
      );
    }
  },

  // Check if date range overlaps with any existing log
  async isDateRangeOverlapping(startDate: string, endDate: string, excludeLogId?: string) {
    try {
      const logs = await this.getLogs();
      return logs.some((log: any) => {
        if (excludeLogId && log.id === excludeLogId) return false;
        
        const logStartDate = new Date(log.startDate);
        const logEndDate = new Date(log.endDate);
        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);
        
        return (logStartDate <= newEndDate && newStartDate <= logEndDate);
      });
    } catch (error) {
      console.error('Error checking if date range overlaps:', error);
      // Fallback to JSON data if Firestore is not available
      return logsData.logs.some((log: any) => {
        if (excludeLogId && log.id === excludeLogId) return false;
        
        const logStartDate = new Date(log.startDate);
        const logEndDate = new Date(log.endDate);
        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);
        
        return (logStartDate <= newEndDate && newStartDate <= logEndDate);
      });
    }
  },

  // Validate activity dates are within log date range
  validateActivityDates(activities: any[], startDate: string, endDate: string) {
    const logStartDate = new Date(startDate);
    const logEndDate = new Date(endDate);
    
    for (const activity of activities) {
      const activityDate = new Date(activity.date);
      if (activityDate < logStartDate || activityDate > logEndDate) {
        throw new Error(`Activity date ${activityDate.toLocaleDateString()} is outside the log date range (${logStartDate.toLocaleDateString()} - ${logEndDate.toLocaleDateString()})`);
      }
    }
  },

  async createLog(log: any) {
    try {
      const logData = convertLogToFirestore(log);
      const docRef = await addDoc(collection(db, 'logs'), logData);
      return { id: docRef.id, ...log };
    } catch (error) {
      console.error('Error creating log:', error);
      throw error;
    }
  },

  async updateLog(id: string, log: any) {
    try {
      const logData = convertLogToFirestore(log);
      const docRef = doc(db, 'logs', id);
      await updateDoc(docRef, logData);
      return { id, ...log };
    } catch (error) {
      console.error('Error updating log:', error);
      throw error;
    }
  },

  // Comment operations
  async addComment(logId: string, comment: any) {
    try {
      const logRef = doc(db, 'logs', logId);
      const logDoc = await getDoc(logRef);
      
      if (!logDoc.exists()) {
        throw new Error('Log not found');
      }
      
      const logData = logDoc.data();
      const comments = logData.comments || [];
      
      // Add timestamp to comment using regular Date
      const newComment = {
        ...comment,
        createdAt: new Date().toISOString()
      };
      
      // Update the log with the new comment
      await updateDoc(logRef, {
        comments: [...comments, newComment],
        updatedAt: serverTimestamp()
      });
      
      return this.getLogById(logId);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },
  
  // Notification operations
  async getNotifications(userId: string) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt ? firestoreTimestampToDate(doc.data().createdAt) : null
      }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },
  
  async createNotification(notificationData: any) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const data = {
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false
      };
      const docRef = await addDoc(notificationsRef, data);
      return {
        ...data,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
  
  async markNotificationAsRead(notificationId: string) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  
  async markAllNotificationsAsRead(userId: string) {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(notificationsQuery);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );
      
      await Promise.all(updatePromises);
      
      return this.getNotifications(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete operations
  async deleteLog(logId: string) {
    try {
      const logRef = doc(db, 'logs', logId);
      await deleteDoc(logRef);
      return true;
    } catch (error) {
      console.error('Error deleting log:', error);
      throw error;
    }
  },
  
  async deleteAllLogs() {
    try {
      const logsSnapshot = await getDocs(collection(db, 'logs'));
      const deletePromises = logsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error deleting all logs:', error);
      throw error;
    }
  }
}; 