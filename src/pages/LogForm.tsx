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
  Text,
  Box,
  Container,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services';
import { formatDateForDisplay, formatDateForStorage, parseDateString } from '../utils/dateHelpers';
import { Layout } from '../components/Layout';
import { IconCalendar, IconPlus, IconTrash, IconDeviceFloppy, IconSend, IconX, IconArrowLeft } from '@tabler/icons-react';
import { motion } from 'framer-motion';

export function LogForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [activities, setActivities] = useState<Array<{
    date: Date | null;
    hours: number;
    description: string;
  }>>([{ date: new Date(), hours: 0, description: '' }]);
  const [loading, setLoading] = useState(false);
  const [weekNumberError, setWeekNumberError] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [activityDateError, setActivityDateError] = useState<string | null>(null);
  const [logStatus, setLogStatus] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchLog = async () => {
        const log = await firebaseService.getLogById(id);
        if (log) {
          setWeekNumber(log.weekNumber);
          const parsedStartDate = parseDateString(log.startDate);
          const parsedEndDate = parseDateString(log.endDate);
          setStartDate(parsedStartDate);
          setEndDate(parsedEndDate);
          setLogStatus(log.status);
          setActivities(log.activities.map((activity: any) => ({
            date: parseDateString(activity.date),
            hours: activity.hours,
            description: activity.description
          })));
        }
      };
      fetchLog();
    }
  }, [id]);

  const handleAddActivity = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setActivities([...activities, { date: now, hours: 0, description: '' }]);
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleActivityChange = (index: number, field: string, value: any) => {
    const newActivities = [...activities];
    if (field === 'date') {
      const parsedDate = parseDateString(value);
      newActivities[index] = { ...newActivities[index], [field]: parsedDate };
    } else {
      newActivities[index] = { ...newActivities[index], [field]: value };
    }
    setActivities(newActivities);
    
    if (field === 'date' && value && startDate && endDate) {
      const activityDate = parseDateString(value);
      if (activityDate && (activityDate < startDate || activityDate > endDate)) {
        setActivityDateError(`Activity date must be within the log date range (${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)})`);
      } else {
        setActivityDateError(null);
      }
    }
  };

  const checkWeekNumberExists = async (weekNum: number): Promise<boolean> => {
    if (!currentUser?.teamIds?.[0]) return false;
    
    if (id) {
      const currentLog = await firebaseService.getLogById(id);
      if (currentLog && currentLog.weekNumber === weekNum) {
        return false;
      }
    }
    return await firebaseService.isWeekNumberExists(weekNum, currentUser.teamIds[0], id);  
  };

  const handleWeekNumberChange = async (value: string | number) => {
    const numValue = typeof value === 'string' ? (value === '' ? 1 : parseInt(value, 10)) : value;
    setWeekNumber(numValue);
    
    const exists = await checkWeekNumberExists(numValue);
    if (exists) {
      setWeekNumberError(`Week ${numValue} log already exists. Please choose a different week.`);
    } else {
      setWeekNumberError(null);
    }
  };

  const checkDateRangeOverlap = async (start: Date | null, end: Date | null): Promise<boolean> => {
    if (!start || !end || !currentUser?.teamIds?.[0]) return false;
    try {
      return await firebaseService.isDateRangeOverlapping(
        formatDateForStorage(start),
        formatDateForStorage(end),
        currentUser.teamIds[0],
        id
      );
    } catch (error) {
      console.error('Error checking date range overlap:', error);
      return false;
    }
  };

  const handleStartDateChange = async (date: Date | null) => {
    const parsedDate = date ? parseDateString(date) : null;
    setStartDate(parsedDate);
    
    if (parsedDate && endDate) {
      const overlaps = await checkDateRangeOverlap(parsedDate, endDate);
      if (overlaps) {
        setDateRangeError('The date range overlaps with an existing log. Please choose a different date range.');
      } else {
        setDateRangeError(null);
      }
      
      activities.forEach(activity => {
        if (activity.date) {
          const activityDate = parseDateString(activity.date);
          if (activityDate && (activityDate < parsedDate || activityDate > endDate)) {
            setActivityDateError(`Activity date ${formatDateForDisplay(activityDate)} is outside the log date range`);
            return;
          }
        }
      });
      setActivityDateError(null);
    }
  };

  const handleEndDateChange = async (date: Date | null) => {
    const parsedDate = date ? parseDateString(date) : null;
    setEndDate(parsedDate);
    
    if (startDate && parsedDate) {
      const overlaps = await checkDateRangeOverlap(startDate, parsedDate);
      if (overlaps) {
        setDateRangeError('The date range overlaps with an existing log.');
      } else {
        setDateRangeError(null);
      }
    }
  };

  const createLogData = (status: string) => {
    if (!startDate || !endDate || !currentUser?.id || !currentUser?.name) {
      throw new Error('Missing required data');
    }

    // Get user's primary team ID
    // Team leaders and admins can create logs without a team
    // Regular members must be part of a team
    const teamId = currentUser.teamIds?.[0];
    if (!teamId && currentUser.role !== 'team_lead' && currentUser.role !== 'admin') {
      throw new Error('You must be part of a team to create logs.\n\nPlease go to your Profile page to join an existing team using a referral code.');
    }

    return {
      weekNumber,
      startDate: formatDateForStorage(startDate),
      endDate: formatDateForStorage(endDate),
      activities: activities.map(activity => ({
        date: formatDateForStorage(activity.date),
        hours: Number(activity.hours) || 0,
        description: activity.description
      })),
      status,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdByUsername: currentUser.username,
      teamId, // Critical for team isolation
      createdAt: formatDateForStorage(new Date()),
      updatedAt: formatDateForStorage(new Date())
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SAVE DRAFT] Button clicked');
    console.log('[SAVE DRAFT] Current user:', currentUser);
    console.log('[SAVE DRAFT] Start date:', startDate);
    console.log('[SAVE DRAFT] End date:', endDate);
    console.log('[SAVE DRAFT] Activities:', activities);
    
    if (!startDate || !endDate || !currentUser?.id || !currentUser?.name) {
      console.error('[SAVE DRAFT] Missing required fields');
      notifications.show({
        title: 'Missing Fields',
        message: 'Please fill in all required fields',
        color: 'red'
      });
      return;
    }
    if (activities.some(activity => !activity.date || !activity.description)) {
      console.error('[SAVE DRAFT] Missing activity details');
      notifications.show({
        title: 'Incomplete Activities',
        message: 'Please fill in all activity details (date, hours, and description)',
        color: 'red'
      });
      return;
    }
    setLoading(true);
    try {
      console.log('[SAVE DRAFT] Creating log data...');
      const logData = createLogData(id ? logStatus || 'draft' : 'draft');
      console.log('[SAVE DRAFT] Log data created:', logData);
      
      if (id) {
        console.log('[SAVE DRAFT] Updating existing log:', id);
        const currentLog = await firebaseService.getLogById(id);
        const updateData = currentLog ? { ...currentLog, ...logData } : logData;
        await firebaseService.updateLog(id, updateData);
        console.log('[SAVE DRAFT] Log updated successfully');
      } else {
        console.log('[SAVE DRAFT] Creating new log...');
        const result = await firebaseService.createLog(logData);
        console.log('[SAVE DRAFT] Log created successfully:', result);
      }
      console.log('[SAVE DRAFT] Navigating to dashboard...');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('[SAVE DRAFT] Error saving log:', error);
      notifications.show({
        title: 'Error Saving Log',
        message: error.message || 'Failed to save log',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    console.log('[SUBMIT] Button clicked');
    console.log('[SUBMIT] Current user:', currentUser);
    console.log('[SUBMIT] Start date:', startDate);
    console.log('[SUBMIT] End date:', endDate);
    console.log('[SUBMIT] Activities:', activities);
    
    if (!startDate || !endDate || !currentUser?.id || !currentUser?.name) {
      console.error('[SUBMIT] Missing required fields');
      notifications.show({
        title: 'Missing Fields',
        message: 'Please fill in all required fields',
        color: 'red'
      });
      return;
    }
    if (activities.some(activity => !activity.date || !activity.description)) {
      console.error('[SUBMIT] Missing activity details');
      notifications.show({
        title: 'Incomplete Activities',
        message: 'Please fill in all activity details (date, hours, and description)',
        color: 'red'
      });
      return;
    }
    setLoading(true);
    try {
      console.log('[SUBMIT] Creating log data with pending-lead status...');
      const logData = createLogData('pending-lead');
      console.log('[SUBMIT] Log data created:', logData);
      
      if (id) {
        console.log('[SUBMIT] Updating existing log:', id);
        const currentLog = await firebaseService.getLogById(id);
        if(!currentLog) throw new Error('Log not found');
        const updateData = { ...logData, createdBy: currentLog.createdBy, createdByName: currentLog.createdByName };
        await firebaseService.updateLog(id, updateData);
        console.log('[SUBMIT] Log updated successfully');
      } else {
        console.log('[SUBMIT] Creating new log...');
        const result = await firebaseService.createLog(logData);
        console.log('[SUBMIT] Log created successfully:', result);
      }
      console.log('[SUBMIT] Navigating to dashboard...');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('[SUBMIT] Error submitting log:', error);
      notifications.show({
        title: 'Error Submitting Log',
        message: error.message,
        color: 'red'
      });
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
              <Title order={2}>{id ? 'Edit Log' : 'Create New Log'}</Title>
          </Group>

          <form onSubmit={handleSubmit}>
              <Stack gap="xl">
                  <Paper p="xl" radius="lg" withBorder bg="white">
                       <Title order={4} mb="lg">Log Details</Title>
                       <Stack gap="md">
                          <NumberInput
                              label="Week Number"
                              description="Which week of your internship is this?"
                              min={1}
                              max={52}
                              value={weekNumber}
                              onChange={handleWeekNumberChange}
                              error={weekNumberError}
                              w="100%"
                              maw={200}
                          />
                           <Group grow>
                              <DatePickerInput
                                  label="Start Date"
                                  placeholder="Pick date"
                                  value={startDate}
                                  onChange={handleStartDateChange}
                                  error={dateRangeError}
                                  leftSection={<IconCalendar size={16} />}
                              />
                              <DatePickerInput
                                  label="End Date"
                                  placeholder="Pick date"
                                  value={endDate}
                                  onChange={handleEndDateChange}
                                  leftSection={<IconCalendar size={16} />}
                              />
                          </Group>
                       </Stack>
                  </Paper>

                  <Paper p="xl" radius="lg" withBorder bg="white">
                      <Group justify="space-between" mb="lg">
                          <Title order={4}>Daily Activities</Title>
                          <Button variant="light" size="sm" onClick={handleAddActivity} leftSection={<IconPlus size={16} />}>
                              Add Activity
                          </Button>
                      </Group>
                      
                      {activityDateError && <Text c="red" size="sm" mb="md">{activityDateError}</Text>}

                      <Stack gap="lg">
                          {activities.map((activity, index) => (
                              <Box key={index} style={{ position: 'relative' }}>
                                  <Paper withBorder p="md" radius="md" bg="gray.0">
                                      <Group align="flex-start" mb="sm">
                                           <DatePickerInput
                                              placeholder="Date"
                                              value={activity.date}
                                              onChange={(date) => handleActivityChange(index, 'date', date)}
                                              style={{ flex: 1 }}
                                          />
                                          <NumberInput
                                              placeholder="Hrs"
                                              min={0}
                                              max={24}
                                              value={activity.hours}
                                              onChange={(val) => handleActivityChange(index, 'hours', val)}
                                              style={{ width: 80 }}
                                          />
                                          {activities.length > 1 && (
                                              <Button color="red" variant="subtle" p={0} onClick={() => handleRemoveActivity(index)}>
                                                  <IconTrash size={16} />
                                              </Button>
                                          )}
                                      </Group>
                                      <Textarea
                                          placeholder="Describe what you did..."
                                          minRows={2}
                                          autosize
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