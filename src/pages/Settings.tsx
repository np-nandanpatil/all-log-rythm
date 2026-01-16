import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Switch,
  Stack,
  Divider,
  Group,
  Button,
  Badge,
  useMantineColorScheme,
  useComputedColorScheme
} from '@mantine/core';
import { IconBell, IconMoon, IconSun, IconShieldLock, IconMail } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { notifications } from '@mantine/notifications';
import { sendPasswordResetEmail } from 'firebase/auth'; // Import directly from firebase/auth or service
import { auth } from '../config/firebase'; // Assuming auth is exported from config

export function Settings() {
  const { currentUser } = useAuth();

  // Persistence for Notifications (Local Storage for demo)
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem('settings_email_notify') !== 'false';
  });
  const [pushNotifications, setPushNotifications] = useState(() => {
    return localStorage.getItem('settings_push_notify') === 'true';
  });

  // Dark Mode
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const [resetSending, setResetSending] = useState(false);

  useEffect(() => {
    localStorage.setItem('settings_email_notify', String(emailNotifications));
  }, [emailNotifications]);

  useEffect(() => {
    localStorage.setItem('settings_push_notify', String(pushNotifications));
  }, [pushNotifications]);

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    if (!window.confirm(`Send password reset email to ${currentUser.email}?`)) return;

    setResetSending(true);
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      notifications.show({
        title: 'Email Sent',
        message: 'Check your inbox for password reset instructions.',
        color: 'green'
      });
    } catch (error) {
      console.error("Reset Error:", error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send reset email. Try again later.',
        color: 'red'
      });
    } finally {
      setResetSending(false);
    }
  };

  return (
    <Layout>
      <Container size="md" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <Group>
            <Title order={2}>Settings & Preferences</Title>
          </Group>

          <Divider />

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
                    aria-label="Toggle email notifications"
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
                    aria-label="Toggle push notifications"
                  />
                </Group>
              </Stack>
            </Stack>
          </Paper>

          {/* Appearance Settings */}
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="lg">
              <Group>
                {computedColorScheme === 'dark' ? <IconMoon size={24} stroke={1.5} /> : <IconSun size={24} stroke={1.5} />}
                <Title order={3} size="h4">Appearance</Title>
              </Group>

              <Group justify="space-between">
                <div>
                  <Text fw={500}>Dark Mode</Text>
                  <Text size="sm" c="dimmed">
                    Switch between light and dark themes
                  </Text>
                </div>
                <Switch
                  checked={computedColorScheme === 'dark'}
                  onChange={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
                  color="indigo"
                  size="md"
                  onLabel={<IconMoon size={16} stroke={2.5} color="var(--mantine-color-yellow-4)" />}
                  offLabel={<IconSun size={16} stroke={2.5} color="var(--mantine-color-blue-6)" />}
                  aria-label="Toggle dark mode"
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
                <Group gap="xs">
                  <IconMail size={16} style={{ opacity: 0.5 }} />
                  <Text size="sm" fw={500}>{currentUser?.email}</Text>
                </Group>
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
                  c="dimmed"
                >
                  {currentUser?.uid}
                </Text>
              </Group>
            </Stack>
          </Paper>

          {/* Privacy & Security */}
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Group>
                <IconShieldLock size={24} stroke={1.5} />
                <Title order={3} size="h4">Privacy & Security</Title>
              </Group>

              <Group justify="space-between" align="center">
                <div>
                  <Text fw={500}>Password</Text>
                  <Text size="sm" c="dimmed">Secure your account by updating your password regularly.</Text>
                </div>
                <Button
                  variant="light"
                  color="red"
                  onClick={handlePasswordReset}
                  loading={resetSending}
                >
                  Change Password
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Layout>
  );
}
