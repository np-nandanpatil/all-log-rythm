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
  IconUsersGroup
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
  onClick 
}: { 
  icon: typeof IconLayoutDashboard; 
  label: string; 
  active?: boolean; 
  onClick?: () => void; 
}) => {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton 
        onClick={onClick} 
        style={(theme) => ({
            width: '100%',
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: active ? theme.colors.indigo[0] : 'transparent',
            color: active ? theme.colors.indigo[7] : theme.colors.gray[7],
            marginBottom: theme.spacing.xs,
            '&:hover': {
                backgroundColor: active ? theme.colors.indigo[0] : theme.colors.gray[0],
            }
        })}
      >
        <Icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
        <Text ml="md" size="sm" fw={500}>{label}</Text>
      </UnstyledButton>
    </Tooltip>
  );
};

export function Layout({ children }: LayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOut } = useAuth();

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
          width: 300,
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
            <Group w="100%" px="xs" mb="md" mt="xs">
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
                <Stack gap={0}>
                     <Text size="lg" fw={800} style={{ letterSpacing: '-0.5px' }}>Log Rythm</Text>
                     <Text size="xs" c="dimmed" fw={500}>Internship Management</Text>
                </Stack>
            </Group>

            {/* Navigation */}
            <Stack gap={4} w="100%" flex={1}>
                <NavbarLink 
                    icon={IconLayoutDashboard} 
                    label="Dashboard" 
                    active={location.pathname === '/dashboard'}
                    onClick={() => navigate('/dashboard')}
                />
                
                {/* Team Management - Only for Team Leaders and Admins */}
                {(currentUser?.role === 'team_lead' || currentUser?.role === 'admin') && (
                    <NavbarLink 
                        icon={IconUsersGroup} 
                        label="Team Management" 
                        active={location.pathname === '/team'}
                        onClick={() => navigate('/team')}
                    />
                )}
                
                {currentUser?.role === 'admin' && (
                     <NavbarLink 
                        icon={IconUsersGroup} 
                        label="Teams Directory" 
                        active={false} 
                        onClick={() => navigate('/dashboard')}
                     />
                )}
            </Stack>

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
                        <Group>
                            <Avatar src={null} radius="xl" color="indigo" variant="light">
                                {(currentUser?.name || "U")[0]}
                            </Avatar>
                            <Stack gap={0} flex={1}>
                                <Text size="sm" fw={600} lineClamp={1}>
                                    {currentUser?.name || "User"}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    {(currentUser?.role || 'Guest').replace('_', ' ').toUpperCase()}
                                </Text>
                            </Stack>
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
