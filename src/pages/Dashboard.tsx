import { useEffect, useState } from 'react';
import { Milestones } from '../components/Milestones';
import { ProjectAnalytics } from '../components/ProjectAnalytics';
import { Title, Button, Group, Text, Stack, SimpleGrid, Badge, Card, ThemeIcon, ActionIcon, Menu, Box, Loader, Alert, Paper, Avatar, Container, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services';
import { notifications } from '@mantine/notifications';
import { Layout } from '../components/Layout';
import { IconPlus, IconDotsVertical, IconCalendar, IconChartBar, IconCheck, IconClock, IconUsers, IconArrowRight, IconNotebook, IconUsersGroup, IconEdit, IconTrash } from '@tabler/icons-react';
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
    const { currentUser, refreshUser } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    // State for Team Roster
    const [teamRoster, setTeamRoster] = useState<{ leader?: any, guides: any[], members: any[] }>({ guides: [], members: [] });



    // State for Join Team
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);

    const handleJoinTeam = async () => {
        if (!joinCode.trim() || !currentUser?.uid) return;
        setJoining(true);
        try {
            const result = await firebaseService.joinTeamByCode(
                joinCode.trim(),
                currentUser.uid,
                currentUser.email || '',
                currentUser.name || 'Unknown'
            );

            if (result.status === 'pending_approval') {
                notifications.show({
                    title: 'Request Sent',
                    message: `Your request to join ${result.teamName} has been sent for approval.`,
                    color: 'blue'
                });
            } else {
                notifications.show({ title: 'Welcome!', message: `You have joined ${result.teamName}`, color: 'green' });
                // Refresh user to get new teamIds
                await refreshUser();
            }
            setJoinCode('');
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } finally {
            setJoining(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            console.log('Dashboard: Current User:', currentUser.role, currentUser.uid, currentUser.teamIds);
            const fetchData = async () => {
                setLoading(true);
                try {
                    if (currentUser.role === 'admin') {
                        console.log('Dashboard: Fetching all teams for Admin');
                        const allTeams = await firebaseService.getAllTeams();
                        setTeams(allTeams);
                        if (!selectedTeam) setLogs([]);
                    } else {
                        // Support for legacy single teamId or modern array teamIds
                        const effectiveTeamIds = currentUser.teamIds && currentUser.teamIds.length > 0
                            ? currentUser.teamIds
                            : (currentUser as any).teamId ? [(currentUser as any).teamId] : [];

                        if (effectiveTeamIds.length > 0) {
                            console.log('Dashboard: Fetching teams for Member/Leader:', effectiveTeamIds);
                            const teamLogs = await firebaseService.getLogsByTeamIds(effectiveTeamIds);
                            setLogs(teamLogs.sort((a: any, b: any) => b.weekNumber - a.weekNumber));

                            // Fetch Team Details
                            const userTeamsData = await Promise.all(
                                effectiveTeamIds.map((id: string) => firebaseService.getTeamById(id))
                            );
                            const validTeams = userTeamsData.filter((t): t is any => t !== null);
                            setTeams(validTeams);

                            // Fetch Team Roster (for the first team)
                            if (validTeams.length > 0) {
                                const team = validTeams[0];
                                const allUserIds = [
                                    team.leaderId,
                                    ...(team.guideIds || []),
                                    ...(team.memberIds || [])
                                ].filter(Boolean);

                                const allUsers = await firebaseService.getUsersByIds([...new Set(allUserIds)]);

                                const leader = allUsers.find(u => u.id === team.leaderId);
                                const guides = allUsers.filter(u => team.guideIds?.includes(u.id));
                                const members = allUsers.filter(u => team.memberIds?.includes(u.id));

                                setTeamRoster({ leader, guides, members });
                            }
                        } else {
                            console.log('Dashboard: No team IDs found for user');
                            setLogs([]);
                            setTeams([]);
                        }
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

    const handleDeleteTeam = async (teamId: string, teamName: string) => {
        if (window.confirm(`Are you sure you want to delete team "${teamName}"? This action cannot be undone.`)) {
            try {
                await firebaseService.deleteTeam(teamId);
                setTeams(teams.filter(t => t.id !== teamId));
                if (selectedTeam === teamId) setSelectedTeam(null);
            } catch (error) {
                console.error('Error deleting team:', error);
                alert('Failed to delete team');
            }
        }
    };

    const handleEditTeam = () => {
        alert('Edit functionality coming soon in the next update!');
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

    // Display Team Name on Log Card
    const LogCard = ({ log }: { log: any }) => {
        const status = statusConfig[log.status as keyof typeof statusConfig] || statusConfig['draft'];
        const logTeam = teams.find(t => t.id === log.teamId);

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
                        <Group justify="space-between">
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Week {log.weekNumber}</Text>
                            {logTeam && <Badge size="xs" variant="light" color="gray">{logTeam.name}</Badge>}
                        </Group>
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

    // Filter logs based on selection for Non-Admins with multiple teams
    // For MEMBERS: Show ONLY their own logs by default to keep stats personal
    const isMember = currentUser?.role === 'member';

    const personalLogs = logs.filter(l => l.createdBy === currentUser?.uid);
    const displayedLogs = (currentUser?.role === 'admin' || !isMember)
        ? ((currentUser?.role !== 'admin' && selectedTeam) ? logs.filter(l => l.teamId === selectedTeam) : logs)
        : personalLogs; // Members see only their own logs

    // Stats Logic (PERSONALIZED)
    // If Member, calculate based on personalLogs. If Leader/Admin, calculate based on displayedLogs (Team view)
    const statsSource = isMember ? personalLogs : logs;

    const pendingCount = statsSource.filter(l => l.status.includes('pending')).length;
    const approvedCount = statsSource.filter(l => l.status === 'approved' || l.status === 'final-approved').length;
    const totalHours = statsSource.reduce((acc, log) => {
        const logHours = log.activities?.reduce((sum: number, act: any) => sum + (Number(act.hours) || 0), 0) || 0;
        return acc + logHours;
    }, 0);

    // Effect to update roster when selectedTeam changes (for Guides/Multi-team users)
    useEffect(() => {
        const updateRoster = async () => {
            if (currentUser?.role !== 'admin' && teams.length > 0) {
                const teamIdToUse = selectedTeam || teams[0].id;
                const team = teams.find(t => t.id === teamIdToUse);
                if (team) {
                    const allUserIds = [team.leaderId, ...(team.guideIds || []), ...(team.memberIds || [])].filter(Boolean);
                    const allUsers = await firebaseService.getUsersByIds([...new Set(allUserIds)]);
                    const leader = allUsers.find(u => u.id === team.leaderId);
                    const guides = allUsers.filter(u => team.guideIds?.includes(u.id));
                    const members = allUsers.filter(u => team.memberIds?.includes(u.id));
                    setTeamRoster({ leader, guides, members });
                }
            }
        };
        updateRoster();
    }, [selectedTeam, teams, currentUser?.role]);

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
                                                        <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item leftSection={<IconEdit size={14} />} onClick={handleEditTeam}>Edit details</Menu.Item>
                                                        <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleDeleteTeam(team.id, team.name)}>Delete Team</Menu.Item>
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
                            <Text c="dimmed" size="md">
                                {currentUser?.role === 'admin'
                                    ? 'Manage all engineering teams from one place.'
                                    : teams.length > 0
                                        ? `Team: ${selectedTeam ? teams.find(t => t.id === selectedTeam)?.name : teams[0].name}`
                                        : 'Track progress and manage weekly reports.'}
                            </Text>
                        </Box>

                        {/* Multi-Team Selector for Guides */}
                        {currentUser?.role !== 'admin' && teams.length > 1 && (
                            <Group>
                                <Text size="sm" fw={500}>View Team:</Text>
                                <Menu shadow="md" width={200}>
                                    <Menu.Target>
                                        <Button variant="default" rightSection={<IconArrowRight size={14} style={{ transform: 'rotate(90deg)' }} />}>
                                            {selectedTeam ? teams.find(t => t.id === selectedTeam)?.name : teams[0].name}
                                        </Button>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        {teams.map(t => (
                                            <Menu.Item key={t.id} onClick={() => setSelectedTeam(t.id)}>
                                                {t.name}
                                            </Menu.Item>
                                        ))}
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>
                        )}

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

                    {/* TEAM SQUAD SECTION (Only for Non-Admins who have a team) */}
                    {currentUser?.role !== 'admin' && teams.length > 0 && (
                        <>
                            <TeamSquad teamRoster={teamRoster} />
                            {selectedTeam && (
                                <Box mb="xl">
                                    <Milestones
                                        teamId={selectedTeam}
                                        isLeader={currentUser?.role === 'team_lead'}
                                    />
                                    <Box mt="xl">
                                        <ProjectAnalytics teamId={selectedTeam} />
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}

                    {/* No Team Alert */}
                    {/* Join Team Section - Always visible for Admin/Guide, or if user has no team */}
                    {/* RULES: 
                        - Admin: Never sees this (they manage all)
                        - Guide: ALWAYS sees this (to join multiple teams)
                        - Member/Lead: Sees this ONLY if teams.length === 0
                    */}
                    {(currentUser?.role === 'guide' || (currentUser?.role !== 'admin' && teams.length === 0)) && (
                        <Paper p="xl" withBorder radius="md" bg={teams.length > 0 ? "white" : "orange.0"}>
                            <Stack gap="sm">
                                <Group>
                                    <ThemeIcon color={teams.length > 0 ? "indigo" : "orange"} variant="light" size="lg"><IconUsersGroup size={20} /></ThemeIcon>
                                    <Title order={4} c={teams.length > 0 ? "indigo.9" : "orange.9"}>
                                        {teams.length > 0 ? "Join Another Team" : "No Team Assigned"}
                                    </Title>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    {teams.length > 0
                                        ? "As a Faculty Guide, you can join multiple teams. Enter a new Team/Guide Code below."
                                        : "You are not currently assigned to any team. Ask your Team Lead or Guide for their unique Referral Code to join immediately."}
                                </Text>
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" verticalSpacing="xs">
                                    <TextInput
                                        placeholder="Enter Team/Guide Code"
                                        label="Referral Code"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <Button
                                        loading={joining}
                                        onClick={handleJoinTeam}
                                        color={teams.length > 0 ? "indigo" : "orange"}
                                        fullWidth
                                    >
                                        Join Team
                                    </Button>
                                </SimpleGrid>
                            </Stack>
                        </Paper>
                    )}

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
                        ) : displayedLogs.length > 0 ? (
                            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                                {displayedLogs.map(log => (
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

function TeamSquad({ teamRoster }: { teamRoster: { leader?: any, guides: any[], members: any[] } }) {
    return (
        <Paper withBorder p="md" radius="md" mb="xl">
            <Group mb="md" justify="space-between">
                <Group gap="xs">
                    <ThemeIcon color="indigo" variant="light" size="lg" radius="md">
                        <IconUsersGroup size={20} />
                    </ThemeIcon>
                    <Text fw={700} size="lg">Team Squad</Text>
                </Group>
                <Badge variant="light" color="gray">{teamRoster.members.length + (teamRoster.leader ? 1 : 0)} Members</Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                {/* Leader Column */}
                <Stack gap="sm">
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">Team Lead</Text>
                    {teamRoster.leader ? (
                        <Group>
                            <Avatar size="md" radius="xl" color="indigo" src={null}>{teamRoster.leader.name[0]}</Avatar>
                            <div style={{ flex: 1 }}>
                                <Text size="sm" fw={600}>{teamRoster.leader.name}</Text>
                                <Text size="xs" c="dimmed">{teamRoster.leader.email}</Text>
                            </div>
                        </Group>
                    ) : <Text size="sm" c="dimmed" fs="italic">No leader assigned</Text>}
                </Stack>

                {/* Guides Column */}
                <Stack gap="sm">
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">Guides</Text>
                    {teamRoster.guides.length > 0 ? (
                        <Stack gap="xs">
                            {teamRoster.guides.map(g => (
                                <Group key={g.id}>
                                    <Avatar size="md" radius="xl" color="teal" src={null}>{g.name[0]}</Avatar>
                                    <div style={{ flex: 1 }}>
                                        <Text size="sm" fw={600}>{g.name}</Text>
                                        <Text size="xs" c="dimmed">{g.email}</Text>
                                    </div>
                                </Group>
                            ))}
                        </Stack>
                    ) : <Text size="sm" c="dimmed" fs="italic">No guides yet</Text>}
                </Stack>

                {/* Members Column */}
                <Stack gap="sm">
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">Members</Text>
                    {teamRoster.members.length > 0 ? (
                        <Stack gap="xs">
                            {teamRoster.members.map(m => (
                                <Group key={m.id}>
                                    <Avatar size="md" radius="xl" color="blue" src={null}>{m.name[0]}</Avatar>
                                    <div style={{ flex: 1 }}>
                                        <Text size="sm" fw={600}>{m.name}</Text>
                                        <Text size="xs" c="dimmed">{m.email}</Text>
                                    </div>
                                </Group>
                            ))}
                        </Stack>
                    ) : <Text size="sm" c="dimmed" fs="italic">No other members</Text>}
                </Stack>
            </SimpleGrid>
        </Paper>
    );
}