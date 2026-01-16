import {
  AppShell,
  Group,
  Burger,
  Text,
  UnstyledButton,
  Stack,
  rem,
  Tooltip,
  Avatar,
  Menu
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconLayoutDashboard,
  IconNotebook,
  IconLogout,
  IconUser,
  IconSettings,
  IconUsersGroup,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const NavbarLink = ({
  icon: Icon,
  label,
  active,
  onClick,
  collapsed
}: {
  icon: typeof IconLayoutDashboard;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}) => {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }} disabled={!collapsed}>
      <UnstyledButton
        onClick={onClick}
        style={(theme) => ({
          width: '100%',
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          backgroundColor: active ? theme.colors.indigo[0] : 'transparent',
          color: active ? theme.colors.indigo[7] : theme.colors.gray[7],
          marginBottom: theme.spacing.xs,
          '&:hover': {
            backgroundColor: active ? theme.colors.indigo[0] : theme.colors.gray[0],
          }
        })}
      >
        <Icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
        {!collapsed && <Text ml="md" size="sm" fw={500}>{label}</Text>}
      </UnstyledButton>
    </Tooltip>
  );
};

export function Layout({ children }: LayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOut } = useAuth();

  // Mobile Breakpoint Check
  const isMobile = window.innerWidth < 768; // Simple check or use useMediaQuery if available

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AppShell
      padding="md"
      navbar={{
        width: { base: 300, sm: desktopOpened ? 300 : 80 },
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      header={{ height: { base: 60, sm: 0 } }}
    >
      <AppShell.Header hiddenFrom="sm">
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text fw={700} size="lg">All Log Rythm</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ borderRight: '1px solid var(--mantine-color-gray-3)' }}>
        <Stack gap="lg" align="flex-start" h="100%">
          {/* Brand Section */}
          <Group w="100%" px={(desktopOpened || isMobile) ? "xs" : 0} mb="md" mt="xs" justify={(desktopOpened || isMobile) ? "flex-start" : "center"}>
            <Avatar
              src={null}
              alt="Logo"
              color="indigo"
              radius="md"
              size="md"
              variant="filled"
            >
              <IconNotebook size={20} />
            </Avatar>
            {(desktopOpened || isMobile) && (
              <Stack gap={0}>
                <Text size="lg" fw={800} style={{ letterSpacing: '-0.5px' }}>Log Rythm</Text>
                <Text size="xs" c="dimmed" fw={500}>Internship Management</Text>
              </Stack>
            )}
          </Group>

          {/* Navigation */}
          <Stack gap={4} w="100%" flex={1}>
            <NavbarLink
              icon={IconLayoutDashboard}
              label="Dashboard"
              active={location.pathname === '/dashboard'}
              onClick={() => navigate('/dashboard')}
              collapsed={!desktopOpened && !isMobile}
            />

            {/* Team Management - Only for Team Leaders and Admins */}
            {(currentUser?.role === 'team_lead' || currentUser?.role === 'admin') && (
              <NavbarLink
                icon={IconUsersGroup}
                label="Team Management"
                active={location.pathname === '/team'}
                onClick={() => navigate('/team')}
                collapsed={!desktopOpened && !isMobile}
              />
            )}

            {currentUser?.role === 'admin' && (
              <NavbarLink
                icon={IconUsersGroup}
                label="Teams Directory"
                active={false}
                onClick={() => navigate('/dashboard')}
                collapsed={!desktopOpened && !isMobile}
              />
            )}
          </Stack>

          {/* Collapse Toggle (Desktop Only) */}
          <UnstyledButton
            onClick={toggleDesktop}
            visibleFrom="sm"
            style={(theme) => ({
              width: '100%',
              padding: theme.spacing.xs,
              borderRadius: theme.radius.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.gray[5],
              '&:hover': {
                backgroundColor: theme.colors.gray[0],
                color: theme.colors.gray[7],
              }
            })}
          >
            {desktopOpened ? <IconChevronLeft size={20} /> : <IconChevronRight size={20} />}
          </UnstyledButton>

          {/* User Profile Footer */}
          <Menu shadow="md" width={200} position="top-start">
            <Menu.Target>
              <UnstyledButton w="100%" style={(theme) => ({
                padding: theme.spacing.md,
                color: theme.colors.dark[8],
                borderRadius: theme.radius.sm,
                '&:hover': {
                  backgroundColor: theme.colors.gray[0],
                },
              })}>
                <Group justify={(desktopOpened || isMobile) ? "flex-start" : "center"}>
                  <Avatar src={null} radius="xl" color="indigo" variant="light">
                    {(currentUser?.name || "U")[0]}
                  </Avatar>
                  {(desktopOpened || isMobile) && (
                    <Stack gap={0} flex={1}>
                      <Text size="sm" fw={600} lineClamp={1}>
                        {currentUser?.name || "User"}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {(currentUser?.role || 'Guest').replace('_', ' ').toUpperCase()}
                      </Text>
                    </Stack>
                  )}
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconUser size={14} />}
                onClick={() => navigate('/profile')}
              >
                Profile
              </Menu.Item>
              <Menu.Item
                leftSection={<IconSettings size={14} />}
                onClick={() => navigate('/settings')}
              >
                Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
