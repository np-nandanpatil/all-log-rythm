# Firebase Setup Guide for All Log Rythm

This guide will help you set up Firebase for the All Log Rythm project.

## Prerequisites

- Node.js and npm installed
- A Firebase account (create one at [firebase.google.com](https://firebase.google.com) if you don't have one)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "all-log-rythm")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project, click on the web icon (</>) to add a web app
2. Register your app with a nickname (e.g., "all-log-rythm-web")
3. You don't need to set up Firebase Hosting for now
4. Click "Register app"
5. You'll see a configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 3: Set Up Firestore Database

1. In the Firebase Console, go to "Firestore Database" in the left sidebar
2. Click "Create Database"
3. Choose a location (preferably close to your users)
4. Start in production mode
5. Click "Enable"

## Step 4: Create Collections

1. In the Firestore Database, click "Start collection"
2. Create the following collections:
   - `users`: For storing user information
   - `logs`: For storing project logs
   - `notifications`: For storing user notifications

## Step 5: Update Your Project Configuration

You can use the provided script to update your Firebase configuration:

```bash
npm run setup-firebase
```

This will prompt you to enter your Firebase configuration values.

Alternatively, you can manually update the `src/config/firebase.ts` file with your Firebase configuration values.

## Step 6: Run Your Application

```bash
npm run dev
```

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors
2. Make sure your Firebase configuration is correct
3. Ensure you've created all the required collections in Firestore
4. Check that your Firebase project has the necessary permissions

## Security Rules

For production, you should set up proper security rules for your Firestore database. Here's a basic example:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /logs/{logId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.createdBy == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'team_lead');
    }
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null;
    }
  }
}
```

These rules ensure that:
- Only authenticated users can read user data
- Users can only modify their own user data
- Only authenticated users can read logs
- Only authenticated users can create logs
- Only the creator of a log or a team lead can update or delete logs
- Users can only read their own notifications
- Only authenticated users can create notifications 