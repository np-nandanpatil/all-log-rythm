import { useState } from 'react';
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  Switch, 
  Stack, 
  Divider,
  Group,
  Alert,
  Badge
} from '@mantine/core';
import { IconSettings, IconBell, IconMoon, IconInfoCircle } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';

export function Settings() {
  const { currentUser } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <Layout>
      <Container size="md" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <Group>
            <IconSettings size={32} stroke={1.5} />
            <Title order={2}>Settings</Title>
          </Group>

          <Divider />

          {/* Info Alert */}
          <Alert 
            icon={<IconInfoCircle size={16} />} 
            title="Settings Coming Soon" 
            color="blue"
            variant="light"
          >
            Additional settings and preferences will be available in future updates.
          </Alert>

          {/* Notifications Settings */}
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="lg">
              <Group>
                <IconBell size={24} stroke={1.5} />
                <Title order={3} size="h4">Notifications</Title>
              </Group>

              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>Email Notifications</Text>
                    <Text size="sm" c="dimmed">
                      Receive email updates about log approvals and comments
                    </Text>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.currentTarget.checked)}
                    color="indigo"
                    size="md"
                  />
                </Group>

                <Group justify="space-between">
                  <div>
                    <Text fw={500}>Push Notifications</Text>
                    <Text size="sm" c="dimmed">
                      Get instant notifications for important updates
                    </Text>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.currentTarget.checked)}
                    color="indigo"
                    size="md"
                  />
                </Group>
              </Stack>
            </Stack>
          </Paper>

          {/* Appearance Settings */}
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="lg">
              <Group>
                <IconMoon size={24} stroke={1.5} />
                <Title order={3} size="h4">Appearance</Title>
              </Group>

              <Group justify="space-between">
                <div>
                  <Text fw={500}>Dark Mode</Text>
                  <Text size="sm" c="dimmed">
                    Switch to dark theme (Coming soon)
                  </Text>
                </div>
                <Switch
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.currentTarget.checked)}
                  color="indigo"
                  size="md"
                  disabled
                />
              </Group>
            </Stack>
          </Paper>

          {/* Account Information */}
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Title order={3} size="h4">Account Details</Title>
              
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Email</Text>
                <Text size="sm" fw={500}>{currentUser?.email}</Text>
              </Group>

              <Group justify="space-between">
                <Text size="sm" c="dimmed">Role</Text>
                <Badge color="indigo" variant="light">
                  {(currentUser?.role || 'guest').replace('_', ' ').toUpperCase()}
                </Badge>
              </Group>

              <Group justify="space-between">
                <Text size="sm" c="dimmed">User ID</Text>
                <Text 
                  size="xs" 
                  fw={500} 
                  style={{ fontFamily: 'monospace' }}
                >
                  {currentUser?.uid?.substring(0, 20)}...
                </Text>
              </Group>
            </Stack>
          </Paper>

          {/* Privacy & Security (Placeholder) */}
          <Paper p="xl" radius="md" withBorder style={{ opacity: 0.6 }}>
            <Stack gap="md">
              <Title order={3} size="h4">Privacy & Security</Title>
              <Text size="sm" c="dimmed">
                Password change and security settings will be available soon.
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Layout>
  );
}
