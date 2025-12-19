import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MantineProvider, Box } from '@mantine/core';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LogForm } from './pages/LogForm';
import { LogView } from './pages/LogView';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { TeamManagement } from './pages/TeamManagement';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { theme } from './theme';
import { AnimatePresence } from 'framer-motion';

function AppContent() {
  const location = useLocation();

  return (
    <Box style={{ minHeight: '100vh', height: '100%' }}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs/new"
            element={
              <ProtectedRoute allowedRoles={['member', 'team_lead', 'admin']}>
                <LogForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs/:id"
            element={
              <ProtectedRoute>
                <LogView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['member', 'team_lead', 'admin']}>
                <LogForm />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </Box>
  );
}

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </MantineProvider>
  );
}

export default App;
