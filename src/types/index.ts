import { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'team_lead' | 'guide' | 'coordinator';

export interface User {
  uid: string;
  name: string;
  role: UserRole;
  password: string; // In production, this should be hashed
}

export type LogStatus = 'draft' | 'pending-lead' | 'pending-guide' | 'approved' | 'needs-revision';

export interface LogEntry {
  author: string;
  role: UserRole;
  message: string;
  timestamp: Timestamp;
}

export interface Log {
  id?: string;
  week: number;
  dateRange: string;
  createdBy: string;
  createdAt: Timestamp;
  status: LogStatus;
  entries: LogEntry[];
  finalApproval?: {
    by: string;
    timestamp: Timestamp;
  };
}

export interface Notification {
  id?: string;
  to: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
} 