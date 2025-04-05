import { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'team_lead' | 'guide' | 'coordinator';
export type LogStatus = 'draft' | 'pending-lead' | 'pending-guide' | 'approved' | 'needs-revision';

export interface User {
  uid: string;
  name: string;
  role: UserRole;
  email: string;
}

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
  status: LogStatus;
  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
  entries: LogEntry[];
  finalApproval?: {
    by: string;
    timestamp: Timestamp;
  };
} 