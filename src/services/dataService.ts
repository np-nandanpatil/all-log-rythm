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
  try {
    const startDate1 = new Date(start1);
    const endDate1 = new Date(end1);
    const startDate2 = new Date(start2);
    const endDate2 = new Date(end2);
    
    // Validate dates
    if (isNaN(startDate1.getTime()) || isNaN(endDate1.getTime()) || 
        isNaN(startDate2.getTime()) || isNaN(endDate2.getTime())) {
      return false;
    }
    
    // Set all dates to start of day for consistent comparison
    startDate1.setUTCHours(0, 0, 0, 0);
    endDate1.setUTCHours(0, 0, 0, 0);
    startDate2.setUTCHours(0, 0, 0, 0);
    endDate2.setUTCHours(0, 0, 0, 0);
    
    return (startDate1 <= endDate2 && startDate2 <= endDate1);
  } catch (error) {
    console.error('Error in dateRangesOverlap:', error);
    return false;
  }
}

// Helper to format date consistently
function formatDate(dateString: string | Date): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    // Use UTC date to avoid timezone issues
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(date);
  } catch (error) {
    return 'Invalid Date';
  }
}

// Helper to validate and parse date
function parseDate(dateString: string): Date | null {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    date.setUTCHours(0, 0, 0, 0);
    return date;
  } catch (error) {
    return null;
  }
}

// Helper to ensure consistent date format
function normalizeDate(date: string | Date): string {
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new Error('Invalid date');
    }
    parsed.setUTCHours(0, 0, 0, 0);
    return parsed.toISOString();
  } catch (error) {
    console.error('Error normalizing date:', error);
    return new Date().toISOString();
  }
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
    const logStartDate = parseDate(startDate);
    const logEndDate = parseDate(endDate);
    
    if (!logStartDate || !logEndDate) {
      throw new Error('Invalid log date range');
    }
    
    for (const activity of activities) {
      const activityDate = parseDate(activity.date);
      if (!activityDate) {
        throw new Error('Invalid activity date');
      }
      
      if (activityDate < logStartDate || activityDate > logEndDate) {
        throw new Error(`Activity date ${formatDate(activityDate)} is outside the log date range (${formatDate(logStartDate)} - ${formatDate(logEndDate)})`);
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
      const currentLog = logs[index];
      
      // Check if week number already exists (excluding the current log)
      if (updates.weekNumber && updates.weekNumber !== currentLog.weekNumber && 
          this.isWeekNumberExists(updates.weekNumber, id)) {
        throw new Error(`Week ${updates.weekNumber} log already exists. Please choose a different week.`);
      }
      
      // Ensure we have valid dates and normalize them
      const startDate = updates.startDate ? normalizeDate(updates.startDate) : currentLog.startDate;
      const endDate = updates.endDate ? normalizeDate(updates.endDate) : currentLog.endDate;
      
      // Validate dates
      if (!startDate || !endDate) {
        throw new Error('Invalid date range: start date and end date are required');
      }
      
      // Check for date range overlaps only if dates are being changed
      if ((updates.startDate || updates.endDate) && 
          (startDate !== currentLog.startDate || endDate !== currentLog.endDate)) {
        if (this.isDateRangeOverlapping(startDate, endDate, id)) {
          throw new Error(`The date range overlaps with an existing log. Please choose a different date range.`);
        }
      }
      
      // Handle activities update
      const activities = updates.activities || currentLog.activities;
      if (activities) {
        // Normalize activity dates
        const validatedActivities = activities.map((activity: any) => ({
          ...activity,
          date: normalizeDate(activity.date || new Date())
        }));
        
        // Validate activity dates against log date range
        this.validateActivityDates(validatedActivities, startDate, endDate);
        
        // Update activities with normalized dates
        updates.activities = validatedActivities;
      }
      
      // Create the updated log object
      const updatedLog = {
        ...currentLog,
        ...updates,
        weekNumber: updates.weekNumber || currentLog.weekNumber,
        startDate: startDate,
        endDate: endDate,
        updatedAt: new Date().toISOString()
      };
      
      logs[index] = updatedLog;
      saveToStorage('logs', logs);
      
      // Handle notifications for status changes
      if (updates.status === 'needs-revision' && currentLog.status !== 'needs-revision') {
        const latestComment = updatedLog.comments && updatedLog.comments.length > 0 
          ? updatedLog.comments[updatedLog.comments.length - 1] 
          : null;
        
        this.createNotification({
          userId: updatedLog.createdBy,
          title: 'Log Needs Revision',
          message: `Your Week ${updatedLog.weekNumber} log needs revisions. ${latestComment ? `Reason: ${latestComment.text}` : ''}`,
          logId: id,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
      
      return updatedLog;
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