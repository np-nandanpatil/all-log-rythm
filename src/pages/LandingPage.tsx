import { useState } from 'react';
import { Container, Title, Text, Button, Stack, Group, Box, SimpleGrid, ThemeIcon, Paper, Grid, Badge, Accordion } from '@mantine/core';
import { IconRocket, IconUsers, IconShieldCheck, IconBrain, IconClock, IconDeviceAnalytics, IconArrowRight, IconCheck } from '@tabler/icons-react';
import { AuthModal } from '../components/AuthModal';

export default function LandingPage() {
  const [authModalOpened, setAuthModalOpened] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpened(true);
  };

  return (
    <>
      <Box style={{ overflowX: 'hidden' }}>
        {/* HERO SECTION */}
        <Box
          style={{
            position: 'relative',
            background: 'radial-gradient(ellipse at top, var(--mantine-color-indigo-0) 0%, rgba(255,255,255,0) 60%)',
            paddingBottom: '4rem'
          }}
        >
          <Container size="lg" pt={{ base: '4rem', md: '8rem' }} pb={{ base: '3rem', md: '5rem' }}>
            <Stack gap="xl" align="center" ta="center">
              <Badge
                size="lg"
                variant="gradient"
                gradient={{ from: 'indigo', to: 'cyan' }}
                radius="xl"
              >
                New: Project Management Suite 🚀
              </Badge>

              <Title
                order={1}
                fw={900}
                style={{
                  fontSize: 'clamp(2.5rem, 6vw, 4.8rem)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  color: 'var(--mantine-color-dark-9)'
                }}
              >
                Master Your <span style={{
                  background: 'linear-gradient(45deg, var(--mantine-color-indigo-6), var(--mantine-color-cyan-6))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Projects</span><br />
                & <span style={{
                  background: 'linear-gradient(45deg, var(--mantine-color-violet-6), var(--mantine-color-pink-6))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Internships</span>
              </Title>

              <Text c="dimmed" size="xl" maw={600} mx="auto" lh={1.6}>
                LogSphere is the unified workspace for engineering teams. Track milestones, approve weekly logs, and sync with your guides—all in one premium dashboard.
              </Text>

              <Group gap="md">
                <Button size="xl" radius="md" color="indigo" onClick={() => openAuth('signup')} rightSection={<IconArrowRight size={18} />}>
                  Get Started Free
                </Button>
                <Button size="xl" radius="md" variant="default" onClick={() => openAuth('login')}>
                  Sign In
                </Button>
              </Group>

              {/* Verified Badge */}
              <Group gap="xs" mt="sm">
                <IconCheck size={16} color="var(--mantine-color-teal-6)" />
                <Text size="sm" c="dimmed">Trusted by 50+ Engineering Colleges</Text>
              </Group>
            </Stack>
          </Container>
        </Box>

        {/* BENTO GRID FEATURES */}
        <Container size="lg" py={{ base: '3rem', md: '6rem' }}>
          <Stack gap="xl" mb="4rem" ta="center">
            <Title order={2} style={{ fontSize: '2.5rem' }}>Everything in One Sphere</Title>
            <Text c="dimmed" size="lg" maw={600} mx="auto">From Capstone projects to Industrial Training, LogSphere adapts to your academic needs.</Text>
          </Stack>

          <Grid gutter="lg">
            {/* Main Large Card */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper h="100%" p="xl" radius="lg" withBorder style={{
                background: 'linear-gradient(135deg, var(--mantine-color-indigo-0) 0%, white 100%)',
                borderColor: 'var(--mantine-color-indigo-1)'
              }}>
                <Stack align="flex-start" h="100%" justify="space-between">
                  <div>
                    <ThemeIcon size={50} radius="md" color="indigo" variant="light" mb="md">
                      <IconRocket size={28} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Capstone Project Management</Title>
                    <Text c="dimmed">
                      Track every sprint, milestone, and deliverable. Guides can review progress in real-time, eliminating the need for messy email threads.
                    </Text>
                  </div>
                  {/* Abstract UI representation */}
                  <Box w="100%" h={150} bg="white" style={{ borderRadius: 12, border: '1px solid var(--mantine-color-gray-2)', opacity: 0.8 }} mt="xl" p="md">
                    <Group justify="space-between" mb="sm">
                      <Badge color="yellow">Sprint 3</Badge>
                      <Badge variant="outline">4 Days Left</Badge>
                    </Group>
                    <Box w="60%" h={8} bg="gray.1" style={{ borderRadius: 4 }} mb={8}>
                      <Box w="70%" h="100%" bg="indigo" style={{ borderRadius: 4 }} />
                    </Box>
                    <Text size="xs" c="dimmed">System Architecture Refinement</Text>
                  </Box>
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Side Vertical Card */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Paper h="100%" p="xl" radius="lg" withBorder bg="dark.9" style={{ color: 'white' }}>
                <Stack h="100%" justify="space-between">
                  <div>
                    <ThemeIcon size={50} radius="md" color="lime" variant="light" mb="md">
                      <IconDeviceAnalytics size={28} />
                    </ThemeIcon>
                    <Title order={3} mb="xs" c="white">Smart Analytics</Title>
                    <Text c="gray.4">
                      Visualize your hours, tech stack usage, and team contribution velocity. Perfect for final presentation reports.
                    </Text>
                  </div>
                  <SimpleGrid cols={2} spacing="xs">
                    <Box p="sm" bg="rgba(255,255,255,0.1)" style={{ borderRadius: 8 }}>
                      <Text size="xs" c="gray.5">Total Hours</Text>
                      <Text fw={700} size="xl">142h</Text>
                    </Box>
                    <Box p="sm" bg="rgba(255,255,255,0.1)" style={{ borderRadius: 8 }}>
                      <Text size="xs" c="gray.5">Logs</Text>
                      <Text fw={700} size="xl">24</Text>
                    </Box>
                  </SimpleGrid>
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Small Card 1 */}
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper p="xl" radius="lg" withBorder h="100%">
                <ThemeIcon size={40} radius="md" color="cyan" variant="light" mb="md">
                  <IconUsers size={24} />
                </ThemeIcon>
                <Title order={4} mb="xs">Role-Based Access</Title>
                <Text size="sm" c="dimmed">Dedicated portals for Students, Team Leaders, Faculty Guides, and Admins.</Text>
              </Paper>
            </Grid.Col>

            {/* Small Card 2 */}
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper p="xl" radius="lg" withBorder h="100%">
                <ThemeIcon size={40} radius="md" color="pink" variant="light" mb="md">
                  <IconClock size={24} />
                </ThemeIcon>
                <Title order={4} mb="xs">Instant Approvals</Title>
                <Text size="sm" c="dimmed">One-click approvals for Team Leads. No more chasing signatures physically.</Text>
              </Paper>
            </Grid.Col>

            {/* Small Card 3 */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="xl" radius="lg" withBorder h="100%" bg="gray.0">
                <ThemeIcon size={40} radius="md" color="orange" variant="light" mb="md">
                  <IconBrain size={24} />
                </ThemeIcon>
                <Title order={4} mb="xs">AI Ready Data</Title>
                <Text size="sm" c="dimmed">Export your logs in clean formats ready for LLM-based report generation.</Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>

        {/* STATS / TRUST */}
        <Box bg="dark.9" c="white" py="5rem">
          <Container size="lg">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="4rem">
              <Stack align="center" ta="center">
                <Text fw={900} style={{ fontSize: '3.5rem', lineHeight: 1 }}>5,000+</Text>
                <Text c="gray.5" fw={500}>Logs Submitted</Text>
              </Stack>
              <Stack align="center" ta="center">
                <Text fw={900} style={{ fontSize: '3.5rem', lineHeight: 1 }} c="indigo.4">150+</Text>
                <Text c="gray.5" fw={500}>Active Teams</Text>
              </Stack>
              <Stack align="center" ta="center">
                <Text fw={900} style={{ fontSize: '3.5rem', lineHeight: 1 }} c="teal.4">98%</Text>
                <Text c="gray.5" fw={500}>Completion Rate</Text>
              </Stack>
            </SimpleGrid>
          </Container>
        </Box>

        {/* FAQ SECTION */}
        <Container size="md" py="6rem">
          <Title order={2} ta="center" mb="3rem">Frequently Asked Questions</Title>
          <Accordion variant="separated" radius="md" chevronPosition="right">
            <Accordion.Item value="item-1">
              <Accordion.Control icon={<IconRocket size={20} color="var(--mantine-color-indigo-6)" />}>
                Can I use LogSphere for my final year Capstone Project?
              </Accordion.Control>
              <Accordion.Panel>Yes! LogSphere is fully optimized for Capstone projects. You can create a team, invite your project guide (faculty), and track weekly progress milestones just like an internship log.</Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-2">
              <Accordion.Control icon={<IconUsers size={20} color="var(--mantine-color-indigo-6)" />}>
                How do I invite my Faculty Guide?
              </Accordion.Control>
              <Accordion.Panel>Once you create a team, you will get a unique "Guide Code". Simply share this code with your faculty mentor, and they can join your team instantly as a reviewer.</Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="item-3">
              <Accordion.Control icon={<IconShieldCheck size={20} color="var(--mantine-color-indigo-6)" />}>
                Is my data secure?
              </Accordion.Control>
              <Accordion.Panel>Absolutely. We use enterprise-grade Firebase authentication and security rules. Only your assigned team members and guides can access your proprietary project data.</Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Container>

        {/* Footer */}
        <Box py="xl" bg="gray.0" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Container>
            <Group justify="space-between">
              <Group>
                <ThemeIcon color="indigo" variant="filled" size="lg" radius="md"><IconBrain size={20} /></ThemeIcon>
                <Text fw={800} size="lg">LogSphere</Text>
              </Group>
              <Text c="dimmed" size="sm">
                © 2026 LogSphere. Built for academic excellence.
              </Text>
            </Group>
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
    </>
  );
}
