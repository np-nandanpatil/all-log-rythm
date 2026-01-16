import React, { forwardRef } from 'react';
import { Box, Title, Text, Table, Badge, Grid, Stack, Divider, Paper, Group, ThemeIcon } from '@mantine/core';
import { IconClock, IconBrain, IconUser, IconUsersGroup } from '@tabler/icons-react';
import { Log, Team } from '../types';

interface ReportTemplateProps {
    logs: Log[];
    team?: Team;
    studentName?: string;
    totalHours: number;
    teamRoster?: { leader?: any, guides: any[], members: any[] };
}

const formatDate = (dateValue: any): string => {
    try {
        if (!dateValue) return 'Invalid Date';
        // Handle Firestore Timestamp
        if (dateValue?.toDate) {
            return dateValue.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        // Handle String/Date
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
        return 'Invalid Date';
    }
};

export const ReportTemplate = forwardRef<HTMLDivElement, ReportTemplateProps>(
    ({ logs, team, studentName, totalHours, teamRoster }, ref) => {

        // Sort logs safely
        const sortedLogs = [...logs].sort((a, b) => {
            const dateA = (a.startDate as any)?.toDate ? (a.startDate as any).toDate() : new Date(a.startDate as any);
            const dateB = (b.startDate as any)?.toDate ? (b.startDate as any).toDate() : new Date(b.startDate as any);
            return dateB.getTime() - dateA.getTime();
        });

        return (
            <Box p="xl" ref={ref} style={{ background: 'white', minHeight: '100vh', color: 'black' }}>
                {/* Header */}
                <Grid mb="xl" align="center">
                    <Grid.Col span={8}>
                        <Title order={1} mb="xs" style={{ fontSize: '2rem' }}>LogSphere Report</Title>
                        <Text c="dimmed" size="sm">Generated on {new Date().toLocaleDateString()}</Text>
                    </Grid.Col>
                    <Grid.Col span={4} style={{ textAlign: 'right' }}>
                        <Badge size="lg" color="indigo" variant="filled">Official Record</Badge>
                    </Grid.Col>
                </Grid>

                <Divider mb="xl" />

                {/* Info Cards */}
                <Grid mb="3rem">
                    <Grid.Col span={4}>
                        <Paper withBorder p="md" radius="md" h="100%">
                            <Group mb="xs">
                                <ThemeIcon color="cyan" variant="light"><IconUser size={18} /></ThemeIcon>
                                <Text fw={700}>Student Details</Text>
                            </Group>
                            <Text size="sm"><Text span fw={600}>Name:</Text> {studentName || 'N/A'}</Text>
                            <Text size="sm"><Text span fw={600}>Team:</Text> {team?.name || 'N/A'}</Text>
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Paper withBorder p="md" radius="md" h="100%">
                            <Group mb="xs">
                                <ThemeIcon color="orange" variant="light"><IconClock size={18} /></ThemeIcon>
                                <Text fw={700}>Performance Stats</Text>
                            </Group>
                            <Text size="sm"><Text span fw={600}>Total Hours Logged:</Text> {totalHours}h</Text>
                            <Text size="sm"><Text span fw={600}>Total Logs:</Text> {logs.length}</Text>
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Paper withBorder p="md" radius="md" h="100%">
                            <Group mb="xs">
                                <ThemeIcon color="grape" variant="light"><IconUsersGroup size={18} /></ThemeIcon>
                                <Text fw={700}>Team Composition</Text>
                            </Group>
                            <Text size="sm"><Text span fw={600}>Lead:</Text> {teamRoster?.leader?.name || 'N/A'}</Text>
                            <Text size="sm"><Text span fw={600}>Guides:</Text> {teamRoster?.guides?.map(g => g.name).join(', ') || 'N/A'}</Text>
                            <Text size="sm"><Text span fw={600}>Members:</Text> {teamRoster?.members?.map(m => m.name).join(', ') || 'None'}</Text>
                        </Paper>
                    </Grid.Col>
                </Grid>

                {/* ... rest of component ... */}

                {/* Project Info if available */}
                {team?.description && (
                    <Box mb="xl">
                        <Title order={4} mb="sm">Project Description</Title>
                        <Text size="sm" style={{ lineHeight: 1.6 }}>{team.description}</Text>
                    </Box>
                )}

                {/* Logs Table */}
                <Title order={3} mb="md">Activity Log</Title>
                <Table withTableBorder withColumnBorders striped>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Date</Table.Th>
                            <Table.Th>Activity / Tasks</Table.Th>
                            <Table.Th>Hours</Table.Th>
                            <Table.Th>Status</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sortedLogs.map((log) => {
                            const logHours = log.activities?.reduce((sum: number, act: any) => sum + (Number(act.hours) || 0), 0) || 0;
                            return (
                                <Table.Tr key={log.id}>
                                    <Table.Td style={{ width: '15%' }}>{formatDate(log.startDate)}</Table.Td>
                                    <Table.Td>
                                        <Stack gap="xs">
                                            {log.activities?.map((act, i) => (
                                                <Text key={i} size="sm">• {act.description}</Text>
                                            ))}
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td style={{ width: '10%', textAlign: 'center' }}>{logHours}</Table.Td>
                                    <Table.Td style={{ width: '15%' }}>
                                        <Badge color={log.status === 'approved' || log.status === 'final-approved' ? 'green' : 'yellow'} variant="light">
                                            {log.status.toUpperCase()}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>

                <Box mt="4rem" style={{ textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">Verified by LogSphere Academic Suite</Text>
                </Box>
            </Box>
        );
    }
);
