import { useEffect, useState } from 'react';
import { Container, Title, Button, Group, Card, Text, Stack, AppShell, Badge } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dataServiceAdapter } from '../services';
import { NotificationCenter } from '../components/NotificationCenter';
import { notifications } from '@mantine/notifications';

// Helper function to format date safely
const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return 'Invalid Date';
    
    // Parse the ISO date string
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    // Format using the browser's locale
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'for date string:', dateString);
    return 'Invalid Date';
  }
};

export function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const fetchLogs = async () => {
        try {
          // Get all logs for everyone to view
          const allLogs = await dataServiceAdapter.getLogs();
          
          // Sort logs by week number
          const sortedLogs = allLogs.sort((a: any, b: any) => a.weekNumber - b.weekNumber);
          setLogs(sortedLogs);
        } catch (error) {
          console.error('Error fetching logs:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchLogs();
    }
  }, [currentUser]);

  const handleCreateLog = () => {
    navigate('/logs/new');
  };

  const handleViewLog = (logId: string) => {
    navigate(`/logs/${logId}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm('Are you sure you want to delete this log? This action cannot be undone.')) {
      return;
    }
    
    try {
      await dataServiceAdapter.deleteLog(logId);
      // Update the logs list after deletion
      const updatedLogs = logs.filter(log => log.id !== logId);
      setLogs(updatedLogs);
      
      notifications.show({
        title: 'Success',
        message: 'Log deleted successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Error deleting log:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete log',
        color: 'red'
      });
    }
  };

  const getLogStatusText = (log: any) => {
    switch (log.status) {
      case 'draft':
        return 'Draft';
      case 'pending-lead':
        return 'Pending Team Lead Review';
      case 'pending-guide':
        return 'Pending Guide Review';
      case 'approved':
        return 'Approved by Guide';
      case 'final-approved':
        return 'Final Approved';
      case 'needs-revision':
        return 'Needs Revision';
      default:
        return log.status;
    }
  };

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'gray';
      case 'pending-lead':
        return 'blue';
      case 'pending-guide':
        return 'yellow';
      case 'approved':
        return 'green';
      case 'final-approved':
        return 'teal';
      case 'needs-revision':
        return 'red';
      default:
        return 'gray';
    }
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
            <NotificationCenter />
            <Button onClick={handleSignOut} variant="outline" color="red" size="sm">
              Sign Out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" py="xl">
          <Title mb="xl" c="purple">Welcome, {currentUser?.name}</Title>

          <Group justify="space-between" mb="xl">
            <Title order={2}>All Logs</Title>
            {(currentUser?.role === 'student' || currentUser?.role === 'team_lead') && (
              <Button 
                onClick={handleCreateLog}
                leftSection={<span>+</span>}
                variant="filled"
                color="indigo"
                radius="md"
              >
                Create New Log
              </Button>
            )}
          </Group>

          {loading ? (
            <Text>Loading logs...</Text>
          ) : logs.length > 0 ? (
            <Stack>
              {logs.map(log => (
                <Card key={log.id} withBorder p="md" radius="md">
                  <Group justify="space-between" mb="xs">
                    <Title order={3}>Week {log.weekNumber}</Title>
                    <Badge color={getLogStatusColor(log.status)} radius="md">
                      {getLogStatusText(log)}
                    </Badge>
                  </Group>
                  
                  <Text size="sm" c="dimmed" mb="md">
                    {formatDate(log.startDate)} - {formatDate(log.endDate)}
                  </Text>
                  
                  <Text mb="md">
                    Created by: {log.createdByName} ({log.createdByUsername || log.createdBy})
                  </Text>
                  
                  <Group justify="flex-end">
                    <Button 
                      onClick={() => handleViewLog(log.id)}
                      variant="light"
                      color="indigo"
                      radius="md"
                    >
                      View Details
                    </Button>
                    {currentUser?.id === log.createdBy && (log.status === 'draft' || log.status === 'needs-revision') && (
                      <Button 
                        onClick={() => navigate(`/logs/${log.id}/edit`)}
                        variant="light"
                        color="blue"
                        radius="md"
                      >
                        Edit Log
                      </Button>
                    )}
                    {currentUser?.role === 'team_lead' && (
                      <Button 
                        onClick={() => handleDeleteLog(log.id)}
                        variant="light"
                        color="red"
                        radius="md"
                      >
                        Delete Log
                      </Button>
                    )}
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text>No logs found. Create a new log to get started.</Text>
          )}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
} 