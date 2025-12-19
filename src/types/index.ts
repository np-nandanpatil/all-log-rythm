import { Timestamp } from 'firebase/firestore';

export type UserRole = 'member' | 'team_lead' | 'guide' | 'admin';

export interface User {
  id: string; // Unified id/uid to id for consistency
  uid?: string;
  name: string;
  role: UserRole;
  email: string;
  teamIds: string[]; // Array to support Guides managing multiple teams
  username?: string;
  createdAt?: string;
  profileIncomplete?: boolean; // Flag for auto-created profiles needing completion
}

export interface Team {
  id: string;
  name: string;
  referralCode: string; // For Members
  guideCode: string;    // For Guides
  leaderId: string;
  memberIds: string[];
  guideIds: string[];
  createdAt: Timestamp;
}

export type LogStatus = 'draft' | 'pending-lead' | 'pending-guide' | 'approved' | 'needs-revision';

export interface LogEntry {
  author: string;
  role: UserRole;
  message: string;
  timestamp: Timestamp;
}

export interface Activity {
  id: string;
  description: string;
  date: Timestamp;
  hours: number;
}

export interface LogComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Log {
  id?: string;
  weekNumber: number;
  week?: number;
  dateRange: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: LogStatus;
  createdBy: string;
  createdByName: string; // Explicit field for easier display
  teamId: string | null; // Critical for isolation, null for admin logs
  createdAt: Timestamp;
  updatedBy?: string;
  updatedAt: Timestamp;
  entries: LogEntry[];
  activities?: Activity[];
  comments?: LogComment[];
  finalApproval?: {
    by: string;
    timestamp: Timestamp;
  };
}

export interface Notification {
  id?: string;
  to: string; // userId
  userId?: string;
  title?: string;
  message: string;
  timestamp: Timestamp;
  createdAt?: Timestamp | Date | string;
  read: boolean;
  logId?: string;
} 