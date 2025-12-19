import { useState } from 'react';
import { Container, Title, Text, Button, Stack, Group, Box, SimpleGrid, ThemeIcon, Paper } from '@mantine/core';
import { IconRocket, IconUsers, IconChartBar, IconShieldCheck } from '@tabler/icons-react';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const [authModalOpened, setAuthModalOpened] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { currentUser, loading, lastError } = useAuth();

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpened(true);
  };

  const features = [
    {
      icon: IconUsers,
      title: 'Team Collaboration',
      description: 'Seamless coordination between students, team leaders, and guides.'
    },
    {
      icon: IconChartBar,
      title: 'Progress Tracking',
      description: 'Visual insights and real-time updates on your internship journey.'
    },
    {
      icon: IconShieldCheck,
      title: 'Secure & Reliable',
      description: 'University-verified accounts with role-based access control.'
    },
    {
      icon: IconRocket,
      title: 'Instant Approvals',
      description: 'Automated workflows for faster log submissions and approvals.'
    }
  ];

  return (
    <>
      <Box style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
        {/* Hero Section */}
        <Box
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
            color: 'white',
            padding: 'clamp(3rem, 8vh, 6rem) 0',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }} />

          <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
            <Stack gap="xl" align="center" ta="center" py={{ base: 'xl', md: '3rem' }}>
              <Title
                order={1}
                fw={800}
                style={{
                  fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em'
                }}
              >
                Track Your Internship Journey
              </Title>

              <Text
                size="xl"
                maw={700}
                mx="auto"
                style={{
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                  opacity: 0.95,
                  lineHeight: 1.6
                }}
              >
                The modern platform for managing internship logs, team collaboration, and progress tracking—built for students, guides, and team leaders.
              </Text>

              <Group gap="md" mt="xl">
                <Button
                  size="xl"
                  variant="white"
                  color="indigo"
                  radius="md"
                  onClick={() => openAuth('signup')}
                  style={{ fontWeight: 600, fontSize: '1.1rem' }}
                >
                  Get Started Free
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  color="white"
                  radius="md"
                  onClick={() => openAuth('login')}
                  style={{ fontWeight: 600, fontSize: '1.1rem', borderWidth: 2 }}
                >
                  Sign In
                </Button>
              </Group>
            </Stack>
          </Container>
        </Box>

        {/* Features Section */}
        <Container size="lg" py={{ base: '3rem', md: '5rem' }}>
          <Stack gap="3rem">
            <Stack gap="xs" ta="center" maw={700} mx="auto">
              <Title order={2} fw={700} style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
                Everything You Need
              </Title>
              <Text c="dimmed" size="lg">
                Streamline your internship documentation with powerful features designed for academic excellence.
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
              {features.map((feature, index) => (
                <Paper key={index} p="xl" radius="lg" withBorder shadow="sm" style={{ height: '100%' }}>
                  <Stack gap="md">
                    <ThemeIcon size={60} radius="md" variant="light" color="indigo">
                      <feature.icon size={32} />
                    </ThemeIcon>
                    <div>
                      <Text fw={700} size="lg" mb={4}>{feature.title}</Text>
                      <Text c="dimmed" size="sm">{feature.description}</Text>
                    </div>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>

        {/* CTA Section */}
        <Box bg="indigo.6" py={{ base: '3rem', md: '4rem' }} style={{ color: 'white' }}>
          <Container size="md">
            <Stack gap="xl" align="center" ta="center">
              <Title order={2} fw={700} style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)' }}>
                Ready to Get Started?
              </Title>
              <Text size="lg" maw={600} mx="auto" style={{ opacity: 0.95 }}>
                Join students and teams already using All Log Rythm to streamline their internship tracking.
              </Text>
              <Button
                size="xl"
                variant="white"
                color="indigo"
                radius="md"
                onClick={() => openAuth('signup')}
                style={{ fontWeight: 600, fontSize: '1.1rem' }}
              >
                Create Your Account
              </Button>
            </Stack>
          </Container>
        </Box>

        {/* Footer */}
        <Box py="xl" bg="gray.1">
          <Container>
            <Text ta="center" c="dimmed" size="sm">
              © 2025 All Log Rythm. Built for academic excellence.
            </Text>
          </Container>
        </Box>
      </Box>

      {/* Auth Modal */}
      <AuthModal
        opened={authModalOpened}
        onClose={() => setAuthModalOpened(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />

      {/* DEBUG OVERLAY */}
      <Box style={{ position: 'fixed', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', color: 'white', padding: 10, borderRadius: 8, fontSize: 12, zIndex: 9999 }}>
        <div>Loading: {loading ? 'YES' : 'NO'}</div>
        <div>User: {currentUser ? currentUser.email : 'NULL'}</div>
        <div>Role: {currentUser ? currentUser.role : 'N/A'}</div>
        <div>Error: {lastError || 'NONE'}</div>
      </Box>
    </>
  );
}
