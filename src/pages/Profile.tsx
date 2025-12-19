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
  Avatar,
  Badge,
  Alert,
  Divider,
  CopyButton,
  Tooltip,
  ActionIcon,
  Code
} from '@mantine/core';
import { IconUser, IconMail, IconAlertCircle, IconCheck, IconCopy, IconUsers } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Layout } from '../components/Layout';
import { firebaseService } from '../services';

export function Profile() {
  const { currentUser, refreshUser } = useAuth();
  const [name, setName] = useState(currentUser?.name || '');
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [team, setTeam] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  useEffect(() => {
    if (currentUser?.name) {
      setName(currentUser.name);
    }
  }, [currentUser]);

  // Fetch team data if user is a team leader
  useEffect(() => {
    const fetchTeam = async () => {
      if (currentUser?.role === 'team_lead' && currentUser?.teamIds?.[0]) {
        setLoadingTeam(true);
        try {
          const teamData = await firebaseService.getTeamById(currentUser.teamIds[0]);
          setTeam(teamData);
        } catch (err) {
          console.error('Error fetching team:', err);
        } finally {
          setLoadingTeam(false);
        }
      }
    };
    fetchTeam();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser || !currentUser.uid) return;
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!name.trim()) {
        throw new Error('Name cannot be empty');
      }

      // Update user document in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        profileIncomplete: false // Mark profile as complete
      });

      // Refresh user data in context
      await refreshUser();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container size="md" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <Group>
            <Avatar 
              size={80} 
              radius="xl" 
              color="indigo" 
              variant="light"
            >
              {(currentUser?.name || 'U')[0].toUpperCase()}
            </Avatar>
            <Stack gap={4}>
              <Title order={2}>{currentUser?.name || 'User'}</Title>
              <Group gap="xs">
                <Badge 
                  color="indigo" 
                  variant="light" 
                  size="lg"
                >
                  {(currentUser?.role || 'guest').replace('_', ' ').toUpperCase()}
                </Badge>
                {currentUser?.profileIncomplete && (
                  <Badge color="orange" variant="light" size="lg">
                    Profile Incomplete
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>

          <Divider />

          {/* Profile Incomplete Alert */}
          {currentUser?.profileIncomplete && (
            <Alert 
              icon={<IconAlertCircle size={16} />} 
              title="Complete Your Profile" 
              color="orange"
              variant="light"
            >
              Your profile was auto-created. Please update your name and verify your information.
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert 
              icon={<IconCheck size={16} />} 
              title="Profile Updated" 
              color="green"
              variant="light"
            >
              Your profile has been successfully updated!
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert 
              icon={<IconAlertCircle size={16} />} 
              title="Error" 
              color="red"
              variant="light"
            >
              {error}
            </Alert>
          )}

          {/* Profile Form */}
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Title order={3} size="h4">Profile Information</Title>

              <TextInput
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftSection={<IconUser size={16} />}
                required
                radius="md"
              />

              <TextInput
                label="Email"
                value={currentUser?.email || ''}
                leftSection={<IconMail size={16} />}
                disabled
                radius="md"
                description="Email cannot be changed"
              />

              <TextInput
                label="Role"
                value={(currentUser?.role || 'guest').replace('_', ' ').toUpperCase()}
                disabled
                radius="md"
                description="Contact an administrator to change your role"
              />

              <TextInput
                label="User ID"
                value={currentUser?.uid || ''}
                disabled
                radius="md"
                description="Your unique identifier"
                styles={{ input: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
              />

              <Group justify="flex-end" mt="md">
                <Button
                  onClick={handleSave}
                  loading={loading}
                  color="indigo"
                  radius="md"
                  disabled={name === currentUser?.name}
                >
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </Paper>

          {/* Account Information */}
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Title order={3} size="h4">Account Information</Title>
              
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Account Created</Text>
                <Text size="sm" fw={500}>
                  {currentUser?.createdAt 
                    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Unknown'
                  }
                </Text>
              </Group>

              <Group justify="space-between">
                <Text size="sm" c="dimmed">Teams</Text>
                <Text size="sm" fw={500}>
                  {currentUser?.teamIds?.length || 0} team(s)
                </Text>
              </Group>
            </Stack>
          </Paper>

          {/* Team Management - Only for Team Leaders */}
          {currentUser?.role === 'team_lead' && (
            <>
              {!team && !loadingTeam ? (
                /* Create Team Section */
                <Paper p="xl" radius="md" withBorder>
                  <Stack gap="md">
                    <Group>
                      <IconUsers size={24} color="var(--mantine-color-indigo-6)" />
                      <Title order={3} size="h4">Create Your Team</Title>
                    </Group>
                    
                    <Text size="sm" c="dimmed">
                      As a team leader, you need to create a team first. Once created, you'll get referral codes to invite members and guides.
                    </Text>

                    <TextInput
                      label="Team Name"
                      placeholder="Enter your team name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                      radius="md"
                    />

                    <Button
                      onClick={async () => {
                        if (!teamName.trim()) {
                          setError('Team name cannot be empty');
                          return;
                        }
                        setLoading(true);
                        setError('');
                        try {
                          const newTeam = await firebaseService.createTeam(teamName.trim(), currentUser.uid!);
                          setTeam(newTeam);
                          await refreshUser();
                          setSuccess(true);
                          setTeamName('');
                          setTimeout(() => setSuccess(false), 3000);
                        } catch (err: any) {
                          setError(err.message || 'Failed to create team');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      loading={loading}
                      color="indigo"
                      radius="md"
                    >
                      Create Team
                    </Button>
                  </Stack>
                </Paper>
              ) : team ? (
                /* Team Management Section */
                <Paper p="xl" radius="md" withBorder>
                  <Stack gap="md">
                    <Group>
                      <IconUsers size={24} color="var(--mantine-color-indigo-6)" />
                      <Title order={3} size="h4">Team Management</Title>
                    </Group>
                    
                    <Divider />

                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Team Name</Text>
                      <Text size="sm" fw={600}>{team.name}</Text>
                    </Group>

                    {/* Member Referral Code */}
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Member Referral Code</Text>
                      <Text size="xs" c="dimmed">Share this code with team members to invite them</Text>
                      <Group gap="xs">
                        <Code style={{ flex: 1, padding: '8px 12px', fontSize: '14px' }}>
                          {team.referralCode}
                        </Code>
                        <CopyButton value={team.referralCode}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied!' : 'Copy code'}>
                              <ActionIcon 
                                color={copied ? 'teal' : 'gray'} 
                                variant="light"
                                onClick={copy}
                                size="lg"
                              >
                                <IconCopy size={18} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                      </Group>
                    </Stack>

                    {/* Guide Code */}
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Guide Referral Code</Text>
                      <Text size="xs" c="dimmed">Share this code with your faculty guide/advisor</Text>
                      <Group gap="xs">
                        <Code style={{ flex: 1, padding: '8px 12px', fontSize: '14px' }}>
                          {team.guideCode}
                        </Code>
                        <CopyButton value={team.guideCode}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied!' : 'Copy code'}>
                              <ActionIcon 
                                color={copied ? 'teal' : 'gray'} 
                                variant="light"
                                onClick={copy}
                                size="lg"
                              >
                                <IconCopy size={18} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                      </Group>
                    </Stack>

                    <Divider />

                    {/* Team Stats */}
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Team Members</Text>
                      <Badge color="indigo" variant="light">
                        {team.memberIds?.length || 0} members
                      </Badge>
                    </Group>

                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Guides</Text>
                      <Badge color="blue" variant="light">
                        {team.guideIds?.length || 0} guides
                      </Badge>
                    </Group>
                  </Stack>
                </Paper>
              ) : null}
            </>
          )}
        </Stack>
      </Container>
    </Layout>
  );
}
