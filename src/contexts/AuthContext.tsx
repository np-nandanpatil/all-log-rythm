import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { User, UserRole } from '../types';



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

  // Helper to sync approved team requests (Lazy Join)
  const syncApprovedTeams = async (uid: string, email: string, currentTeamIds: string[]) => {
    try {
      if (!email) return currentTeamIds;


      const q = query(
        collection(db, 'invitations'),
        where('invitedEmail', '==', email),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return currentTeamIds;

      const newTeamIds: string[] = [];
      const inviteIdsToDelete: string[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.teamId && !currentTeamIds.includes(data.teamId)) {
          newTeamIds.push(data.teamId);
        }
        inviteIdsToDelete.push(doc.id);
      });

      if (newTeamIds.length > 0) {

        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          teamIds: arrayUnion(...newTeamIds)
        });

        // Return updated list
        return [...currentTeamIds, ...newTeamIds];
      }

      // Cleanup consumed invitations
      if (inviteIdsToDelete.length > 0) {
        await Promise.all(inviteIdsToDelete.map(id => deleteDoc(doc(db, 'invitations', id))));
      }

      return currentTeamIds;
    } catch (err) {
      console.error('Error syncing approved teams:', err);
      return currentTeamIds;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (isSigningUp.current) {

        return;
      }

      setLoading(true);
      if (user) {
        try {

          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {

            const userData = userDoc.data();

            // SUPER ADMIN ENFORCEMENT
            let finalRole = userData.role as UserRole;
            if (user.email === 'nandanpatilm15@gmail.com' && finalRole !== 'admin') {

              finalRole = 'admin';
              // Update Firestore to reflect this permanently
              const { updateDoc } = await import('firebase/firestore');
              await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
            }

            // Sync Approved Teams (Lazy Join Check)
            const updatedTeamIds = await syncApprovedTeams(
              user.uid,
              userData.email || user.email || '',
              userData.teamIds || []
            );

            setCurrentUser({
              uid: user.uid,
              name: userData.name || '',
              ...userData,
              teamIds: updatedTeamIds,
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
          // Sync Approved Teams
          const updatedTeamIds = await syncApprovedTeams(
            auth.currentUser.uid,
            userData.email || auth.currentUser.email || '',
            userData.teamIds || []
          );

          setCurrentUser({
            uid: auth.currentUser.uid,
            name: userData.name || '',
            role: userData.role as UserRole,
            ...userData,
            teamIds: updatedTeamIds
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

      // 1. Create User Document FIRST (with empty teams)
      const newUser: User = {
        id: uid,
        uid,
        name: userData.name,
        email,
        role: userData.role,
        teamIds: [], // Will be updated by createTeam/joinTeam
        createdAt: new Date().toISOString()
      };


      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', uid), newUser);


      // 2. Handle Team Creation / Joining
      let teamIdToJoin: string | null = null;
      let invitationIdToAccept: string | null = null;

      const { firebaseService } = await import('../services');

      if (teamData?.createTeam) {
        // This will now successfully update the user doc we just created
        await firebaseService.createTeam(teamData.teamName, uid);
        // Auto-refresh handled by final refreshUser call
      } else if (['member', 'guide'].includes(userData.role)) {
        // ... (Invitation logic same as before)

        // Check invitations

        const invitations = await firebaseService.getInvitationsByEmail(email);
        if (invitations.length > 0) {
          const invitation: any = invitations[0];

          teamIdToJoin = invitation.teamId;
          invitationIdToAccept = invitation.id;
        }
        // Check code
        else if (teamData?.joinCode) {
          const type = userData.role === 'guide' ? 'guide' : 'referral';
          const team = await firebaseService.getTeamByCode(teamData.joinCode, type);
          if (team) teamIdToJoin = team.id;
        } else {
          // MANDATORY CHECK
          console.error('DEBUG: No referral code provided for signup');
          const { deleteUser } = await import('firebase/auth');
          await deleteUser(userCredential.user);
          // Also delete the user doc we just made to clean up
          const { deleteDoc } = await import('firebase/firestore');
          await deleteDoc(doc(db, 'users', uid));
          throw new Error('Referral Code is MANDATORY. You must join a team to sign up.');
        }
      }

      // Join Team Logic
      if (invitationIdToAccept && teamIdToJoin) {

        await firebaseService.acceptInvitation(invitationIdToAccept, uid);
      } else if (teamIdToJoin) {

        await firebaseService.joinTeamByCode(
          teamData?.joinCode || '', // We need the code if joining by code
          uid,
          email,
          userData.name
        );
      }

      // 3. Final State Update
      // We call refreshUser to ensure we get the latest state including any team updates
      await refreshUser();

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