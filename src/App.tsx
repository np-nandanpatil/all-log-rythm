import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, createTheme, AppShell, Group, Title, Text } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotificationCenter } from './components/NotificationCenter';
import { LogForm } from './pages/LogForm';
import { LogView } from './pages/LogView';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

// Create a theme instance
const theme = createTheme({
  primaryColor: 'purple',
  fontFamily: "'Orbitron', 'Rajdhani', 'Chakra Petch', sans-serif",
  colors: {
    purple: [
      '#F3E8FF', // lightest
      '#E9D5FF',
      '#D8B4FE',
      '#C084FC',
      '#A855F7',
      '#9333EA',
      '#7E22CE',
      '#6B21A8',
      '#581C87',
      '#3B0764', // darkest
    ],
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
    },
  },
});

function AppContent() {
  const { currentUser } = useAuth();

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications />
      <AppShell
        header={{ height: 60 }}
        padding="md"
        footer={{ height: 60 }}
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={3} c="purple">All Log Rythm</Title>
            <Group>
              {currentUser && <NotificationCenter />}
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Routes>
            <Route path="/login" element={<Login />} />
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
                <ProtectedRoute allowedRoles={['student', 'team_lead']}>
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
                <ProtectedRoute allowedRoles={['student', 'team_lead']}>
                  <LogForm />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AppShell.Main>

        <AppShell.Footer p="md">
          <Group justify="center">
            <Text size="sm" c="dimmed">
              Developed by{' '}
              <a 
                href="https://github.com/np-nandanpatil" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'var(--mantine-color-purple-6)' }}
              >
                Nandan
              </a>
            </Text>
          </Group>
        </AppShell.Footer>
      </AppShell>
    </MantineProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
