import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// To get these values, follow these steps:
// 1. Go to the Firebase Console: https://console.firebase.google.com/
// 2. Create a new project or select an existing one
// 3. Click on the web icon (</>) to add a web app to your project
// 4. Register your app with a nickname
// 5. Copy the firebaseConfig object values below
const firebaseConfig = {
  apiKey: "AIzaSyCCrPV5osjA0CcSSV5D2xFxvLrVZt7wmuE",
  authDomain: "all-log-rythm.firebaseapp.com",
  projectId: "all-log-rythm",
  storageBucket: "all-log-rythm.firebasestorage.app",
  messagingSenderId: "830456446157",
  appId: "1:830456446157:web:51ffe1f038b009c421fd84"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth }; 