import { useEffect, useState } from 'react';
import { Title, Button, Group, Text, Stack, SimpleGrid, Badge, Card, ThemeIcon, ActionIcon, Menu, Box, Loader, Alert, Paper, RingProgress, Avatar, Container } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services';
import { Layout } from '../components/Layout';
import { IconPlus, IconDotsVertical, IconCalendar, IconEye, IconEdit, IconTrash, IconChartBar, IconCheck, IconClock, IconUsers, IconArrowRight, IconNotebook, IconUsersGroup } from '@tabler/icons-react';
import { motion } from 'framer-motion';

// Helper function to format date
const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return 'Invalid Date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (error) {
    return 'Invalid Date';
  }
};

const statusConfig = {
    'draft': { color: 'gray', label: 'Draft', bg: 'gray.0' },
    'pending-lead': { color: 'indigo', label: 'Pending Lead', bg: 'indigo.0' },
    'pending-guide': { color: 'blue', label: 'Pending Guide', bg: 'blue.0' },
    'approved': { color: 'cyan', label: 'Approved', bg: 'cyan.0' },
    'final-approved': { color: 'teal', label: 'Finalized', bg: 'teal.0' },
    'needs-revision': { color: 'red', label: 'Action Required', bg: 'red.0' },
};

export function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Stats Logic
  const pendingCount = logs.filter(l => l.status.includes('pending')).length;
  const approvedCount = logs.filter(l => l.status === 'approved' || l.status === 'final-approved').length;
  const totalHours = logs.reduce((acc, log) => {
       // Assuming simplistic hours sum if activities exist, else random filler for visual demo if data missing
       const logHours = log.activities?.reduce((sum: number, act: any) => sum + (Number(act.hours) || 0), 0) || 0;
       return acc + logHours;
  }, 0);

  useEffect(() => {
    if (currentUser) {
      const fetchData = async () => {
        setLoading(true);
        try {
          if (currentUser.role === 'admin') {
             const allTeams = await firebaseService.getAllTeams();
             setTeams(allTeams);
             if (!selectedTeam) setLogs([]);
          } else if (currentUser.teamIds && currentUser.teamIds.length > 0) {
              const teamLogs = await firebaseService.getLogsByTeamIds(currentUser.teamIds);
              setLogs(teamLogs.sort((a: any, b: any) => b.weekNumber - a.weekNumber)); // Descending order
          } else {
              setLogs([]);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          if (currentUser.role !== 'admin' || !selectedTeam) setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [currentUser]);

  useEffect(() => {
     if (currentUser?.role === 'admin' && selectedTeam) {
         setLoading(true);
         firebaseService.getLogs(selectedTeam).then((teamLogs) => {
             setLogs(teamLogs.sort((a: any, b: any) => b.weekNumber - a.weekNumber));
             setLoading(false);
         });
     } else if (currentUser?.role === 'admin' && !selectedTeam) {
         setLogs([]);
     }
  }, [selectedTeam, currentUser]);

  const handleCreateLog = () => navigate('/logs/new');
  const handleEditLog = (logId: string) => navigate(`/logs/${logId}/edit`);
  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm('Delete this log permanently?')) return;
    try {
      await firebaseService.deleteLog(logId);
      setLogs(logs.filter(log => log.id !== logId));
    } catch (error) {
      console.error(error);
    }
  };

  const StatsCard = ({ title, value, icon: Icon, color }: any) => (
      <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
              <div>
                  <Text c="dimmed" tt="uppercase" fw={700} fz="xs">{title}</Text>
                  <Text fw={700} fz="xl">{value}</Text>
              </div>
              <ThemeIcon color={color} variant="light" size={38} radius="md">
                  <Icon size={20} />
              </ThemeIcon>
          </Group>
      </Paper>
  );

  const LogCard = ({ log }: { log: any }) => {
      const status = statusConfig[log.status as keyof typeof statusConfig] || statusConfig['draft'];
      
      return (
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <Card padding="lg" radius="md" withBorder h="100%">
                <Group justify="space-between" mb="sm">
                   <Badge variant="dot" color={status.color} size="lg" bg={status.bg} c={status.color}>
                      {status.label}
                   </Badge>
                   <ActionIcon variant="subtle" color="gray" onClick={() => navigate(`/logs/${log.id}`)}>
                      <IconArrowRight size={16} />
                   </ActionIcon>
                </Group>
               
                <Stack gap={4} mb="md">
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">Week {log.weekNumber}</Text>
                    <Text fw={600} size="lg" lineClamp={1}>
                        {log.activities?.[0]?.description || "No specific title"}
                    </Text>
                    <Text size="sm" c="dimmed">
                        {log.activities?.length || 0} Activities Logged
                    </Text>
                </Stack>

                <Group mt="auto" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                    <Group gap="xs">
                        <Avatar color="indigo" radius="xl" size="sm">
                            {log.createdByName?.[0]}
                        </Avatar>
                        <Text size="sm" fw={500}>{log.createdByName}</Text>
                    </Group>
                    
                    <Group gap={4} ml="auto">
                         <IconCalendar size={14} style={{ opacity: 0.5 }} />
                         <Text size="xs" c="dimmed">{formatDate(log.startDate)}</Text>
                    </Group>
                </Group>
            </Card>
        </motion.div>
      );
  };

  // ADMIN TEAM VIEW
  if (currentUser?.role === 'admin' && !selectedTeam && !loading) {
      return (
        <Layout>
          <Container size="xl" py="xl" px="md" style={{ flex: 1 }}>
             <Stack gap="xl">
                  {/* Header */}
                  <Stack gap="xs">
                      <Title order={2} fw={800} style={{ letterSpacing: '-0.5px', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>Team Directory</Title>
                      <Text c="dimmed" size="md">Manage all engineering teams from one place.</Text>
                  </Stack>

                  {/* Stats Row */}
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={{ base: 'md', md: 'lg' }}>
                      <StatsCard title="Total Teams" value={teams.length} icon={IconUsers} color="indigo" />
                      <StatsCard title="Total Users" value={teams.reduce((acc, t) => acc + (t.memberIds?.length || 0), 0)} icon={IconUsersGroup} color="cyan" />
                      <StatsCard title="System Status" value="Active" icon={IconCheck} color="teal" />
                  </SimpleGrid>

                  {/* Team Grid */}
                  <Box>
                     <Text fw={600} size="sm" c="dimmed" mb="sm" tt="uppercase">All Teams</Text>
                     {teams.length === 0 ? (
                        <Alert color="blue" title="No Teams Found">
                             Teams are created when a Team Leader signs up.
                        </Alert>
                     ) : (
                        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                            {teams.map((team) => (
                                <Paper key={team.id} withBorder p="lg" radius="md" component={motion.div} whileHover={{ y: -4, borderColor: 'var(--mantine-color-indigo-3)' }}>
                                    <Group justify="space-between" mb="md">
                                        <ThemeIcon size="xl" radius="md" variant="light" color="indigo">
                                            <IconUsersGroup size={24} />
                                        </ThemeIcon>
                                        <Menu position="bottom-end">
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16}/></ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                 <Menu.Item leftSection={<IconEdit size={14}/>}>Edit details</Menu.Item>
                                                 <Menu.Item leftSection={<IconTrash size={14}/>} color="red">Delete Team</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                    
                                    <Text fw={700} size="lg" mb={4}>{team.name}</Text>
                                    <Text size="sm" c="dimmed" mb="lg">{team.memberIds?.length || 0} Members • {team.guideIds?.length || 0} Guides</Text>

                                    <Group grow mb="lg">
                                        <Box>
                                            <Text size="xs" c="dimmed" fw={600}>REF CODE</Text>
                                            <Text fw={700} c="indigo.7" style={{ fontFamily: 'monospace' }}>{team.referralCode}</Text>
                                        </Box>
                                        <Box>
                                            <Text size="xs" c="dimmed" fw={600}>GUIDE CODE</Text>
                                            <Text fw={700} c="teal.7" style={{ fontFamily: 'monospace' }}>{team.guideCode}</Text>
                                        </Box>
                                    </Group>

                                    <Button fullWidth onClick={() => setSelectedTeam(team.id)} variant="light" color="indigo">
                                        View Logs
                                    </Button>
                                </Paper>
                            ))}
                        </SimpleGrid>
                     )}
                  </Box>
             </Stack>
          </Container>
        </Layout>
      );
  }

  // LOGS VIEW
  return (
    <Layout>
      <Container size="xl" py="xl" px="md" style={{ flex: 1 }}>
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="end">
                <Box>
                    <Group gap="xs" mb={4}>
                       {currentUser?.role === 'admin' && (
                           <ActionIcon variant="transparent" color="gray" onClick={() => setSelectedTeam(null)} size="md">
                               <IconArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
                           </ActionIcon>
                       )}
                       <Title order={2} fw={800} style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
                           {currentUser?.role === 'admin' ? 'Team Logs' : `Welcome back, ${currentUser?.name?.split(' ')[0]}`}
                       </Title>
                    </Group>
                    <Text c="dimmed" size="md">Track progress and manage weekly reports.</Text>
                </Box>
                
                {((currentUser?.role !== 'guide' && selectedTeam === null) || (currentUser?.role === 'team_lead' || currentUser?.role === 'member')) && (
                     <Button 
                        onClick={handleCreateLog} 
                        leftSection={<IconPlus size={18} />}
                        size="md"
                        color="indigo"
                     >
                        New Log
                     </Button>
                )}
            </Group>

            {/* Stats Row (Only if logs exist or user is standard) */}
            {logs.length > 0 && (
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    <StatsCard title="Pending Review" value={pendingCount} icon={IconClock} color="indigo" />
                    <StatsCard title="Approved Logs" value={approvedCount} icon={IconCheck} color="teal" />
                    <StatsCard title="Total Hours" value={totalHours + "h"} icon={IconChartBar} color="blue" />
                </SimpleGrid>
            )}

            {/* Logs Grid */}
            <Box>
                {loading ? (
                    <Box py={50} ta="center"><Loader type="dots" /></Box>
                ) : logs.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                        {logs.map(log => (
                            <LogCard key={log.id} log={log} />
                        ))}
                    </SimpleGrid>
                ) : (
                    <Paper p={50} radius="md" withBorder ta="center" bg="gray.0">
                        <ThemeIcon size={60} radius="xl" variant="light" color="indigo" mb="md">
                            <IconNotebook size={30} />
                        </ThemeIcon>
                        <Text fw={600} size="lg" mb="xs">No logs found</Text>
                        <Text c="dimmed" mb="lg" size="sm" maw={400} mx="auto">
                           Start documenting your journey by creating your first weekly log entry.
                        </Text>
                        {(currentUser?.role === 'member' || currentUser?.role === 'team_lead') && (
                            <Button onClick={handleCreateLog}>Create First Log</Button>
                        )}
                    </Paper>
                )}
            </Box>
        </Stack>
      </Container>
    </Layout>
  );
}