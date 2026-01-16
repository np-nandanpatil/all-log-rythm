import { useState, useEffect } from 'react';
import {
    Paper,
    Title,
    Group,
    Button,
    Stack,
    Text,
    Timeline,
    ThemeIcon,
    Badge,
    ActionIcon,
    Modal,
    TextInput,
    Textarea,
    Menu
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconFlag, IconPlus, IconDotsVertical, IconCheck, IconClock, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { firebaseService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { Milestone } from '../types';

interface MilestonesProps {
    teamId: string;
    isLeader: boolean;
}

export function Milestones({ teamId, isLeader }: MilestonesProps) {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [modalOpened, setModalOpened] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { currentUser } = useAuth();

    const fetchMilestones = async () => {
        try {
            const data = await firebaseService.getMilestones(teamId);
            // Sort locally if backend sort is tricky, though backend query sorted by dueDate
            setMilestones(data as Milestone[]);
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Error', message: 'Failed to load milestones', color: 'red' });
        }
    };

    useEffect(() => {
        fetchMilestones();
    }, [teamId]);

    const handleCreate = async () => {
        if (!title || !dueDate || !currentUser) return;
        setSubmitting(true);
        try {
            await firebaseService.createMilestone(teamId, title, dueDate, currentUser.uid!, description);
            notifications.show({ title: 'Success', message: 'Milestone created', color: 'green' });
            setModalOpened(false);
            setTitle('');
            setDescription('');
            setDueDate(null);
            fetchMilestones();
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Could not create milestone', color: 'red' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await firebaseService.updateMilestone(id, { status: newStatus });
            notifications.show({ title: 'Updated', message: 'Milestone status updated', color: 'green' });
            fetchMilestones();
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Update failed', color: 'red' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this milestone?")) return;
        try {
            await firebaseService.deleteMilestone(id);
            setMilestones(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Delete failed', color: 'red' });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'teal';
            case 'in-progress': return 'blue';
            case 'delayed': return 'red';
            default: return 'gray';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <IconCheck size={12} />;
            case 'in-progress': return <IconClock size={12} />;
            case 'delayed': return <IconAlertCircle size={12} />;
            default: return <IconFlag size={12} />;
        }
    };

    return (
        <Paper withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
                <Group>
                    <ThemeIcon color="pink" variant="light" size="lg" radius="md"><IconFlag size={20} /></ThemeIcon>
                    <Title order={3}>Project Milestones</Title>
                </Group>
                {isLeader && (
                    <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpened(true)} color="pink">
                        Add Milestone
                    </Button>
                )}
            </Group>

            {milestones.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">No milestones set. Plan your project phases!</Text>
            ) : (
                <Timeline active={milestones.findIndex(m => m.status === 'in-progress') + 1} bulletSize={24} lineWidth={2}>
                    {milestones.map((m) => (
                        <Timeline.Item
                            key={m.id}
                            bullet={getStatusIcon(m.status)}
                            title={m.title}
                            color={getStatusColor(m.status)}
                        >
                            <Group justify="space-between" align="flex-start">
                                <div>
                                    <Text c="dimmed" size="sm" maw={500}>{m.description}</Text>
                                    <Text size="xs" c="dimmed" mt={4}>Due: {new Date(m.dueDate.seconds * 1000).toLocaleDateString()}</Text>
                                </div>

                                <Group>
                                    <Badge color={getStatusColor(m.status)} variant="light">{m.status}</Badge>
                                    {isLeader && (
                                        <Menu position="bottom-end">
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Label>Status</Menu.Label>
                                                <Menu.Item onClick={() => handleStatusUpdate(m.id, 'planned')}>Planned</Menu.Item>
                                                <Menu.Item onClick={() => handleStatusUpdate(m.id, 'in-progress')}>In Progress</Menu.Item>
                                                <Menu.Item onClick={() => handleStatusUpdate(m.id, 'completed')}>Completed</Menu.Item>
                                                <Menu.Item onClick={() => handleStatusUpdate(m.id, 'delayed')} color="red">Delayed</Menu.Item>
                                                <Menu.Divider />
                                                <Menu.Item color="red" onClick={() => handleDelete(m.id)}>Delete</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    )}
                                </Group>
                            </Group>
                        </Timeline.Item>
                    ))}
                </Timeline>
            )}

            <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="Create New Milestone">
                <Stack>
                    <TextInput label="Title" placeholder="e.g. Frontend MVP" required value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
                    <Textarea label="Description" placeholder="Details about this phase..." value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
                    <DateInput label="Due Date" placeholder="Pick date" value={dueDate} onChange={setDueDate} />
                    <Button onClick={handleCreate} loading={submitting} fullWidth mt="md">Create Milestone</Button>
                </Stack>
            </Modal>
        </Paper>
    );
}
