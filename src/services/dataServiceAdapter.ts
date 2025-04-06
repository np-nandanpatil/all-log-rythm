import { dataService } from './dataService';
import { firebaseService } from './firebaseService';

// Set this to true to use Firebase, false to use localStorage
const USE_FIREBASE = true;

export const dataServiceAdapter = {
  // User operations
  async getUsers() {
    if (USE_FIREBASE) {
      return firebaseService.getUsers();
    }
    return dataService.getUsers();
  },

  async getUserById(id: string) {
    if (USE_FIREBASE) {
      return firebaseService.getUserById(id);
    }
    return dataService.getUserById(id);
  },

  // Authenticate user by username and password
  async authenticateUser(username: string, password: string) {
    if (USE_FIREBASE) {
      return firebaseService.authenticateUser(username, password);
    }
    return dataService.authenticateUser(username, password);
  },

  // Log operations
  async getLogs() {
    if (USE_FIREBASE) {
      return firebaseService.getLogs();
    }
    return dataService.getLogs();
  },

  async getLogsByUser(userId: string) {
    if (USE_FIREBASE) {
      return firebaseService.getLogsByUser(userId);
    }
    return dataService.getLogsByUser(userId);
  },

  async getLogById(id: string) {
    if (USE_FIREBASE) {
      return firebaseService.getLogById(id);
    }
    return dataService.getLogById(id);
  },

  // Check if a week number already exists
  async isWeekNumberExists(weekNumber: number, excludeLogId?: string) {
    if (USE_FIREBASE) {
      return firebaseService.isWeekNumberExists(weekNumber, excludeLogId);
    }
    return dataService.isWeekNumberExists(weekNumber, excludeLogId);
  },

  // Check if date range overlaps with any existing log
  async isDateRangeOverlapping(startDate: string, endDate: string, excludeLogId?: string) {
    if (USE_FIREBASE) {
      return firebaseService.isDateRangeOverlapping(startDate, endDate, excludeLogId);
    }
    return dataService.isDateRangeOverlapping(startDate, endDate, excludeLogId);
  },

  // Validate activity dates are within log date range
  validateActivityDates(activities: any[], startDate: string, endDate: string) {
    if (USE_FIREBASE) {
      return firebaseService.validateActivityDates(activities, startDate, endDate);
    }
    return dataService.validateActivityDates(activities, startDate, endDate);
  },

  async createLog(log: any) {
    if (USE_FIREBASE) {
      return firebaseService.createLog(log);
    }
    return dataService.createLog(log);
  },

  async updateLog(id: string, updates: any) {
    if (USE_FIREBASE) {
      return firebaseService.updateLog(id, updates);
    }
    return dataService.updateLog(id, updates);
  },

  // Comment operations
  async addComment(logId: string, comment: any) {
    if (USE_FIREBASE) {
      return firebaseService.addComment(logId, comment);
    }
    return dataService.addComment(logId, comment);
  },
  
  // Notification operations
  async getNotifications(userId: string) {
    if (USE_FIREBASE) {
      return firebaseService.getNotifications(userId);
    }
    return dataService.getNotifications(userId);
  },
  
  async createNotification(notification: any) {
    if (USE_FIREBASE) {
      return firebaseService.createNotification(notification);
    }
    return dataService.createNotification(notification);
  },
  
  async markNotificationAsRead(notificationId: string) {
    if (USE_FIREBASE) {
      return firebaseService.markNotificationAsRead(notificationId);
    }
    return dataService.markNotificationAsRead(notificationId);
  },
  
  async markAllNotificationsAsRead(userId: string) {
    if (USE_FIREBASE) {
      return firebaseService.markAllNotificationsAsRead(userId);
    }
    return dataService.markAllNotificationsAsRead(userId);
  },

  // Delete all logs (only for team leads)
  async deleteAllLogs() {
    if (USE_FIREBASE) {
      return firebaseService.deleteAllLogs();
    }
    return dataService.deleteAllLogs();
  },

  // Delete a specific log by ID (only for team leads)
  async deleteLog(id: string) {
    if (USE_FIREBASE) {
      return firebaseService.deleteLog(id);
    }
    return dataService.deleteLog(id);
  }
}; 