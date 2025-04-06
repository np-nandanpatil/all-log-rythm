import { useEffect, useState } from 'react';
import { Container, Title, Button, Group, Card, Text, Stack, AppShell } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { NotificationCenter } from '../components/NotificationCenter';

export function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      // Get all logs for everyone to view
      const allLogs = dataService.getLogs();
      setLogs(allLogs);
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
              >
                Create New Log
              </Button>
            )}
          </Group>

          <Stack gap="md">
            {logs.length > 0 ? (
              logs.map((log) => (
                <Card 
                  key={log.id} 
                  withBorder 
                  padding="lg" 
                  radius="md"
                  style={{ 
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleViewLog(log.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <div>
                      <Text fw={700} size="lg">Week {log.weekNumber}</Text>
                      <Text size="sm" c="dimmed">
                        {new Date(log.startDate).toLocaleDateString()} - {new Date(log.endDate).toLocaleDateString()}
                      </Text>
                    </div>
                    <Text 
                      size="sm" 
                      fw={500} 
                      c={getLogStatusColor(log.status)}
                      style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        backgroundColor: `var(--mantine-color-${getLogStatusColor(log.status)}-1)`,
                        border: `1px solid var(--mantine-color-${getLogStatusColor(log.status)}-3)`
                      }}
                    >
                      {getLogStatusText(log)}
                    </Text>
                  </Group>
                  
                  <Text size="sm" mb="xs">
                    Created by: {log.createdByName || 'Unknown'}
                  </Text>
                  
                  <Text size="sm" c="dimmed">
                    Last updated: {new Date(log.updatedAt).toLocaleString()}
                  </Text>
                </Card>
              ))
            ) : (
              <Card withBorder padding="xl" radius="md">
                <Stack align="center" gap="md">
                  <Text size="lg" c="dimmed">No logs found</Text>
                  {(currentUser?.role === 'student' || currentUser?.role === 'team_lead') && (
                    <Button 
                      onClick={handleCreateLog}
                      variant="light"
                      color="indigo"
                    >
                      Create your first log
                    </Button>
                  )}
                </Stack>
              </Card>
            )}
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
} 