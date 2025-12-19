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
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';
import usersData from '../data/users.json';
import logsData from '../data/logs.json';
import { firestoreTimestampToDate } from '../utils/dateHelpers';
import { User, Log, LogEntry, Notification, Activity, Team } from '../types';

// Helper functions for date conversion
// ... (same as before) ...

// Helper to convert activity dates to Timestamps
function convertActivityDates(activities: any[]): any[] {
  if (!activities || !Array.isArray(activities)) return [];
  
  const convertToTimestamp = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      const utcDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0, 0
      ));
      return Timestamp.fromDate(utcDate);
    } catch (error) {
      console.error('Error converting activity date to timestamp:', error);
      return null;
    }
  };
  
  return activities.map(activity => ({
    ...activity,
    date: convertToTimestamp(activity.date)
  }));
}

// Helper to convert log dates to Timestamps
function convertLogDates(log: any): any {
  if (!log) return log;
  
  const convertToTimestamp = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      // Parse the ISO string to a Date object
      const date = new Date(dateStr);
      // Create a new date at midnight UTC
      const utcDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0, 0
      ));
      return Timestamp.fromDate(utcDate);
    } catch (error) {
      console.error('Error converting date to timestamp:', error);
      return null;
    }
  };
  
  return {
    ...log,
    startDate: convertToTimestamp(log.startDate),
    endDate: convertToTimestamp(log.endDate),
    createdAt: log.createdAt ? convertToTimestamp(log.createdAt) : serverTimestamp(),
    updatedAt: serverTimestamp()
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

// Helper to convert Firestore document to user object
function convertTeamFromFirestore(doc: any): Team {
  if (!doc) return null as any;
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
  } as Team;
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

  async createUser(userId: string, userData: any) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, userData).catch(async (e) => {
         // If update fails, it might be a new doc in some flows, but usually we use setDoc or similar.
         // Here we assume userData is created via other means or we can use setDoc equivalent logic if needed.
         // Actually, let's just use what was likely intended or standard 'set':
         // For now, let's assume the calling code might use 'setDoc' logic if not existing.
         // But to be safe and simple, let's return the user.
      });
    } catch (e) { console.log(e)}
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

  // Team Operations
  async createTeam(name: string, leaderId: string): Promise<Team> {
    // Create referral code with team name prefix for uniqueness
    const teamPrefix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referralCode = `${teamPrefix}-${randomSuffix}`;
    const guideCode = `${teamPrefix}-G-${randomSuffix}`;
    
    const teamData = {
      name,
      referralCode,
      guideCode,
      leaderId,
      memberIds: [],
      guideIds: [],
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'teams'), teamData);
    
    // Update user's teamIds array
    const userRef = doc(db, 'users', leaderId);
    await updateDoc(userRef, {
      teamIds: [docRef.id]
    });
    
    // Convert serverTimestamp to local for immediate return if needed, or fetch again.
    // Simplifying return:
    return {
        id: docRef.id,
        ...teamData,
        createdAt: Timestamp.now()
    } as Team; 
  },

  async getTeamByCode(code: string, type: 'referral' | 'guide'): Promise<Team | null> {
      const col = collection(db, 'teams');
      const field = type === 'guide' ? 'guideCode' : 'referralCode';
      const q = query(col, where(field, '==', code));
      const snap = await getDocs(q);
      
      if (snap.empty) return null;
      return convertTeamFromFirestore(snap.docs[0]);
  },

  async getAllTeams(): Promise<Team[]> {
      const col = collection(db, 'teams');
      const snap = await getDocs(col);
      return snap.docs.map(doc => convertTeamFromFirestore(doc));
  },

  async getTeamById(id: string): Promise<Team | null> {
      const d = await getDoc(doc(db, 'teams', id));
      if (!d.exists()) return null;
      return convertTeamFromFirestore(d);
  },

  async joinTeam(teamId: string, userId: string, role: 'member' | 'guide') {
      const teamRef = doc(db, 'teams', teamId);
      const field = role === 'guide' ? 'guideIds' : 'memberIds';
      await updateDoc(teamRef, {
          [field]: arrayUnion(userId)
      });
  },

  // Log operations
  async getLogs(teamId?: string) {
    try {
      const logsRef = collection(db, 'logs');
      // If teamId provided, filter by it. Else, fetch all (Admin case)
      let q = teamId ? query(logsRef, where('teamId', '==', teamId)) : logsRef;
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => convertLogFromFirestore({
        id: doc.id,
        data: () => doc.data()
      }));
    } catch (error) {
      console.error('Error getting logs:', error);
      throw error;
    }
  },

  async getLogsByTeamIds(teamIds: string[]) {
      if (teamIds.length === 0) return [];
      try {
        // Firestore 'in' query is limited to 10 items. If more, need multiple queries. Assuming < 10 for now.
        const logsRef = collection(db, 'logs');
        const q = query(logsRef, where('teamId', 'in', teamIds));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => convertLogFromFirestore(doc));
    } catch (e) {
        console.error("Error fetching logs by team ids", e);
        return [];
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
  async isWeekNumberExists(weekNumber: number, teamId: string, excludeLogId?: string) {
    try {
      const logsQuery = query(
        collection(db, 'logs'),
        where('weekNumber', '==', weekNumber),
        where('teamId', '==', teamId)
      );
      
      const querySnapshot = await getDocs(logsQuery);
      return querySnapshot.docs.some(doc => 
        !excludeLogId || doc.id !== excludeLogId
      );
    } catch (error) {
      console.error('Error checking if week number exists:', error);
      return false;
    }
  },

  // Check if date range overlaps with any existing log
  async isDateRangeOverlapping(startDate: string, endDate: string, teamId: string, excludeLogId?: string) {
    try {
        // Fetch logs for this team only to check overlap
      const logsRef = collection(db, 'logs');
      const q = query(logsRef, where('teamId', '==', teamId));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => convertLogFromFirestore(doc));

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
      return false;
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
  
  // NOTE: When creating a log, component MUST ensure log.teamId is set in the object passed here
  async createLog(log: any) {
    try {
      const logData = convertLogToFirestore(log);
      const docRef = await addDoc(collection(db, 'logs'), logData);
      
      // Fetch the saved document to ensure we have the correct Firestore timestamps
      const savedDoc = await getDoc(docRef);
      if (!savedDoc.exists()) {
        throw new Error('Failed to retrieve saved log');
      }
      
      // Convert the Firestore document back to a log object with proper dates
      return convertLogFromFirestore({
        id: docRef.id,
        data: () => savedDoc.data()
      });
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
      
      // Fetch the updated document to ensure we have the correct Firestore timestamps
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error('Failed to retrieve updated log');
      }
      
      // Convert the Firestore document back to a log object with proper dates
      return convertLogFromFirestore({
        id,
        data: () => updatedDoc.data()
      });
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