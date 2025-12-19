import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { User, UserRole } from '../types';

console.log('AuthContext loaded');

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userData: any, teamData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  lastError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const isSigningUp = React.useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('DEBUG: Auth State Changed:', user ? user.uid : 'No User');
      if (isSigningUp.current) {
        console.log('Skipping auth state change during signup');
        return;
      }

      setLoading(true);
      if (user) {
        try {
          console.log('DEBUG: Fetching user profile for:', user.uid);
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            console.log('DEBUG: User profile found');
            const userData = userDoc.data();
            
            // SUPER ADMIN ENFORCEMENT
            let finalRole = userData.role as UserRole;
            if (user.email === 'nandanpatilm15@gmail.com' && finalRole !== 'admin') {
                console.log('DEBUG: Enforcing Super Admin Role for Creator');
                finalRole = 'admin';
                // Update Firestore to reflect this permanently
                const { updateDoc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
            }

            setCurrentUser({
              uid: user.uid,
              name: userData.name || '',
              ...userData,
              role: finalRole // Ensure override
            } as User);
          } else {
            console.warn('DEBUG: User document NOT found for', user.uid, '- Auto-creating basic profile');
            
            // Auto-create a basic user document for missing profiles
            const isSuperAdmin = user.email === 'nandanpatilm15@gmail.com';
            const basicUserData: User = {
              id: user.uid,
              uid: user.uid,
              name: user.displayName || 'User', 
              email: user.email || '',
              role: (isSuperAdmin ? 'admin' : 'member') as UserRole, // Default 'member'
              teamIds: [],
              createdAt: new Date().toISOString(),
              profileIncomplete: !isSuperAdmin // Admins might not need this flow
            };
            
            // Create the user document in Firestore
            const { setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, 'users', user.uid), basicUserData);
            console.log('DEBUG: Auto-created user document for', user.uid);
            
            // Set the current user with the basic profile
            setCurrentUser(basicUserData);
            setLastError('Profile auto-created. Please complete your profile.');
          }
        } catch (error: any) {
          console.error('DEBUG: Error fetching user profile:', error);
          setLastError(`Fetch profile error: ${error.message}`);
          setCurrentUser(null);
        }
      } else {
        console.log('DEBUG: No user in auth state');
        // Don't set error here, as null user is valid state
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            uid: auth.currentUser.uid,
            name: userData.name || '',
            role: userData.role as UserRole,
            ...userData
          } as User);
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const signup = async (email: string, password: string, userData: any, teamData?: any) => {
    isSigningUp.current = true;
    setLoading(true);
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Handle Team Creation if needed
      let teamIdToJoin: string | null = null;
      let newTeamId: string | null = null;
      let invitationIdToAccept: string | null = null;

      const { firebaseService } = await import('../services');

      if (teamData?.createTeam) {
          const team = await firebaseService.createTeam(teamData.teamName, uid);
          newTeamId = team.id;
      } else if (['member', 'guide'].includes(userData.role)) {
          // 1. Check for email invitations
          console.log('DEBUG: Checking invitations for', email);
          const invitations = await firebaseService.getInvitationsByEmail(email);
          if (invitations.length > 0) {
              const invitation: any = invitations[0];
              console.log('DEBUG: Found invitation', invitation.id, 'for team', invitation.teamId);
              teamIdToJoin = invitation.teamId;
              invitationIdToAccept = invitation.id;
          } 
          // 2. If no invitation, check referral code
          else if (teamData?.joinCode) {
              const type = userData.role === 'guide' ? 'guide' : 'referral';
              const team = await firebaseService.getTeamByCode(teamData.joinCode, type);
              if (team) teamIdToJoin = team.id;
          }
      }

      const teamIds = [];
      if (newTeamId) teamIds.push(newTeamId);
      if (teamIdToJoin) teamIds.push(teamIdToJoin);

      const newUser: User = {
          id: uid,
          uid,
          name: userData.name,
          email,
          role: userData.role,
          teamIds,
          createdAt: new Date().toISOString()
      };

      // Create User Document
      console.log('DEBUG: Writing user document to Firestore');
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', uid), newUser);
      console.log('DEBUG: User document written successfully');

      // Join Team Logic
      if (invitationIdToAccept && teamIdToJoin) {
          console.log('DEBUG: Accepting invitation', invitationIdToAccept);
          await firebaseService.acceptInvitation(invitationIdToAccept, uid);
      } else if (teamIdToJoin) {
          console.log('DEBUG: Joining team via code', teamIdToJoin);
          await firebaseService.joinTeamById(teamIdToJoin, uid, userData.role);
      }


      // Manually set state to avoid race conditions
      console.log('DEBUG: Manually setting current user');
      setCurrentUser(newUser);
      
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
      isSigningUp.current = false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, signOut, refreshUser, lastError }}>
      {children}
    </AuthContext.Provider>
  );
}; 