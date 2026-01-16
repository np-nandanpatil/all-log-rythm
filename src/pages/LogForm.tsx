import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Title,
  NumberInput,
  Button,
  Group,
  Stack,
  Textarea,
  Paper,
  Box,
  Container,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services';
import { formatDateForStorage, parseDateString } from '../utils/dateHelpers';
import { Layout } from '../components/Layout';
import { IconCalendar, IconPlus, IconTrash, IconDeviceFloppy, IconSend, IconX, IconArrowLeft } from '@tabler/icons-react';
import { motion } from 'framer-motion';

export function LogForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [logDate, setLogDate] = useState<Date | null>(new Date());
  const [activities, setActivities] = useState<Array<{
    hours: number;
    description: string;
  }>>([{ hours: 0, description: '' }]);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [logStatus, setLogStatus] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchLog = async () => {
        const log = await firebaseService.getLogById(id);
        if (log) {
          const parsedDate = parseDateString(log.startDate);
          setLogDate(parsedDate);
          setLogStatus(log.status);
          setActivities(log.activities.map((activity: any) => ({
            hours: activity.hours,
            description: activity.description
          })));
        }
      };
      fetchLog();
    }
  }, [id]);

  const handleAddActivity = () => {
    setActivities([...activities, { hours: 0, description: '' }]);
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleActivityChange = (index: number, field: string, value: any) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setActivities(newActivities);
  };

  const checkDateOverlap = async (date: Date | null): Promise<boolean> => {
    if (!date || !currentUser?.teamIds?.[0]) return false;
    // For Daily Logs, we check if a log already exists for this exact date
    // Re-using isDateRangeOverlapping with same start/end
    try {
      if (id) {
        const currentLog = await firebaseService.getLogById(id);
        // If editing, and date hasn't changed, no overlap error with itself
        if (currentLog && currentLog.startDate === formatDateForStorage(date)) {
          return false;
        }
      }
      return await firebaseService.isDateRangeOverlapping(
        formatDateForStorage(date),
        formatDateForStorage(date),
        currentUser.teamIds[0],
        id
      );
    } catch (error) {
      console.error('Error checking date overlap:', error);
      return false;
    }
  };

  const handleDateChange = async (date: Date | null) => {
    const parsedDate = date ? parseDateString(date) : null;
    setLogDate(parsedDate);

    if (parsedDate) {
      const overlaps = await checkDateOverlap(parsedDate);
      if (overlaps) {
        setDateError('A log for this date already exists.');
      } else {
        setDateError(null);
      }
    }
  };

  const createLogData = (status: string) => {
    if (!logDate) throw new Error('Log Date is required');
    if (!currentUser?.id) throw new Error('User ID missing');

    const teamId = currentUser.teamIds?.[0];

    // Strict check for members
    if (!teamId && currentUser.role !== 'team_lead' && currentUser.role !== 'admin') {
      throw new Error('You appear not to be in a team. Please try refreshing the page.');
    }

    const formattedDate = formatDateForStorage(logDate);

    return {
      weekNumber: 0, // Legacy field, not used for daily logs
      startDate: formattedDate,
      endDate: formattedDate, // Same as start date for daily log
      activities: activities.map(activity => ({
        date: formattedDate, // All activities happen on the Log Date
        hours: Number(activity.hours) || 0,
        description: activity.description
      })),
      status,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdByUsername: currentUser.username || '',
      teamId: teamId || null,
      createdAt: formatDateForStorage(new Date()),
      updatedAt: formatDateForStorage(new Date())
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDate || !currentUser?.id) {
      notifications.show({ title: 'Missing Fields', message: 'Please select a date', color: 'red' });
      return;
    }
    if (activities.some(activity => !activity.description)) {
      notifications.show({ title: 'Incomplete Activities', message: 'Please describe all activities', color: 'red' });
      return;
    }

    setLoading(true);
    try {
      const logData = createLogData(id ? logStatus || 'draft' : 'draft');
      if (id) {
        const currentLog = await firebaseService.getLogById(id);
        const updateData = currentLog ? { ...currentLog, ...logData } : logData;
        await firebaseService.updateLog(id, updateData);
      } else {
        await firebaseService.createLog(logData);
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving log:', error);
      notifications.show({ title: 'Error', message: error.message || 'Failed to save log', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!logDate || !currentUser?.id) {
      notifications.show({ title: 'Missing Fields', message: 'Please select a date', color: 'red' });
      return;
    }
    if (activities.some(activity => !activity.description)) {
      notifications.show({ title: 'Incomplete Activities', message: 'Please describe all activities', color: 'red' });
      return;
    }

    setLoading(true);
    try {
      const logData = createLogData('pending-lead');
      if (id) {
        const currentLog = await firebaseService.getLogById(id);
        if (!currentLog) throw new Error('Log not found');
        const updateData = { ...logData, createdBy: currentLog.createdBy, createdByName: currentLog.createdByName };
        await firebaseService.updateLog(id, updateData);
      } else {
        await firebaseService.createLog(logData);
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error submitting log:', error);
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container size="lg" py="md">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Group mb="xl">
            <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Title order={2}>{id ? 'Edit Daily Log' : 'Create New Daily Log'}</Title>
          </Group>

          <form onSubmit={handleSubmit}>
            <Stack gap="xl">
              <Paper p="xl" radius="lg" withBorder>
                <Title order={4} mb="lg">Log Details</Title>
                <DatePickerInput
                  label="Date"
                  placeholder="Pick date"
                  value={logDate}
                  onChange={handleDateChange}
                  error={dateError}
                  leftSection={<IconCalendar size={16} />}
                  w="100%"
                  maw={300}
                />
              </Paper>

              <Paper p="xl" radius="lg" withBorder>
                <Group justify="space-between" mb="lg">
                  <Title order={4}>Activities</Title>
                  <Button variant="light" size="sm" onClick={handleAddActivity} leftSection={<IconPlus size={16} />}>
                    Add Activity
                  </Button>
                </Group>

                <Stack gap="lg">
                  {activities.map((activity, index) => (
                    <Box key={index} style={{ position: 'relative' }}>
                      <Paper withBorder p="md" radius="md" bg="var(--mantine-color-default)">
                        <Group align="flex-start" mb="sm">
                          {/* Removed Individual Date Picker */}
                          <NumberInput
                            placeholder="Hrs"
                            min={0}
                            max={24}
                            value={activity.hours}
                            onChange={(val) => handleActivityChange(index, 'hours', val)}
                            style={{ width: 80 }}
                            label="Hours"
                          />
                          {activities.length > 1 && (
                            <Button color="red" variant="subtle" p={0} onClick={() => handleRemoveActivity(index)} style={{ marginLeft: 'auto' }}>
                              <IconTrash size={16} />
                            </Button>
                          )}
                        </Group>
                        <Textarea
                          placeholder="Describe what you did today..."
                          minRows={2}
                          autosize
                          label="Description"
                          value={activity.description}
                          onChange={(e) => handleActivityChange(index, 'description', e.target.value)}
                        />
                      </Paper>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              <Group justify="flex-end" pb="xl">
                <Button variant="default" onClick={() => navigate('/dashboard')} leftSection={<IconX size={16} />}>
                  Discard
                </Button>
                <Button type="submit" variant="light" loading={loading} leftSection={<IconDeviceFloppy size={16} />}>
                  Save Draft
                </Button>
                {(!id || logStatus === 'draft' || logStatus === 'needs-revision') && (
                  <Button onClick={handleSubmitForReview} color="indigo" loading={loading} leftSection={<IconSend size={16} />}>
                    Submit for Review
                  </Button>
                )}
              </Group>
            </Stack>
          </form>
        </motion.div>
      </Container>
    </Layout>
  );
}