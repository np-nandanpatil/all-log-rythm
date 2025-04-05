# Weekly Log Tracker

A web-based platform for submitting, reviewing, and approving weekly project updates by students and faculty.

## Features

- Role-based access control (Students, Team Lead, Guide, Coordinator)
- Weekly log submissions with approval workflow
- Real-time notifications
- Comments and feedback system
- Timestamped activity records

## Tech Stack

- React + TypeScript
- Vite
- Firebase (Firestore, Authentication)
- Mantine UI
- React Router

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd project-log-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Firebase project and enable Firestore and Authentication.

4. Copy the Firebase configuration values to `.env`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. Initialize the database with user accounts:
   ```javascript
   // Example user document in Firestore
   {
     uid: "student01",
     name: "Student A",
     role: "student",
     password: "static123"
   }
   ```

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
/project-log-platform
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (auth, etc.)
│   ├── pages/         # Page components
│   ├── types/         # TypeScript type definitions
│   ├── config/        # Configuration files
│   └── App.tsx        # Main application component
├── public/            # Static assets
└── package.json       # Project dependencies
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
