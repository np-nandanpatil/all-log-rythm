import { useState, useEffect } from 'react';
import { Paper, Title, Grid, Text, Group, ThemeIcon, Stack, RingProgress, Center, Box } from '@mantine/core';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import { IconChartPie, IconChartBar, IconClock } from '@tabler/icons-react';
import { firebaseService } from '../services';

interface ProjectAnalyticsProps {
    teamId: string;
}

export function ProjectAnalytics({ teamId }: ProjectAnalyticsProps) {
    const [loading, setLoading] = useState(true);
    const [logsData, setLogsData] = useState<any[]>([]);
    const [hoursData, setHoursData] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalHours: 0, totalLogs: 0, avgHoursPerLog: 0 });

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const logs = await firebaseService.getLogs(teamId);

                // Process Logs per Week
                const logsByWeek = logs.reduce((acc: any, log: any) => {
                    const week = `Week ${log.weekNumber}`;
                    acc[week] = (acc[week] || 0) + 1;
                    return acc;
                }, {});

                const processedLogsData = Object.keys(logsByWeek).map(week => ({
                    name: week,
                    logs: logsByWeek[week]
                })).sort((a: any, b: any) => parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1]));

                // Process Hours per Week
                const hoursByWeek = logs.reduce((acc: any, log: any) => {
                    const week = `Week ${log.weekNumber}`;
                    const logHours = log.activities?.reduce((sum: number, act: any) => sum + (Number(act.hours) || 0), 0) || 0;
                    acc[week] = (acc[week] || 0) + logHours;
                    return acc;
                }, {});

                const processedHoursData = Object.keys(hoursByWeek).map(week => ({
                    name: week,
                    hours: hoursByWeek[week]
                })).sort((a: any, b: any) => parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1]));

                // Calculate Totals
                const totalHours = Object.values(hoursByWeek).reduce((a: any, b: any) => a + b, 0) as number;
                const totalLogs = logs.length;
                const avgHoursPerLog = totalLogs ? (totalHours / totalLogs).toFixed(1) : 0;

                setLogsData(processedLogsData);
                setHoursData(processedHoursData);
                setStats({ totalHours, totalLogs, avgHoursPerLog: Number(avgHoursPerLog) });

            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        if (teamId) fetchAnalytics();
    }, [teamId]);

    if (loading) return <Text>Loading analytics...</Text>;

    if (logsData.length === 0) return null;

    return (
        <Stack gap="lg">
            <Paper withBorder p="md" radius="md">
                <Group mb="md">
                    <ThemeIcon color="violet" variant="light" size="lg" radius="md"><IconChartPie size={20} /></ThemeIcon>
                    <Title order={3}>Project Analytics</Title>
                </Group>

                <Grid>
                    {/* Stats */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack gap="xs">
                            <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-default)">
                                <Group>
                                    <ThemeIcon variant="white" color="indigo"><IconChartBar size={16} /></ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Logs</Text>
                                        <Text fw={700} size="xl">{stats.totalLogs}</Text>
                                    </div>
                                </Group>
                            </Paper>
                            <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-default)">
                                <Group>
                                    <ThemeIcon variant="white" color="teal"><IconClock size={16} /></ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Hours</Text>
                                        <Text fw={700} size="xl">{stats.totalHours}</Text>
                                    </div>
                                </Group>
                            </Paper>
                            <Center my="md">
                                <RingProgress
                                    size={120}
                                    roundCaps
                                    thickness={8}
                                    sections={[{ value: 100, color: 'violet' }]}
                                    label={
                                        <Center>
                                            <Text c="dimmed" fw={700} ta="center" size="xs">
                                                {stats.avgHoursPerLog} hrs<br />
                                                / Log
                                            </Text>
                                        </Center>
                                    }
                                />
                            </Center>
                        </Stack>
                    </Grid.Col>

                    {/* Charts */}
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Stack gap="lg">
                            <Box h={200}>
                                <Text size="sm" fw={500} mb="xs" ta="center">Weekly Activity (Hours)</Text>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={hoursData}>
                                        <defs>
                                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" style={{ fontSize: '10px' }} />
                                        <YAxis style={{ fontSize: '10px' }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="hours" stroke="#8884d8" fillOpacity={1} fill="url(#colorHours)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>

                            <Box h={150}>
                                <Text size="sm" fw={500} mb="xs" ta="center">Logs Submitted</Text>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={logsData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" style={{ fontSize: '10px' }} />
                                        <Tooltip />
                                        <Bar dataKey="logs" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Stack>
                    </Grid.Col>
                </Grid>
            </Paper>
        </Stack>
    );
}

