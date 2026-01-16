import { useState } from 'react';
import { Container, Title, Text, Button, Stack, Group, Box, SimpleGrid, ThemeIcon, Paper, Grid, Badge, Accordion, ActionIcon, useMantineColorScheme, useComputedColorScheme, RingProgress, Avatar } from '@mantine/core';
import { IconRocket, IconUsers, IconShieldCheck, IconBrain, IconClock, IconDeviceAnalytics, IconArrowRight, IconCheck, IconSun, IconMoon } from '@tabler/icons-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { AuthModal } from '../components/AuthModal';

const jellyVariants: any = {
  hover: {
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 8
    }
  },
  tap: {
    scale: 0.9,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10
    }
  }
};

const JellyCard = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover="hover"
    whileTap="tap"
    variants={jellyVariants}
    style={{ height: '100%' }}
  >
    {children}
  </motion.div>
);

const HeroVisual = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [0, 400], [10, -10]);
  const rotateY = useTransform(x, [0, 600], [-10, 10]);

  function handleMouse(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  }

  return (
    <motion.div
      style={{ perspective: 2000 }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(300); y.set(200); }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          height: 480,
          width: '100%',
          position: 'relative'
        }}
      >
        {/* NEON GLOW BEHIND */}
        <Box style={{
          position: 'absolute', inset: -40, zIndex: 0,
          background: 'conic-gradient(from 0deg, var(--mantine-color-indigo-6), var(--mantine-color-cyan-6), var(--mantine-color-pink-6), var(--mantine-color-indigo-6))',
          filter: 'blur(80px)', opacity: 0.6,
          borderRadius: '50%'
        }} />

        {/* MAIN DASHBOARD MOCKUP - DARK GLASS */}
        <Paper
          shadow="xl"
          radius="lg"
          withBorder
          style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'rgba(18, 18, 28, 0.85)', // Deep dark tint
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            display: 'flex'
          }}
        >
          {/* Mock Sidebar */}
          <Stack w={70} h="100%" bg="rgba(255,255,255,0.03)" align="center" py="md" gap="lg" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} radius="md"><IconBrain size={20} /></ThemeIcon>
            <Stack gap="md" mt="xl">
              {[1, 2, 3, 4].map(i => <Box key={i} w={8} h={8} bg={i === 1 ? 'cyan.4' : 'gray.8'} style={{ borderRadius: '50%' }} />)}
            </Stack>
            <Avatar src={null} alt="User" size="sm" mt="auto" color="gray" />
          </Stack>

          {/* Mock Content */}
          <Box style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Group justify="space-between" mb="xl">
              <Box>
                <Text fw={700} size="md" c="white">Project Omega</Text>
                <Text size="xs" c="dimmed">Sprint 4 • Active</Text>
              </Box>
              <Group gap="xs">
                <Badge size="sm" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>Run</Badge>
                <ActionIcon variant="subtle" color="gray"><IconSun size={14} /></ActionIcon>
              </Group>
            </Group>

            {/* Grid */}
            <Grid gutter="sm">
              {/* Chart Card */}
              <Grid.Col span={8}>
                <Paper withBorder p="sm" radius="md" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }} h={180}>
                  <Text fw={600} size="xs" c="dimmed" mb="md">VELOCITY</Text>
                  <Group align="flex-end" h={110} gap={6} style={{ overflow: 'hidden' }}>
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0, opacity: 0 }}
                        whileInView={{ height: `${h}%`, opacity: 1 }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        style={{ flex: 1, background: `linear-gradient(to top, var(--mantine-color-indigo-9), var(--mantine-color-cyan-5))`, borderRadius: 4 }}
                      />
                    ))}
                  </Group>
                </Paper>
              </Grid.Col>

              {/* Stat Card */}
              <Grid.Col span={4}>
                <Paper withBorder p="sm" radius="md" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }} h={180}>
                  <Text fw={600} size="xs" c="dimmed" mb="md">STATUS</Text>
                  <Stack align="center" justify="center" h={110}>
                    <RingProgress
                      size={100}
                      thickness={8}
                      roundCaps
                      sections={[{ value: 75, color: 'cyan' }]}
                      label={
                        <Text c="white" fw={700} ta="center" size="sm">
                          75%
                        </Text>
                      }
                    />
                  </Stack>
                </Paper>
              </Grid.Col>

              {/* Activity List */}
              <Grid.Col span={12}>
                <Paper withBorder p="sm" radius="md" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <Text fw={600} size="xs" c="dimmed" mb="sm">RECENT LOGS</Text>
                  <Stack gap="xs">
                    {[1, 2].map(j => (
                      <Group key={j} justify="space-between">
                        <Group gap="xs">
                          <ThemeIcon size="sm" color={j === 1 ? 'pink' : 'orange'} variant="light" radius="xl"><IconRocket size={12} /></ThemeIcon>
                          <Box>
                            <Text size="xs" c="white" fw={500}>API Integration</Text>
                            <Text size="10px" c="dimmed">2 hours ago</Text>
                          </Box>
                        </Group>
                        <Badge size="xs" variant="outline" color={j === 1 ? 'green' : 'yellow'}>{j === 1 ? 'Approved' : 'Pending'}</Badge>
                      </Group>
                    ))}
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Box>
        </Paper>

        {/* FLOATING GLASS CARDS */}
        <motion.div style={{ position: 'absolute', top: -30, right: -40, zIndex: 20, transform: 'translateZ(60px)' }} animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}>
          <Paper shadow="xl" p="xs" radius="lg" withBorder style={{ background: 'rgba(30, 30, 40, 0.9)', borderColor: 'var(--mantine-color-green-9)', backdropFilter: 'blur(10px)' }}>
            <Group gap="xs">
              <ThemeIcon color="green" radius="xl" variant="filled" size="md"><IconCheck size={16} /></ThemeIcon>
              <Box>
                <Text size="xs" c="white" fw={700}>Log Approved</Text>
                <Text size="10px" c="dimmed">By Dr. Sharma</Text>
              </Box>
            </Group>
          </Paper>
        </motion.div>

        <motion.div style={{ position: 'absolute', bottom: 40, left: -50, zIndex: 20, transform: 'translateZ(40px)' }} animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 1 }}>
          <Paper shadow="xl" p="xs" radius="lg" withBorder style={{ background: 'rgba(30, 30, 40, 0.9)', borderColor: 'var(--mantine-color-orange-9)', backdropFilter: 'blur(10px)' }}>
            <Group gap="xs">
              <ThemeIcon color="orange" radius="xl" variant="filled" size="md"><IconClock size={16} /></ThemeIcon>
              <Box>
                <Text size="xs" c="white" fw={700}>Submission Due</Text>
                <Text size="10px" c="dimmed">Tonight, 11:59 PM</Text>
              </Box>
            </Group>
          </Paper>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default function LandingPage() {
  const [authModalOpened, setAuthModalOpened] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpened(true);
  };

  return (
    <>
      <Box style={{ overflowX: 'hidden', background: 'var(--mantine-color-body)' }}>
        {/* HERO SECTION - DARK THEME */}
        <Box
          style={{
            position: 'relative',
            height: '100vh', // Full screen isolation
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            background: 'var(--mantine-color-black)', // Force dark background
            color: 'white'
          }}
        >
          {/* ANIMATED BACKGROUND */}
          <Box style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: 'radial-gradient(circle at 10% 20%, #1a1b3c 0%, #000000 70%)',
          }} />
          <Box style={{
            position: 'absolute', inset: 0, zIndex: 1,
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            opacity: 0.5
          }} />

          <Container size="xl" style={{ position: 'relative', zIndex: 10, width: '100%' }} pt="2rem">
            {/* Header / Theme Toggle */}
            <Group justify="flex-end" mb={0}>
              <ActionIcon
                onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
                variant="white"
                size="lg"
                color="dark"
                radius="xl"
                aria-label="Toggle color scheme"
              >
                {computedColorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
            </Group>

            <Grid gutter={60} align="center">
              {/* LEFT: Copy */}
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Stack gap="xl" align="flex-start">
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
                    <Badge
                      size="xl"
                      variant="gradient"
                      gradient={{ from: 'indigo', to: 'cyan' }}
                      radius="sm"
                      tt="uppercase"
                      fw={700}
                      style={{ letterSpacing: 1 }}
                    >
                      LogSphere v2.0
                    </Badge>
                  </motion.div>

                  <Title
                    order={1}
                    fw={900}
                    style={{
                      fontSize: 'clamp(3.5rem, 5vw, 5.5rem)',
                      lineHeight: 0.95,
                      letterSpacing: '-0.04em',
                      color: 'white'
                    }}
                  >
                    The <span style={{ color: 'var(--mantine-color-indigo-4)' }}>Future</span><br />
                    of <span style={{
                      background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>Student</span><br />
                    Success.
                  </Title>

                  <Text c="gray.4" size="xl" maw={500} lh={1.6} fw={400}>
                    The only platform that syncs your <span style={{ color: 'white', fontWeight: 600 }}>Capstone Code</span>, <span style={{ color: 'white', fontWeight: 600 }}>Daily Logs</span>, and <span style={{ color: 'white', fontWeight: 600 }}>Approvals</span> in one place.
                  </Text>

                  <Group gap="md" mt="sm">
                    <motion.div variants={jellyVariants} whileHover="hover" whileTap="tap">
                      <Button
                        size="xl" h={60} px="xl" radius="md"
                        style={{
                          background: 'white',
                          color: 'black',
                          fontWeight: 700,
                          fontSize: '1.1rem'
                        }}
                        onClick={() => openAuth('signup')}
                        rightSection={<IconArrowRight size={20} />}
                      >
                        Start For Free
                      </Button>
                    </motion.div>
                  </Group>

                  <Group gap="xl" mt="xl" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', width: '100%' }}>
                    <Group gap="xs">
                      <Avatar.Group spacing="sm">
                        {[1, 2, 3].map(i => <Avatar key={i} src={null} color="indigo" radius="xl" size="sm" />)}
                        <Avatar radius="xl" size="sm">+5k</Avatar>
                      </Avatar.Group>
                      <Text c="dimmed" size="sm">Students Logged In</Text>
                    </Group>
                  </Group>
                </Stack>
              </Grid.Col>

              {/* RIGHT: Visual Mockup */}
              <Grid.Col span={{ base: 12, md: 7 }} visibleFrom="md">
                <HeroVisual />
              </Grid.Col>
            </Grid>
          </Container>
        </Box>

        {/* BENTO GRID FEATURES */}
        <Container size="lg" py={{ base: '2rem', md: '4rem' }}>
          <Stack gap="xl" mb="3rem" ta="center">
            <Title order={2} style={{ fontSize: '2.5rem' }}>Everything in One Sphere</Title>
            <Text c="dimmed" size="lg" maw={600} mx="auto">From Capstone projects to Industrial Training, LogSphere adapts to your academic needs.</Text>
          </Stack>

          <Grid gutter="lg">
            {/* Main Large Card */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <JellyCard>
                <Paper h="100%" p="xl" radius="lg" withBorder style={{
                  background: 'var(--mantine-color-body)',
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
              </JellyCard>
            </Grid.Col>

            {/* Side Vertical Card */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <JellyCard delay={0.1}>
                <Paper h="100%" p="xl" radius="lg" withBorder>
                  <Stack h="100%" justify="space-between">
                    <div>
                      <ThemeIcon size={50} radius="md" color="lime" variant="light" mb="md">
                        <IconDeviceAnalytics size={28} />
                      </ThemeIcon>
                      <Title order={3} mb="xs">Smart Analytics</Title>
                      <Text c="dimmed">
                        Visualize your hours, tech stack usage, and team contribution velocity. Perfect for final presentation reports.
                      </Text>
                    </div>
                    <SimpleGrid cols={2} spacing="xs">
                      <Box p="sm" style={{ borderRadius: 8, border: '1px solid var(--mantine-color-default-border)', background: 'var(--mantine-color-default)' }}>
                        <Text size="xs" c="dimmed">Total Hours</Text>
                        <Text fw={700} size="xl">142h</Text>
                      </Box>
                      <Box p="sm" style={{ borderRadius: 8, border: '1px solid var(--mantine-color-default-border)', background: 'var(--mantine-color-default)' }}>
                        <Text size="xs" c="dimmed">Logs</Text>
                        <Text fw={700} size="xl">24</Text>
                      </Box>
                    </SimpleGrid>
                  </Stack>
                </Paper>
              </JellyCard>
            </Grid.Col>

            {/* Small Card 1 */}
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <JellyCard delay={0.2}>
                <Paper p="xl" radius="lg" withBorder h="100%">
                  <ThemeIcon size={40} radius="md" color="cyan" variant="light" mb="md">
                    <IconUsers size={24} />
                  </ThemeIcon>
                  <Title order={4} mb="xs">Role-Based Access</Title>
                  <Text size="sm" c="dimmed">Dedicated portals for Students, Team Leaders, Faculty Guides, and Admins.</Text>
                </Paper>
              </JellyCard>
            </Grid.Col>

            {/* Small Card 2 */}
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <JellyCard delay={0.3}>
                <Paper p="xl" radius="lg" withBorder h="100%">
                  <ThemeIcon size={40} radius="md" color="pink" variant="light" mb="md">
                    <IconClock size={24} />
                  </ThemeIcon>
                  <Title order={4} mb="xs">Instant Approvals</Title>
                  <Text size="sm" c="dimmed">One-click approvals for Team Leads. No more chasing signatures physically.</Text>
                </Paper>
              </JellyCard>
            </Grid.Col>

            {/* Small Card 3 */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <JellyCard delay={0.4}>
                <Paper p="xl" radius="lg" withBorder h="100%">
                  <ThemeIcon size={40} radius="md" color="orange" variant="light" mb="md">
                    <IconBrain size={24} />
                  </ThemeIcon>
                  <Title order={4} mb="xs">AI Ready Data</Title>
                  <Text size="sm" c="dimmed">Export your logs in clean formats ready for LLM-based report generation.</Text>
                </Paper>
              </JellyCard>
            </Grid.Col>
          </Grid>
        </Container>

        {/* STATS / TRUST */}
        <Box bg="dark.9" c="white" py="3rem">
          <Container size="lg">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
              <JellyCard delay={0.1}>
                <Stack align="center" ta="center">
                  <Text fw={900} style={{ fontSize: '3rem', lineHeight: 1 }}>5,000+</Text>
                  <Text c="gray.5" fw={500}>Logs Submitted</Text>
                </Stack>
              </JellyCard>
              <JellyCard delay={0.2}>
                <Stack align="center" ta="center">
                  <Text fw={900} style={{ fontSize: '3rem', lineHeight: 1 }} c="indigo.4">150+</Text>
                  <Text c="gray.5" fw={500}>Active Teams</Text>
                </Stack>
              </JellyCard>
              <JellyCard delay={0.3}>
                <Stack align="center" ta="center">
                  <Text fw={900} style={{ fontSize: '3rem', lineHeight: 1 }} c="teal.4">98%</Text>
                  <Text c="gray.5" fw={500}>Completion Rate</Text>
                </Stack>
              </JellyCard>
            </SimpleGrid>
          </Container>
        </Box>

        {/* FAQ SECTION */}
        <Container size="md" py="4rem">
          <Title order={2} ta="center" mb="2rem">Frequently Asked Questions</Title>
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
        <Box py="lg" style={{ borderTop: '1px solid var(--mantine-color-gray-2)', backgroundColor: 'var(--mantine-color-body)' }}>
          <Container>
            <Group justify="space-between">
              <Group>
                <ThemeIcon color="indigo" variant="filled" size="md" radius="md"><IconBrain size={18} /></ThemeIcon>
                <Text fw={800} size="md">LogSphere</Text>
              </Group>
              <Text c="dimmed" size="xs">
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
