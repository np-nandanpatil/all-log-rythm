import { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Milestones } from '../components/Milestones';
import { ProjectAnalytics } from '../components/ProjectAnalytics';
import { ReportTemplate } from '../components/ReportTemplate';
import { Title, Button, Group, Text, Stack, SimpleGrid, Badge, Card, ThemeIcon, ActionIcon, Menu, Box, Loader, Alert, Paper, Avatar, Container, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services';
import { notifications } from '@mantine/notifications';
import { Layout } from '../components/Layout';
import { IconPlus, IconDotsVertical, IconChartBar, IconCheck, IconClock, IconUsers, IconArrowRight, IconNotebook, IconUsersGroup, IconEdit, IconTrash, IconFileTypePdf } from '@tabler/icons-react';
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
    'draft': { color: 'gray', label: 'Draft' },
    'pending-lead': { color: 'indigo', label: 'Pending Lead' },
    'pending-guide': { color: 'blue', label: 'Pending Guide' },
    'approved': { color: 'cyan', label: 'Approved' },
    'final-approved': { color: 'teal', label: 'Finalized' },
    'needs-revision': { color: 'red', label: 'Action Required' },
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

    // PDF Export Logic
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `LogSphere_Report_${new Date().toISOString().split('T')[0]}`,
    });



    // State for Join Team
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

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
                // Optimistically update pending requests
                setPendingRequests(prev => [...prev, { teamName: result.teamName, status: 'pending' }]);
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

            const fetchData = async () => {
                setLoading(true);
                try {
                    if (currentUser.role === 'admin') {

                        const allTeams = await firebaseService.getAllTeams();
                        setTeams(allTeams);
                        if (!selectedTeam) setLogs([]);
                    } else {
                        // Support for legacy single teamId or modern array teamIds
                        const effectiveTeamIds = currentUser.teamIds && currentUser.teamIds.length > 0
                            ? currentUser.teamIds
                            : (currentUser as any).teamId ? [(currentUser as any).teamId] : [];

                        if (effectiveTeamIds.length > 0) {

                            const teamLogs = await firebaseService.getLogsByTeamIds(effectiveTeamIds);
                            // Sort by Date (Newest first)
                            setLogs(teamLogs.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));

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

                            setLogs([]);
                            setTeams([]);

                            // Fetch pending requests for users with no team
                            if (currentUser.uid) {
                                const requests = await firebaseService.getUserPendingRequests(currentUser.uid);
                                setPendingRequests(requests);
                            }
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
                setLogs(teamLogs.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
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

    const handleRemoveMember = async (userId: string, role: string, userName: string) => {
        const teamIdToUpdate = selectedTeam || teams[0]?.id;
        if (!teamIdToUpdate) return;

        if (window.confirm(`Are you sure you want to remove ${userName} from the team?`)) {
            try {
                await firebaseService.removeTeamMember(teamIdToUpdate, userId, role);
                notifications.show({ title: 'Success', message: 'Member removed successfully', color: 'green' });

                // Refresh Data
                const updatedTeams = teams.map(t => {
                    if (t.id === teamIdToUpdate) {
                        return {
                            ...t,
                            memberIds: t.memberIds.filter((id: any) => id !== userId),
                            guideIds: t.guideIds.filter((id: any) => id !== userId)
                        };
                    }
                    return t;
                });
                setTeams(updatedTeams);

                // Also update roster
                setTeamRoster(prev => ({
                    ...prev,
                    members: prev.members.filter(m => m.id !== userId),
                    guides: prev.guides.filter(g => g.id !== userId)
                }));

            } catch (error) {
                console.error(error);
                notifications.show({ title: 'Error', message: 'Failed to remove member', color: 'red' });
            }
        }
    };

    const StatsCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
                <div>
                    <Text c="dimmed" tt="uppercase" fw={700} fz="xs">{title}</Text>
                    <Text fw={700} fz="xl">{value}</Text>
                    {subtitle && <Text size="xs" c="dimmed">{subtitle}</Text>}
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
        const isMyLog = log.createdBy === currentUser?.uid;

        return (
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card padding="lg" radius="md" withBorder h="100%" style={isMyLog ? { borderColor: 'var(--mantine-color-indigo-4)', borderWidth: 2 } : {}}>
                    <Group justify="space-between" mb="sm">
                        <Badge variant="light" color={status.color} size="lg">
                            {status.label}
                        </Badge>
                        {isMyLog && <Badge variant="filled" color="indigo" size="sm">You</Badge>}
                    </Group>
                    <Group justify="space-between" align="center" mb="xs">
                        <ActionIcon variant="subtle" color="gray" onClick={() => navigate(`/logs/${log.id}`)} ml="auto">
                            <IconArrowRight size={16} />
                        </ActionIcon>
                    </Group>

                    <Stack gap={4} mb="md">
                        <Group justify="space-between">
                            <Text size="lg" fw={700}>{formatDate(log.startDate)}</Text>
                            {logTeam && <Badge size="xs" variant="light" color="gray">{logTeam.name}</Badge>}
                        </Group>
                        <Text fw={500} size="md" lineClamp={1} c="dimmed">
                            {log.activities?.[0]?.description || "No specific title"}
                        </Text>
                        <Text size="xs" c="dimmed" mt={4}>
                            {log.activities?.length || 0} Activities • {log.activities?.reduce((sum: number, act: any) => sum + (Number(act.hours) || 0), 0)} Hours
                        </Text>
                    </Stack>

                    <Group mt="auto" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                        <Group gap="xs">
                            <Avatar color={isMyLog ? "indigo" : "gray"} radius="xl" size="sm">
                                {log.createdByName?.[0]}
                            </Avatar>
                            <Text size="sm" fw={isMyLog ? 700 : 500}>{log.createdByName} {isMyLog && "(You)"}</Text>
                        </Group>
                    </Group>
                </Card>
            </motion.div>
        );
    };

    // Filter logs based on selection for Non-Admins with multiple teams
    // For MEMBERS: NOW SHOWING ALL TEAM LOGS, but distinguishing personal ones

    // Logs strictly for the current selected team (or all logs if admin/no-team context - though simplified here)
    // If selectedTeam is set, we filter by it. If not (admin viewing all), we show all. 
    // For member/lead/guide with implicit selectedTeam (set in useEffect), this logic holds.
    const effectiveLogs = selectedTeam ? logs.filter(l => l.teamId === selectedTeam) : logs;

    const personalLogs = effectiveLogs.filter(l => l.createdBy === currentUser?.uid);
    const displayedLogs = effectiveLogs; // Everyone sees all logs for the context

    // Stats Logic (DUAL METRICS)
    const calculateStats = (sourceLogs: any[]) => {
        return {
            pending: sourceLogs.filter(l => l.status.includes('pending')).length,
            approved: sourceLogs.filter(l => l.status === 'approved' || l.status === 'final-approved').length,
            hours: sourceLogs.reduce((acc, log) => {
                const logHours = log.activities?.reduce((sum: number, act: any) => sum + (Number(act.hours) || 0), 0) || 0;
                return acc + logHours;
            }, 0)
        };
    };

    const teamStats = calculateStats(effectiveLogs);
    const myStats = calculateStats(personalLogs);

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
            {/* Hidden Print Template */}
            <div style={{ display: 'none' }}>
                <ReportTemplate
                    ref={componentRef}
                    logs={displayedLogs}
                    totalHours={teamStats.hours}
                    team={teams.find(t => t.id === (selectedTeam || teams[0]?.id))}
                    studentName={currentUser?.name || ''}
                    teamRoster={teamRoster}
                />
            </div>
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

                        <Button
                            variant="light"
                            color="red"
                            leftSection={<IconFileTypePdf size={18} />}
                            onClick={() => handlePrint()}
                            mr="xs"
                        >
                            Export Report
                        </Button>

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
                            <TeamSquad teamRoster={teamRoster} isLeader={currentUser?.role === 'team_lead'} onRemoveMember={handleRemoveMember} />
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
                        pendingRequests.length > 0 ? (
                            <Paper p="xl" withBorder radius="md" bg="var(--mantine-color-body)">
                                <Stack gap="sm">
                                    <Group>
                                        <ThemeIcon color="blue" variant="light" size="lg"><IconClock size={20} /></ThemeIcon>
                                        <Title order={4} c="blue.9">Pending Approval</Title>
                                    </Group>
                                    <Text size="sm" c="dimmed">
                                        Your request to join <b>{pendingRequests[0].teamName}</b> is currently pending approval.
                                        Please ask your Team Lead to approve your request in their dashboard.
                                    </Text>
                                    <Alert variant="light" color="blue" icon={<IconClock />}>
                                        Approval Pending from Team Leader
                                    </Alert>
                                </Stack>
                            </Paper>
                        ) : (
                            <Paper p="xl" withBorder radius="md" bg="var(--mantine-color-body)">
                                <Stack gap="sm">
                                    <Group>
                                        <ThemeIcon color={teams.length > 0 ? "indigo" : "orange"} variant="light" size="lg"><IconUsersGroup size={20} /></ThemeIcon>
                                        <Title order={4} c={teams.length > 0 ? undefined : "orange.9"}>
                                            {teams.length > 0 ? "Join Another Team" : "No Team Assigned"}
                                        </Title>
                                    </Group>
                                    <Text size="sm" c="dimmed">
                                        {currentUser?.role === 'guide'
                                            ? "As a Faculty Guide, you can help multiple teams. Enter a Guide Code to join another team."
                                            : "You are not currently assigned to any team. Ask your Team Lead for their Team Code to join."}
                                    </Text>
                                    <Group align="flex-end" gap="sm">
                                        <TextInput
                                            placeholder={currentUser?.role === 'guide' ? "Enter Guide Code" : "Enter Team Code"}
                                            label={currentUser?.role === 'guide' ? "Guide Code" : "Referral Code"}
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value)}
                                            style={{ flex: 1 }}
                                        />
                                        <Button
                                            loading={joining}
                                            onClick={handleJoinTeam}
                                            color={teams.length > 0 ? "indigo" : "orange"}
                                        >
                                            Join Team
                                        </Button>
                                    </Group>
                                </Stack>
                            </Paper>
                        )
                    )}

                    {/* Stats Row */}
                    {logs.length > 0 && (
                        <Box>
                            {/* Personal Stats */}
                            <Text size="sm" fw={700} c="dimmed" mb="xs">MY ACTIVITY</Text>
                            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
                                <StatsCard title="My Pending" value={myStats.pending} icon={IconClock} color="indigo" subtitle="Logs waiting for review" />
                                <StatsCard title="My Approved" value={myStats.approved} icon={IconCheck} color="teal" subtitle="Verified logs" />
                                <StatsCard title="My Hours" value={myStats.hours + "h"} icon={IconChartBar} color="blue" subtitle="Total logged time" />
                            </SimpleGrid>

                            {/* Team Stats (Visible if team selected OR if user is non-admin with teams) */}
                            {(selectedTeam || (currentUser?.role !== 'admin' && teams.length > 0)) && (
                                <>
                                    <Text size="sm" fw={700} c="dimmed" mb="xs">TEAM OVERVIEW</Text>
                                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                                        <StatsCard title="Team Pending" value={teamStats.pending} icon={IconUsers} color="violet" subtitle="Total team queue" />
                                        <StatsCard title="Team Approved" value={teamStats.approved} icon={IconCheck} color="green" subtitle="Total verified work" />
                                        <StatsCard title="Team Hours" value={teamStats.hours + "h"} icon={IconChartBar} color="cyan" subtitle="Cumulative effort" />
                                    </SimpleGrid>
                                </>
                            )}
                        </Box>
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
                            <Paper p={50} radius="md" withBorder ta="center" bg="var(--mantine-color-body)">
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

function TeamSquad({ teamRoster, isLeader, onRemoveMember }: { teamRoster: { leader?: any, guides: any[], members: any[] }, isLeader: boolean, onRemoveMember: (id: string, role: string, name: string) => void }) {
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
                                    {isLeader && (
                                        <ActionIcon color="red" variant="subtle" size="sm" onClick={() => onRemoveMember(g.id, 'guide', g.name)}>
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    )}
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
                                    {isLeader && (
                                        <ActionIcon color="red" variant="subtle" size="sm" onClick={() => onRemoveMember(m.id, 'member', m.name)}>
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    )}
                                </Group>
                            ))}
                        </Stack>
                    ) : <Text size="sm" c="dimmed" fs="italic">No other members</Text>}
                </Stack>
            </SimpleGrid>
        </Paper>
    );
}