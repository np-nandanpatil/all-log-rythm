import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, 
  Title, 
  NumberInput, 
  Button, 
  Group, 
  Stack, 
  Textarea, 
  Paper, 
  Text,
  AppShell,
  Box
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useAuth } from '../contexts/AuthContext';
import { dataServiceAdapter } from '../services';
import { formatDateForDisplay, formatDateForStorage, parseDateString, isDateInRange } from '../utils/dateHelpers';
import { useMediaQuery } from '@mantine/hooks';

export function LogForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser, signOut } = useAuth();
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
  const isMobile = useMediaQuery('(max-width: 48em)');

  useEffect(() => {
    if (id) {
      const fetchLog = async () => {
        const log = await dataServiceAdapter.getLogById(id);
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
    if (id) {
      const currentLog = await dataServiceAdapter.getLogById(id);
      if (currentLog && currentLog.weekNumber === weekNum) {
        return false;
      }
    }
    return await dataServiceAdapter.isWeekNumberExists(weekNum, id);
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
    if (!start || !end) return false;
    try {
      return await dataServiceAdapter.isDateRangeOverlapping(
        formatDateForStorage(start),
        formatDateForStorage(end),
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
        setDateRangeError('The date range overlaps with an existing log. Please choose a different date range.');
      } else {
        setDateRangeError(null);
      }
      
      activities.forEach(activity => {
        if (activity.date) {
          const activityDate = parseDateString(activity.date);
          if (activityDate && (activityDate < startDate || activityDate > parsedDate)) {
            setActivityDateError(`Activity date ${formatDateForDisplay(activityDate)} is outside the log date range`);
            return;
          }
        }
      });
      setActivityDateError(null);
    }
  };

  const createLogData = (status: string) => {
    if (!startDate || !endDate || !currentUser?.id || !currentUser?.name) {
      throw new Error('Missing required data');
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
      createdAt: formatDateForStorage(new Date()),
      updatedAt: formatDateForStorage(new Date())
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !currentUser?.id || !currentUser?.name) {
      alert('Please fill in all required fields');
      return;
    }

    if (activities.some(activity => !activity.date || !activity.description)) {
      alert('Please fill in all activity details');
      return;
    }

    setLoading(true);

    try {
      const logData = createLogData(id ? logStatus || 'draft' : 'draft');

      if (id) {
        const currentLog = await dataServiceAdapter.getLogById(id);
        if (currentLog) {
          const updateData = {
            ...currentLog,
            ...logData
          };
          await dataServiceAdapter.updateLog(id, updateData);
        } else {
          await dataServiceAdapter.updateLog(id, logData);
        }
      } else {
        await dataServiceAdapter.createLog(logData);
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving log:', error);
      alert(error.message || 'Failed to save log');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!startDate || !endDate || !currentUser?.id || !currentUser?.name) {
      alert('Please fill in all required fields');
      return;
    }

    if (activities.some(activity => !activity.date || !activity.description)) {
      alert('Please fill in all activity details');
      return;
    }

    setLoading(true);

    try {
      const logData = createLogData('pending-lead');

      let savedLog;
      if (id) {
        const currentLog = await dataServiceAdapter.getLogById(id);
        if (!currentLog) {
          throw new Error('Log not found');
        }

        const updateData = {
          ...logData,
          createdBy: currentLog.createdBy,
          createdByName: currentLog.createdByName,
          createdByUsername: currentLog.createdByUsername || currentUser.username,
          createdAt: currentLog.createdAt,
          comments: currentLog.comments || []
        };

        savedLog = await dataServiceAdapter.updateLog(id, updateData);
      } else {
        savedLog = await dataServiceAdapter.createLog(logData);
      }

      if (!savedLog || !savedLog.startDate || !savedLog.endDate) {
        throw new Error('Failed to save log with valid dates');
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error submitting log for review:', error);
      alert(error.message || 'Failed to submit log for review');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const validateActivityDate = (date: Date) => {
    if (!startDate || !endDate) return true;
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    return isDateInRange(date, start, end);
  };

  const handleActivityDateChange = (index: number, date: Date | null) => {
    if (!date) return;
    
    if (!validateActivityDate(date)) {
      alert(`Activity date must be between ${formatDateForDisplay(startDate)} and ${formatDateForDisplay(endDate)}`);
      return;
    }

    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], date };
    setActivities(newActivities);
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header p="xs">
        <Group justify="space-between">
          <Title order={3} c="purple">All Log Rythm</Title>
          <Group>
            <Button onClick={handleSignOut} variant="outline" color="red" size="sm">
              Sign Out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="md" py="xl">
          <Title mb="xl" c="purple">{id ? 'Edit Log' : 'Create New Log'}</Title>

          <Paper withBorder shadow="md" p={{ base: 'sm', sm: 'xl' }} radius="md">
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <Stack gap="md">
                  <NumberInput
                    label="Week Number"
                    placeholder="Enter week number"
                    min={1}
                    max={52}
                    value={weekNumber}
                    onChange={handleWeekNumberChange}
                    error={weekNumberError}
                    radius="md"
                  />
                  
                  <Group grow align="flex-start" wrap="wrap" gap="md">
                    <Box w="100%" maw={isMobile ? "100%" : "48%"}>
                      <Text size="sm" fw={500} mb={5}>Start Date</Text>
                      <DatePicker
                        value={startDate}
                        onChange={handleStartDateChange}
                        style={{ width: '100%' }}
                      />
                      {dateRangeError && <Text c="red" size="sm">{dateRangeError}</Text>}
                    </Box>
                    <Box w="100%" maw={isMobile ? "100%" : "48%"}>
                      <Text size="sm" fw={500} mb={5}>End Date</Text>
                      <DatePicker
                        value={endDate}
                        onChange={handleEndDateChange}
                        style={{ width: '100%' }}
                      />
                    </Box>
                  </Group>
                </Stack>

                <Text fw={500} size="lg" mt="md">Activities</Text>
                {activityDateError && (
                  <Text c="red" size="sm">{activityDateError}</Text>
                )}

                {activities.map((activity, index) => (
                  <Paper key={index} withBorder p={{ base: 'xs', sm: 'md' }} radius="md">
                    <Stack gap="md">
                      <Group grow align="flex-start" wrap="wrap" gap="md">
                        <Box w="100%" maw={isMobile ? "100%" : "48%"}>
                          <Text size="sm" fw={500} mb={5}>Date</Text>
                          <DatePicker
                            value={activity.date}
                            onChange={(date) => handleActivityChange(index, 'date', date)}
                            style={{ width: '100%' }}
                          />
                        </Box>
                        <NumberInput
                          label="Hours"
                          placeholder="Enter hours"
                          min={0}
                          max={24}
                          value={activity.hours}
                          onChange={(value) => handleActivityChange(index, 'hours', value)}
                          radius="md"
                          style={{ width: isMobile ? '100%' : undefined, flex: isMobile ? '1 1 100%' : '1 1 150px' }}
                        />
                      </Group>
                      <Group grow>
                        <Textarea
                          label="Description"
                          placeholder="Enter activity description"
                          value={activity.description}
                          onChange={(e) => handleActivityChange(index, 'description', e.target.value)}
                          radius="md"
                        />
                        {activities.length > 1 && (
                          <Button 
                            color="red" 
                            variant="light" 
                            onClick={() => handleRemoveActivity(index)}
                            radius="md"
                            style={{ alignSelf: 'flex-end' }}
                          >
                            Remove
                          </Button>
                        )}
                      </Group>
                    </Stack>
                  </Paper>
                ))}

                <Button 
                  onClick={handleAddActivity} 
                  variant="light" 
                  color="indigo"
                  leftSection={<span>+</span>}
                  radius="md"
                >
                  Add Activity
                </Button>

                <Group justify="flex-end" mt="xl" wrap="wrap" gap="sm">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/dashboard')}
                    radius="md"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    loading={loading}
                    color="indigo"
                    radius="md"
                  >
                    {id ? 'Update Log' : 'Save as Draft'}
                  </Button>
                  {!id && (logStatus === 'draft' || logStatus === 'needs-revision') && (
                    <Button 
                      onClick={handleSubmitForReview}
                      loading={loading}
                      color="green"
                      radius="md"
                    >
                      Submit for Review
                    </Button>
                  )}
                  {id && (logStatus === 'draft' || logStatus === 'needs-revision') && (
                    <Button 
                      onClick={handleSubmitForReview}
                      loading={loading}
                      color="green"
                      radius="md"
                    >
                      Submit for Review
                    </Button>
                  )}
                </Group>
              </Stack>
            </form>
          </Paper>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
} 