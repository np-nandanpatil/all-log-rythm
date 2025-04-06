# All Log Rythm
## Weekly Log Tracker

A web-based platform for submitting, reviewing, and approving weekly project updates by students and faculty.

## Firebase Setup

This project uses Firebase for data storage. To set up Firebase:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Click on the web icon (</>) to add a web app to your project
4. Register your app with a nickname
5. Copy the Firebase configuration object
6. Open `src/config/firebase.ts` and replace the placeholder values with your actual Firebase configuration

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

7. Set up Firestore Database:
   - In the Firebase Console, go to "Firestore Database"
   - Click "Create Database"
   - Choose a location and start in production mode
   - Create the following collections:
     - `users`: For storing user information
     - `logs`: For storing project logs
     - `notifications`: For storing user notifications

8. Set up Authentication (optional):
   - In the Firebase Console, go to "Authentication"
   - Click "Get Started"
   - Enable the authentication methods you want to use (Email/Password, Google, etc.)

## Development

To run the project locally:

```bash
npm install
npm run dev
```

## Building for Production

To build the project for production:

```bash
npm run build
```

## Features

- Role-based access control (Students, Team Lead, Guide, Coordinator)
- Weekly log submissions with approval workflow
- Real-time notifications
- Comments and feedback system
- Timestamped activity records

## Tech Stack

- React + TypeScript
- Vite
- Mantine UI
- React Router

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
