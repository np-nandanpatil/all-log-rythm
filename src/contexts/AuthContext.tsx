import React, { createContext, useContext, useState, useEffect } from 'react';
import usersData from '../data/users.json';

console.log('AuthContext loaded');

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'team_lead' | 'guide' | 'coordinator';
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider rendering');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for stored user data on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  async function login(email: string, password: string) {
    console.log('Attempting login for:', email);
    setLoading(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user = usersData.users.find(
        u => u.email === email && u.password === password
      );

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;
      
      console.log('Login successful for:', user.email);
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    console.log('Signing out');
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    console.log('Sign out successful');
  }

  const value = {
    currentUser,
    loading,
    login,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 