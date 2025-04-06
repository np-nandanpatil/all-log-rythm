import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, AppShell, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';

console.log('Login component loaded');

export function Login() {
  console.log('Login component rendering');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Form submitted with:', { username });
    
    if (!username || !password) {
      notifications.show({
        title: 'Error',
        message: 'Please enter both username and password',
        color: 'red'
      });
      return;
    }
    
    try {
      setLoading(true);
      await login(username, password);
      console.log('Login successful');
      notifications.show({
        title: 'Success',
        message: 'Logged in successfully',
        color: 'green'
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to log in. Please check your credentials.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header p="xs">
        <Group justify="space-between">
          <Title order={3} c="purple">All Log Rythm</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size={420} my={40}>
          <Title ta="center" c="purple">Welcome to All Log Rythm</Title>
          <Text ta="center"><br/>Major Project Phase 1 - Group 1</Text>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            Enter your credentials to continue
          </Text>

          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <form onSubmit={handleSubmit}>
              <TextInput
                label="Username"
                placeholder="Enter your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                radius="md"
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                required
                mt="md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                radius="md"
              />
              <Button 
                fullWidth 
                mt="xl" 
                type="submit" 
                loading={loading}
                color="indigo"
                radius="md"
              >
                Sign in
              </Button>
            </form>
          </Paper>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
} 