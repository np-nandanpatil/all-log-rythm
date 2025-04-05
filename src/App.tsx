import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, createTheme, AppShell, Group, Title } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotificationCenter } from './components/NotificationCenter';
import { ThemeToggle } from './components/ThemeToggle';
import { LogForm } from './pages/LogForm';
import { LogView } from './pages/LogView';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

console.log('App component loaded');

// Create a theme instance
const createAppTheme = (isDarkMode: boolean) => createTheme({
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
    AppShell: {
      styles: {
        header: {
          borderBottom: isDarkMode 
            ? '1px solid var(--mantine-color-dark-4)' 
            : '1px solid var(--mantine-color-gray-2)',
        },
      },
    },
  },
});

function AppContent() {
  const { isDarkMode } = useTheme();
  const { currentUser } = useAuth();
  const theme = createAppTheme(isDarkMode);

  console.log('App component rendering');
  
  return (
    <MantineProvider theme={theme} defaultColorScheme={isDarkMode ? 'dark' : 'light'}>
      <Notifications />
      <AppShell
        header={{ height: 60 }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={3} c="purple">ExposeNet log</Title>
            <Group>
              <ThemeToggle />
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
      </AppShell>
    </MantineProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
