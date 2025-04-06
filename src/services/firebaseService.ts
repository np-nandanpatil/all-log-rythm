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

interface User {
  id: string;
  username: string;
  role: string;
  name: string;
  password?: string;
}

// Helper functions for date conversion
const timestampToISOString = (timestamp: any): string => {
  if (!timestamp) return '';
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

const isoStringToTimestamp = (isoString: string): any => {
  if (!isoString) return serverTimestamp();
  return Timestamp.fromDate(new Date(isoString));
};

// Helper to convert activity dates to Timestamps
const convertActivityDates = (activities: any[]) => {
  return activities.map(activity => ({
    ...activity,
    date: isoStringToTimestamp(activity.date)
  }));
};

// Helper to convert log dates to Timestamps
const convertLogDates = (log: any) => {
  return {
    ...log,
    startDate: isoStringToTimestamp(log.startDate),
    endDate: isoStringToTimestamp(log.endDate),
    createdAt: log.createdAt ? isoStringToTimestamp(log.createdAt) : serverTimestamp(),
    updatedAt: serverTimestamp(),
    activities: convertActivityDates(log.activities)
  };
};

// Helper to convert Firestore document to log object
const docToLog = (doc: any) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    startDate: timestampToISOString(data.startDate),
    endDate: timestampToISOString(data.endDate),
    createdAt: timestampToISOString(data.createdAt),
    updatedAt: timestampToISOString(data.updatedAt),
    activities: data.activities.map((activity: any) => ({
      ...activity,
      date: timestampToISOString(activity.date)
    }))
  };
};

// Helper to convert log data structure
function convertLogData(log: any): any {
  return {
    ...log,
    startDate: isoStringToTimestamp(log.startDate),
    endDate: isoStringToTimestamp(log.endDate),
    createdAt: log.createdAt ? isoStringToTimestamp(log.createdAt) : serverTimestamp(),
    updatedAt: log.updatedAt ? isoStringToTimestamp(log.updatedAt) : serverTimestamp(),
    activities: log.activities.map((activity: any) => ({
      ...activity,
      date: isoStringToTimestamp(activity.date)
    }))
  };
}

// Helper to convert log data from Firestore
function convertLogFromFirestore(log: any): any {
  if (!log) return null;
  
  const data = log.data();
  return {
    id: log.id,
    ...data,
    startDate: timestampToISOString(data.startDate),
    endDate: timestampToISOString(data.endDate),
    createdAt: timestampToISOString(data.createdAt),
    updatedAt: timestampToISOString(data.updatedAt),
    activities: data.activities.map((activity: any) => ({
      ...activity,
      date: timestampToISOString(activity.date)
    }))
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
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: timestampToISOString(doc.data().createdAt),
        updatedAt: timestampToISOString(doc.data().updatedAt),
        startDate: timestampToISOString(doc.data().startDate),
        endDate: timestampToISOString(doc.data().endDate)
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
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: timestampToISOString(doc.data().createdAt),
        updatedAt: timestampToISOString(doc.data().updatedAt),
        startDate: timestampToISOString(doc.data().startDate),
        endDate: timestampToISOString(doc.data().endDate)
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

  async createLog(logData: any) {
    try {
      const logsRef = collection(db, 'logs');
      const data = {
        ...logData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        startDate: isoStringToTimestamp(logData.startDate),
        endDate: isoStringToTimestamp(logData.endDate)
      };
      const docRef = await addDoc(logsRef, data);
      return {
        ...data,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating log:', error);
      throw error;
    }
  },

  async updateLog(logId: string, logData: any) {
    try {
      const logRef = doc(db, 'logs', logId);
      const data = {
        ...logData,
        updatedAt: serverTimestamp(),
        startDate: isoStringToTimestamp(logData.startDate),
        endDate: isoStringToTimestamp(logData.endDate)
      };
      await updateDoc(logRef, data);
      return {
        ...data,
        id: logId
      };
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
        createdAt: timestampToISOString(doc.data().createdAt)
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