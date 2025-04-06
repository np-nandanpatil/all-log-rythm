import usersData from '../data/users.json';
import logsData from '../data/logs.json';

// Helper to save data to localStorage
function saveToStorage(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Helper to load data from localStorage
function loadFromStorage(key: string) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

// Helper to check if two date ranges overlap
function dateRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const startDate1 = new Date(start1);
  const endDate1 = new Date(end1);
  const startDate2 = new Date(start2);
  const endDate2 = new Date(end2);
  
  return (startDate1 <= endDate2 && startDate2 <= endDate1);
}

// Initialize localStorage with our JSON data if not already present
if (!localStorage.getItem('users')) {
  saveToStorage('users', usersData.users);
}
if (!localStorage.getItem('logs')) {
  saveToStorage('logs', logsData.logs);
}
if (!localStorage.getItem('notifications')) {
  saveToStorage('notifications', []);
}

export const dataService = {
  // User operations
  getUsers() {
    return loadFromStorage('users') || [];
  },

  getUserById(id: string) {
    const users = this.getUsers();
    return users.find((user: any) => user.id === id);
  },

  // Authenticate user by username and password
  authenticateUser(username: string, password: string) {
    const users = this.getUsers();
    return users.find((user: any) => user.username === username && user.password === password);
  },

  // Log operations
  getLogs() {
    return loadFromStorage('logs') || [];
  },

  getLogsByUser(userId: string) {
    const logs = this.getLogs();
    return logs.filter((log: any) => log.createdBy === userId);
  },

  getLogById(id: string) {
    const logs = this.getLogs();
    return logs.find((log: any) => log.id === id);
  },

  // Check if a week number already exists
  isWeekNumberExists(weekNumber: number, excludeLogId?: string) {
    const logs = this.getLogs();
    return logs.some((log: any) => 
      log.weekNumber === weekNumber && 
      (!excludeLogId || log.id !== excludeLogId)
    );
  },

  // Check if date range overlaps with any existing log
  isDateRangeOverlapping(startDate: string, endDate: string, excludeLogId?: string) {
    const logs = this.getLogs();
    return logs.some((log: any) => 
      (!excludeLogId || log.id !== excludeLogId) && 
      dateRangesOverlap(startDate, endDate, log.startDate, log.endDate)
    );
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

  createLog(log: any) {
    const logs = this.getLogs();
    
    // Check if week number already exists
    if (this.isWeekNumberExists(log.weekNumber)) {
      throw new Error(`Week ${log.weekNumber} log already exists. Please choose a different week.`);
    }
    
    // Check if date range overlaps with any existing log
    if (this.isDateRangeOverlapping(log.startDate, log.endDate)) {
      throw new Error(`The date range overlaps with an existing log. Please choose a different date range.`);
    }
    
    // Validate activity dates are within log date range
    this.validateActivityDates(log.activities, log.startDate, log.endDate);
    
    const newLog = {
      ...log,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    logs.push(newLog);
    saveToStorage('logs', logs);
    return newLog;
  },

  updateLog(id: string, updates: any) {
    const logs = this.getLogs();
    const index = logs.findIndex((log: any) => log.id === id);
    
    if (index !== -1) {
      // Check if week number already exists (excluding the current log)
      if (updates.weekNumber && this.isWeekNumberExists(updates.weekNumber, id)) {
        throw new Error(`Week ${updates.weekNumber} log already exists. Please choose a different week.`);
      }
      
      // Check if date range overlaps with any existing log (excluding the current log)
      if (updates.startDate && updates.endDate && this.isDateRangeOverlapping(updates.startDate, updates.endDate, id)) {
        throw new Error(`The date range overlaps with an existing log. Please choose a different date range.`);
      }
      
      // Validate activity dates are within log date range
      if (updates.activities && updates.startDate && updates.endDate) {
        this.validateActivityDates(updates.activities, updates.startDate, updates.endDate);
      }
      
      const oldStatus = logs[index].status;
      const newStatus = updates.status || oldStatus;
      
      logs[index] = {
        ...logs[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      saveToStorage('logs', logs);
      
      // Create notification if status changed to needs-revision
      if (newStatus === 'needs-revision' && oldStatus !== 'needs-revision') {
        // Get the latest comment which should be the revision request
        const latestComment = logs[index].comments && logs[index].comments.length > 0 
          ? logs[index].comments[logs[index].comments.length - 1] 
          : null;
        
        this.createNotification({
          userId: logs[index].createdBy,
          title: 'Log Needs Revision',
          message: `Your Week ${logs[index].weekNumber} log needs revisions. ${latestComment ? `Reason: ${latestComment.text}` : ''}`,
          logId: id,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
      
      // Create notification if status changed from needs-revision to pending-lead or pending-guide
      if ((newStatus === 'pending-lead' || newStatus === 'pending-guide') && oldStatus === 'needs-revision') {
        // We'll handle this in the LogView component instead
      }
      
      return logs[index];
    }
    return null;
  },

  // Comment operations
  addComment(logId: string, comment: any) {
    const logs = this.getLogs();
    const index = logs.findIndex((log: any) => log.id === logId);
    if (index !== -1) {
      if (!logs[index].comments) {
        logs[index].comments = [];
      }
      logs[index].comments.push({
        ...comment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      });
      saveToStorage('logs', logs);
      return logs[index];
    }
    return null;
  },
  
  // Notification operations
  getNotifications(userId: string) {
    const notifications = loadFromStorage('notifications') || [];
    return notifications.filter((notification: any) => notification.userId === userId);
  },
  
  createNotification(notification: any) {
    const notifications = loadFromStorage('notifications') || [];
    const newNotification = {
      ...notification,
      id: Date.now().toString()
    };
    notifications.push(newNotification);
    saveToStorage('notifications', notifications);
    return newNotification;
  },
  
  markNotificationAsRead(notificationId: string) {
    const notifications = loadFromStorage('notifications') || [];
    const index = notifications.findIndex((notification: any) => notification.id === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      saveToStorage('notifications', notifications);
      return notifications[index];
    }
    return null;
  },
  
  markAllNotificationsAsRead(userId: string) {
    const notifications = loadFromStorage('notifications') || [];
    const updatedNotifications = notifications.map((notification: any) => 
      notification.userId === userId ? { ...notification, read: true } : notification
    );
    saveToStorage('notifications', updatedNotifications);
    return updatedNotifications.filter((notification: any) => notification.userId === userId);
  },

  // Delete all logs (only for team leads)
  deleteAllLogs() {
    saveToStorage('logs', []);
    // Also clear any notifications related to logs
    saveToStorage('notifications', []);
    return true;
  },

  // Delete a specific log by ID (only for team leads)
  deleteLog(id: string) {
    const logs = this.getLogs();
    const updatedLogs = logs.filter((log: any) => log.id !== id);
    saveToStorage('logs', updatedLogs);
    
    // Also clear any notifications related to this log
    const notifications = loadFromStorage('notifications') || [];
    const updatedNotifications = notifications.filter((notification: any) => notification.logId !== id);
    saveToStorage('notifications', updatedNotifications);
    
    return true;
  }
}; 