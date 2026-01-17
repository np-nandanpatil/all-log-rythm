# LogSphere 🚀

> **Master Your Projects & Internships**  
> A comprehensive platform for engineering teams to track daily progress, manage milestones, and generate official internship reports.

![LogSphere Banner](/path/to/banner.png) *You can add a screenshot here*

## 🌟 Key Features

### 🛡️ For Students & Interns
- **Daily Activity Logs**: Track your work with precision using the new Daily Log system.
- **Team Collaboration**: Join teams securely with referral codes.
- **Milestone Tracking**: Visual timeline of project phases (Planned, In-Progress, Completed).
- **PDF Reports**: One-click generation of official activity reports for university submissions.
- **Premium UI**: Modern, glassmorphism-inspired interface with Dark Mode support.

### 👔 For Faculty & Guides
- **Multi-Team Management**: Switch seamlessly between multiple student teams.
- **Join Authorization**: Role-based approval system for new members.
- **Smart Analytics**: Visual charts for weekly team performance and effort distribution.
- **Official Records**: Verify and approve logs with a verifiable digital audit trail.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Mantine UI (v7), Framer Motion, Recharts
- **Backend / DB**: Firebase (Authentication, Firestore)
- **Reporting**: `react-to-print`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/logsphere.git
   cd logsphere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

---

## 🔒 Security & Rules

LogSphere enforces strict Firestore Security Rules:
- **Team Isolation**: Members can only access logs within their assigned team.
- **Role Protection**: Only Team Leaders can approve join requests or manage milestones.
- **Immutable History**: Logs cannot be modified by others once submitted.

---

## 📄 License

This project is licensed under the MIT License.
