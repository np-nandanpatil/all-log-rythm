import { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  TextInput, 
  Button, 
  Stack, 
  Group,
  Badge,
  Divider,
  Loader,
  Center
} from '@mantine/core';
import { IconUsers, IconMail, IconUserPlus } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { firebaseService } from '../services';
import { notifications } from '@mantine/notifications';

export function TeamManagement() {
  const { currentUser, refreshUser } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [guideEmail, setGuideEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);

  // Fetch team data
  useEffect(() => {
    const fetchTeam = async () => {
      if (currentUser?.teamIds?.[0]) {
        try {
          const teamData = await firebaseService.getTeamById(currentUser.teamIds[0]);
          if (teamData) {
            setTeam(teamData);
          } else {
            // Team ID exists but team not found - clear it
            console.warn('Team not found, user needs to create new team');
            setTeam(null);
          }
        } catch (err) {
          console.error('Error fetching team:', err);
          // Team doesn't exist, allow creating new one
          setTeam(null);
        }
      }
      setLoadingTeam(false);
    };
    fetchTeam();
  }, [currentUser]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a team name',
        color: 'red'
      });
      return;
    }

    if (!currentUser?.uid) {
      notifications.show({
        title: 'Error',
        message: 'User not authenticated',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      const newTeam = await firebaseService.createTeam(teamName.trim(), currentUser.uid);
      setTeam(newTeam);
      await refreshUser();
      notifications.show({
        title: 'Success!',
        message: `Team "${teamName}" created successfully`,
        color: 'green'
      });
      setTeamName('');
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to create team',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!memberEmail.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter member email',
        color: 'red'
      });
      return;
    }
    
    notifications.show({
      title: 'Coming Soon',
      message: 'Email invitation system will be implemented next',
      color: 'blue'
    });
    setMemberEmail('');
  };

  const handleInviteGuide = async () => {
    if (!guideEmail.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter guide email',
        color: 'red'
      });
      return;
    }
    
    notifications.show({
      title: 'Coming Soon',
      message: 'Email invitation system will be implemented next',
      color: 'blue'
    });
    setGuideEmail('');
  };

  if (loadingTeam) {
    return (
      <Layout>
        <Center h="80vh">
          <Loader size="lg" />
        </Center>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container size="md" py="xl">
        <Stack gap="xl">
          <div>
            <Title order={1}>Team Management</Title>
            <Text c="dimmed">Manage your team and invite members</Text>
          </div>

          {!team ? (
            /* Create Team */
            <Paper p="xl" withBorder>
              <Stack gap="md">
                <Group>
                  <IconUsers size={24} />
                  <Title order={3}>Create Your Team</Title>
                </Group>
                
                <Text size="sm" c="dimmed">
                  Create a team to start inviting members and guides
                </Text>

                <TextInput
                  label="Team Name"
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  size="md"
                />

                <Button
                  onClick={handleCreateTeam}
                  loading={loading}
                  size="md"
                  leftSection={<IconUserPlus size={18} />}
                >
                  Create Team
                </Button>
              </Stack>
            </Paper>
          ) : (
            /* Team Dashboard */
            <>
              <Paper p="xl" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={2}>{team.name}</Title>
                    <Badge size="lg" variant="light">Active</Badge>
                  </Group>
                </Stack>
              </Paper>

              {/* Invite Member */}
              <Paper p="xl" withBorder>
                <Stack gap="md">
                  <Group>
                    <IconMail size={20} />
                    <Title order={3}>Invite Team Member</Title>
                  </Group>
                  
                  <TextInput
                    label="Member Email"
                    placeholder="member@example.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    size="md"
                  />

                  <Button
                    onClick={handleInviteMember}
                    size="md"
                    leftSection={<IconUserPlus size={18} />}
                  >
                    Send Invitation
                  </Button>
                </Stack>
              </Paper>

              {/* Invite Guide */}
              <Paper p="xl" withBorder>
                <Stack gap="md">
                  <Group>
                    <IconMail size={20} />
                    <Title order={3}>Invite Faculty Guide</Title>
                  </Group>
                  
                  <TextInput
                    label="Guide Email"
                    placeholder="guide@example.com"
                    value={guideEmail}
                    onChange={(e) => setGuideEmail(e.target.value)}
                    size="md"
                  />

                  <Button
                    onClick={handleInviteGuide}
                    size="md"
                    color="blue"
                    leftSection={<IconUserPlus size={18} />}
                  >
                    Send Invitation
                  </Button>
                </Stack>
              </Paper>
            </>
          )}
        </Stack>
      </Container>
    </Layout>
  );
}
