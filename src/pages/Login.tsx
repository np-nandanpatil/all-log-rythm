import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TextInput, Button, Paper, Title, Container, Alert, AppShell, Group, Text } from '@mantine/core';

console.log('Login component loaded');

export default function Login() {
  console.log('Login component rendering');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <AppShell.Main>
        <Container size={420} my={40}>
          <Title ta="center" c="purple">Welcome to All Log Rythm</Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            Enter your credentials to continue
          </Text>

          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert color="red" mb="md">
                  {error}
                </Alert>
              )}
              <TextInput
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <TextInput
                label="Password"
                type="password"
                placeholder="Your password"
                mt="md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                fullWidth 
                mt="xl" 
                loading={loading}
                color="purple"
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