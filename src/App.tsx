import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, createTheme, AppShell, Group, Title, Text } from '@mantine/core';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LogForm } from './pages/LogForm';
import { LogView } from './pages/LogView';
import '@mantine/core/styles.css';
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
        variant: 'light',
      },
      styles: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 0 15px rgba(87, 227, 242, 0.5)',
          },
        },
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
      styles: {
        root: {
          background: 'rgba(26, 27, 30, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(87, 227, 242, 0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 0 20px rgba(87, 227, 242, 0.2)',
          },
        },
      },
    },
    Paper: {
      styles: {
        root: {
          background: 'rgba(26, 27, 30, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(87, 227, 242, 0.1)',
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          background: 'rgba(26, 27, 30, 0.8)',
          border: '1px solid rgba(87, 227, 242, 0.1)',
          color: '#C1C2C5',
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            borderColor: 'rgba(87, 227, 242, 0.3)',
            boxShadow: '0 0 10px rgba(87, 227, 242, 0.2)',
          },
        },
        label: {
          color: '#C1C2C5',
        },
      },
    },
    Textarea: {
      styles: {
        input: {
          background: 'rgba(26, 27, 30, 0.8)',
          border: '1px solid rgba(87, 227, 242, 0.1)',
          color: '#C1C2C5',
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            borderColor: 'rgba(87, 227, 242, 0.3)',
            boxShadow: '0 0 10px rgba(87, 227, 242, 0.2)',
          },
        },
        label: {
          color: '#C1C2C5',
        },
      },
    },
    Select: {
      styles: {
        input: {
          background: 'rgba(26, 27, 30, 0.8)',
          border: '1px solid rgba(87, 227, 242, 0.1)',
          color: '#C1C2C5',
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            borderColor: 'rgba(87, 227, 242, 0.3)',
            boxShadow: '0 0 10px rgba(87, 227, 242, 0.2)',
          },
        },
        label: {
          color: '#C1C2C5',
        },
        dropdown: {
          background: 'rgba(26, 27, 30, 0.95)',
          border: '1px solid rgba(87, 227, 242, 0.1)',
          backdropFilter: 'blur(10px)',
        },
        item: {
          color: '#C1C2C5',
          '&:hover': {
            background: 'rgba(87, 227, 242, 0.1)',
          },
        },
      },
    },
    DateInput: {
      styles: {
        input: {
          background: 'rgba(26, 27, 30, 0.8)',
          border: '1px solid rgba(87, 227, 242, 0.1)',
          color: '#C1C2C5',
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            borderColor: 'rgba(87, 227, 242, 0.3)',
            boxShadow: '0 0 10px rgba(87, 227, 242, 0.2)',
          },
        },
        label: {
          color: '#C1C2C5',
        },
      },
    },
  },
});

function AppContent() {
  const { currentUser } = useAuth();

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
      footer={{ height: 60 }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3} c="purple">All Log Rythm</Title>
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
        <Group justify="center" align="center" gap="md">
          <Text size="sm" c="dimmed">
            Developed by{' '}
            <img 
              src="public/Logo-white.png" 
              alt="Logo" 
              style={{ 
                height: '24px', 
                width: '24px',
                borderRadius: '50%',
                objectFit: 'cover',
                verticalAlign: 'middle',
                margin: '0 4px'
              }} 
            />
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
  );
}

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </MantineProvider>
  );
}

export default App;
