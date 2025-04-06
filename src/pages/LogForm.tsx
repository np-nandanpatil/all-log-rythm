import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, 
  Title, 
  /*TextInput,*/ 
  NumberInput, 
  Button, 
  Group, 
  Stack, 
  Textarea, 
  Paper, 
  Text,
  /*Select,*/
  AppShell
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { NotificationCenter } from '../components/NotificationCenter';

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

  useEffect(() => {
    if (id) {
      const log = dataService.getLogById(id);
      if (log) {
        setWeekNumber(log.weekNumber);
        setStartDate(new Date(log.startDate));
        setEndDate(new Date(log.endDate));
        setLogStatus(log.status);
        setActivities(log.activities.map((activity: any) => ({
          date: new Date(activity.date),
          hours: activity.hours,
          description: activity.description
        })));
      }
    }
  }, [id]);

  const handleAddActivity = () => {
    setActivities([...activities, { date: new Date(), hours: 0, description: '' }]);
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleActivityChange = (index: number, field: string, value: any) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setActivities(newActivities);
    
    // Validate activity date is within log date range
    if (field === 'date' && value && startDate && endDate) {
      const activityDate = new Date(value);
      if (activityDate < startDate || activityDate > endDate) {
        setActivityDateError(`Activity date must be within the log date range (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);
      } else {
        setActivityDateError(null);
      }
    }
  };

  const checkWeekNumberExists = (weekNum: number): boolean => {
    // Skip check if we're editing the current log
    if (id) {
      const currentLog = dataService.getLogById(id);
      if (currentLog && currentLog.weekNumber === weekNum) {
        return false; // Week number is valid for the current log being edited
      }
    }
    
    // Check if any other log has this week number
    const allLogs = dataService.getLogs();
    return allLogs.some((log: { weekNumber: number }) => log.weekNumber === weekNum);
  };

  const handleWeekNumberChange = (value: string | number) => {
    const numValue = typeof value === 'string' ? (value === '' ? 1 : parseInt(value, 10)) : value;
    setWeekNumber(numValue);
    
    // Check if week number already exists
    if (checkWeekNumberExists(numValue)) {
      setWeekNumberError(`Week ${numValue} log already exists. Please choose a different week.`);
    } else {
      setWeekNumberError(null);
    }
  };

  const checkDateRangeOverlap = (start: Date | null, end: Date | null): boolean => {
    if (!start || !end) return false;
    
    try {
      return dataService.isDateRangeOverlapping(
        start.toISOString(),
        end.toISOString(),
        id
      );
    } catch (error) {
      console.error('Error checking date range overlap:', error);
      return false;
    }
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    
    // Check if date range overlaps with any existing log
    if (date && endDate && checkDateRangeOverlap(date, endDate)) {
      setDateRangeError('The date range overlaps with an existing log. Please choose a different date range.');
    } else {
      setDateRangeError(null);
    }
    
    // Validate activity dates are within new date range
    if (date && endDate) {
      for (const activity of activities) {
        if (activity.date) {
          const activityDate = new Date(activity.date);
          if (activityDate < date || activityDate > endDate) {
            setActivityDateError(`Activity date ${activityDate.toLocaleDateString()} is outside the log date range (${date.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);
            return;
          }
        }
      }
      setActivityDateError(null);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    
    // Check if date range overlaps with any existing log
    if (startDate && date && checkDateRangeOverlap(startDate, date)) {
      setDateRangeError('The date range overlaps with an existing log. Please choose a different date range.');
    } else {
      setDateRangeError(null);
    }
    
    // Validate activity dates are within new date range
    if (startDate && date) {
      for (const activity of activities) {
        if (activity.date) {
          const activityDate = new Date(activity.date);
          if (activityDate < startDate || activityDate > date) {
            setActivityDateError(`Activity date ${activityDate.toLocaleDateString()} is outside the log date range (${startDate.toLocaleDateString()} - ${date.toLocaleDateString()})`);
            return;
          }
        }
      }
      setActivityDateError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      notifications.show({
        title: 'Error',
        message: 'Please select both start and end dates',
        color: 'red'
      });
      return;
    }

    if (activities.some(activity => !activity.date || !activity.description)) {
      notifications.show({
        title: 'Error',
        message: 'Please fill in all activity details',
        color: 'red'
      });
      return;
    }

    // Check if week number already exists
    if (checkWeekNumberExists(weekNumber)) {
      notifications.show({
        title: 'Error',
        message: `Week ${weekNumber} log already exists. Please choose a different week.`,
        color: 'red'
      });
      return;
    }
    
    // Check if date range overlaps with any existing log
    if (checkDateRangeOverlap(startDate, endDate)) {
      notifications.show({
        title: 'Error',
        message: 'The date range overlaps with an existing log. Please choose a different date range.',
        color: 'red'
      });
      return;
    }
    
    // Validate activity dates are within log date range
    for (const activity of activities) {
      if (activity.date) {
        const activityDate = new Date(activity.date);
        if (activityDate < startDate || activityDate > endDate) {
          notifications.show({
            title: 'Error',
            message: `Activity date ${activityDate.toLocaleDateString()} is outside the log date range (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
            color: 'red'
          });
          return;
        }
      }
    }

    setLoading(true);

    try {
      const logData = {
        weekNumber,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        activities: activities.map(activity => ({
          date: activity.date!.toISOString(),
          hours: activity.hours,
          description: activity.description
        })),
        status: id ? logStatus : 'draft', // Preserve existing status when updating
        createdBy: currentUser?.id,
        createdByName: currentUser?.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (id) {
        dataService.updateLog(id, logData);
        notifications.show({
          title: 'Success',
          message: 'Log updated successfully',
          color: 'green'
        });
      } else {
        dataService.createLog(logData);
        notifications.show({
          title: 'Success',
          message: 'Log created successfully',
          color: 'green'
        });
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving log:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to save log',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!id) {
      notifications.show({
        title: 'Error',
        message: 'Please save the log first before submitting for review',
        color: 'red'
      });
      return;
    }

    setLoading(true);

    try {
      const log = dataService.getLogById(id);
      if (!log) {
        notifications.show({
          title: 'Error',
          message: 'Log not found',
          color: 'red'
        });
        return;
      }

      // Update log status to pending-lead
      dataService.updateLog(id, {
        ...log,
        status: 'pending-lead'
      });

      notifications.show({
        title: 'Success',
        message: 'Log submitted for team lead review',
        color: 'green'
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error submitting log for review:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to submit log for review',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header p="xs">
        <Group justify="space-between">
          <Title order={3} c="purple">ExposeNet log</Title>
          <Group>
            <NotificationCenter />
            <Button onClick={handleSignOut} variant="outline" color="red" size="sm">
              Sign Out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="md" py="xl">
          <Title mb="xl" c="purple">{id ? 'Edit Log' : 'Create New Log'}</Title>

          <Paper withBorder shadow="md" p="xl" radius="md">
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                {/* Week number and date range section */}
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
                  
                  <Group grow align="flex-start" wrap="wrap">
                    <div>
                      <Text size="sm" fw={500} mb={5}>Start Date</Text>
                      <DatePicker
                        value={startDate}
                        onChange={handleStartDateChange}
                        style={{ minWidth: '200px', flex: '1 1 200px' }}
                      />
                      {dateRangeError && <Text c="red" size="sm">{dateRangeError}</Text>}
                    </div>
                    <div>
                      <Text size="sm" fw={500} mb={5}>End Date</Text>
                      <DatePicker
                        value={endDate}
                        onChange={handleEndDateChange}
                        style={{ minWidth: '200px', flex: '1 1 200px' }}
                      />
                    </div>
                  </Group>
                </Stack>

                <Text fw={500} size="lg" mt="md">Activities</Text>
                {activityDateError && (
                  <Text c="red" size="sm">{activityDateError}</Text>
                )}

                {activities.map((activity, index) => (
                  <Paper key={index} withBorder p="md" radius="md">
                    <Stack gap="md">
                      <Group grow align="flex-start" wrap="wrap">
                        <div>
                          <Text size="sm" fw={500} mb={5}>Date</Text>
                          <DatePicker
                            value={activity.date}
                            onChange={(date) => handleActivityChange(index, 'date', date)}
                            style={{ minWidth: '200px', flex: '1 1 200px' }}
                          />
                        </div>
                        <NumberInput
                          label="Hours"
                          placeholder="Enter hours"
                          min={0}
                          max={24}
                          value={activity.hours}
                          onChange={(value) => handleActivityChange(index, 'hours', value)}
                          radius="md"
                          style={{ minWidth: '150px', flex: '1 1 150px' }}
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
                  {!id && (
                    <Button 
                      onClick={handleSubmitForReview}
                      loading={loading}
                      color="green"
                      radius="md"
                    >
                      Submit for Review
                    </Button>
                  )}
                  {id && logStatus === 'draft' && (
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