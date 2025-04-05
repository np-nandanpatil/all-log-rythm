export type UserRole = 'student' | 'team-lead' | 'guide' | 'coordinator';

export interface User {
  uid: string;
  name: string;
  role: UserRole;
  email?: string;
}

export interface AuthUser extends User {
  password: string;
} 