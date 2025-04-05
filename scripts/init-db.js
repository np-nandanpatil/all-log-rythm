import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const users = [
  {
    email: 'student1@example.com',
    password: 'student123',
    data: {
      uid: 'student1',
      name: 'Student One',
      role: 'student',
      email: 'student1@example.com'
    }
  },
  {
    email: 'student2@example.com',
    password: 'student123',
    data: {
      uid: 'student2',
      name: 'Student Two',
      role: 'student',
      email: 'student2@example.com'
    }
  },
  {
    email: 'student3@example.com',
    password: 'student123',
    data: {
      uid: 'student3',
      name: 'Student Three',
      role: 'student',
      email: 'student3@example.com'
    }
  },
  {
    email: 'teamlead@example.com',
    password: 'lead123',
    data: {
      uid: 'teamlead',
      name: 'Team Leader',
      role: 'team_lead',
      email: 'teamlead@example.com'
    }
  },
  {
    email: 'guide@example.com',
    password: 'guide123',
    data: {
      uid: 'guide',
      name: 'Project Guide',
      role: 'guide',
      email: 'guide@example.com'
    }
  },
  {
    email: 'coordinator@example.com',
    password: 'coord123',
    data: {
      uid: 'coordinator',
      name: 'Class Coordinator',
      role: 'coordinator',
      email: 'coordinator@example.com'
    }
  }
];

async function createAuthUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`User ${email} already exists, skipping auth creation`);
      return { uid: email.split('@')[0] }; // Return mock user with expected uid
    }
    throw error;
  }
}

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    for (const user of users) {
      // Create Authentication user
      const authUser = await createAuthUser(user.email, user.password);
      console.log(`Created auth user: ${user.email}`);
      
      // Create Firestore document
      await setDoc(doc(db, 'users', authUser.uid), user.data);
      console.log(`Created Firestore document for: ${user.data.name} (${user.data.role})`);
    }
    
    console.log('Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase(); 