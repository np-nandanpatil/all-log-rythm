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
  Loader,
  Center,
  Avatar,
  ActionIcon,
  SimpleGrid,
  Divider,
  Box,
  Modal,
  Textarea,
  Anchor,
  ThemeIcon,
  TagsInput,
  Menu,
  Alert
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUsers, IconMail, IconUserPlus, IconTrash, IconCheck, IconBrandGithub, IconDeviceLaptop, IconPencil, IconExternalLink } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { firebaseService } from '../services';
import { notifications } from '@mantine/notifications';
import { CodeBox, CopyBtn } from '../components/TeamCodes';

export function TeamManagement() {
  const { currentUser, refreshUser } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [guideEmail, setGuideEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);

  const [loadingTeam, setLoadingTeam] = useState(true);

  // Project Details Modal State
  const [projectModalOpened, { open: openProjectModal, close: closeProjectModal }] = useDisclosure(false);
  const [projectForm, setProjectForm] = useState({
    repoUrl: '',
    techStack: [] as string[],
    description: ''
  });
  const [savingProject, setSavingProject] = useState(false);

  // Load project details when team loads
  useEffect(() => {
    if (team) {
      setProjectForm({
        repoUrl: team.repoUrl || '',
        techStack: team.techStack || [],
        description: team.description || ''
      });
    }
  }, [team]);

  const handleSaveProjectDetails = async () => {
    if (!team) return;

    // Validation
    if (!projectForm.description.trim()) {
      notifications.show({ title: 'Validation Error', message: 'Project Description is required.', color: 'red' });
      return;
    }
    if (projectForm.techStack.length === 0) {
      notifications.show({ title: 'Validation Error', message: 'Please add at least one technology to the Tech Stack.', color: 'red' });
      return;
    }

    setSavingProject(true);
    try {
      await firebaseService.updateTeamDetails(team.id, {
        repoUrl: projectForm.repoUrl,
        techStack: projectForm.techStack,
        description: projectForm.description
      });

      // Update local state immediately
      setTeam(prev => ({ ...prev, ...projectForm }));
      setTeams(prev => prev.map(t => t.id === team.id ? { ...t, ...projectForm } : t));

      notifications.show({ title: 'Success', message: 'Project details updated', color: 'green' });
      closeProjectModal();
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Failed to update project details', color: 'red' });
    } finally {
      setSavingProject(false);
    }
  };

  // Fetch ALL team data for the user
  const fetchTeamsData = async () => {
    if (currentUser?.teamIds && currentUser.teamIds.length > 0) {
      try {
        const teamIds = currentUser.teamIds;
        // Fetch specific team if selected, or fetch the first one detailed + list of others
        // Simpler: Fetch ALL teams basic info, then detailed info for selected

        const teamsData = await Promise.all(teamIds.map(id => firebaseService.getTeamById(id)));
        const validTeams = teamsData.filter(t => t !== null);
        setTeams(validTeams);

        const activeTeamId = selectedTeamId || validTeams[0]?.id;
        setSelectedTeamId(activeTeamId || null);

        const activeTeam = validTeams.find(t => t?.id === activeTeamId);

        if (activeTeam) {
          setTeam(activeTeam);

          // Fetch Members and Guides
          const allUserIds = [...(activeTeam.memberIds || []), ...(activeTeam.guideIds || [])];
          if (allUserIds.length > 0) {
            const users = await firebaseService.getUsersByIds(allUserIds);
            setMembers(users.filter(u => activeTeam.memberIds?.includes(u.id)));
            setGuides(users.filter(u => activeTeam.guideIds?.includes(u.id)));
          }

          // Fetch Pending Join Requests
          const requests = await firebaseService.getPendingJoinRequests(activeTeam.id);
          setJoinRequests(requests);

        } else {
          setTeam(null);
        }
      } catch (err) {
        console.error('Error fetching team:', err);
        setTeam(null);
      }
    } else {
      setTeam(null);
      setTeams([]);
    }
    setLoadingTeam(false);
  };

  useEffect(() => {
    fetchTeamsData();
  }, [currentUser, selectedTeamId]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      notifications.show({ title: 'Error', message: 'Please enter a team name', color: 'red' });
      return;
    }
    if (!currentUser?.uid) return;

    setLoading(true);
    try {
      const newTeam = await firebaseService.createTeam(teamName.trim(), currentUser.uid);
      setTeam(newTeam);
      await refreshUser();
      notifications.show({ title: 'Success!', message: `Team "${teamName}" created successfully`, color: 'green' });
      setTeamName('');
    } catch (err: any) {
      notifications.show({ title: 'Error', message: err.message || 'Failed to create team', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (type: 'member' | 'guide') => {
    const emailInput = type === 'member' ? memberEmail : guideEmail;
    const setEmailInput = type === 'member' ? setMemberEmail : setGuideEmail;

    if (!emailInput.trim()) {
      notifications.show({ title: 'Error', message: 'Please enter an email address', color: 'red' });
      return;
    }

    // Split by comma
    const emails = emailInput.split(',').map(e => e.trim()).filter(e => e.length > 0);

    setLoading(true);
    try {
      const promises = emails.map(email =>
        firebaseService.createInvitation(
          team.id,
          email,
          type,
          currentUser!.uid!,
          currentUser!.name,
          team.name
        )
      );
      await Promise.all(promises);

      notifications.show({ title: 'Success!', message: `Invitations sent successfully`, color: 'green' });
      setEmailInput('');
      notifications.show({ title: 'Success!', message: `Invitations sent successfully`, color: 'green' });
      setEmailInput('');
      fetchTeamsData(); // Refresh list
    } catch (err: any) {
      notifications.show({ title: 'Error', message: err.message || 'Failed to send invitations', color: 'red' });
    } finally {
      setLoading(false);
    }
  };



  const handleRemoveMember = async (userId: string, role: string, name: string) => {
    // Safety Check: Team Leads cannot remove Guides
    if (currentUser?.role === 'team_lead' && role === 'guide') {
      notifications.show({ title: 'Restricted', message: 'Only Admins can remove Faculty Guides.', color: 'red' });
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${name} from the team?`)) return;
    try {
      await firebaseService.removeTeamMember(team.id, userId, role);
      if (role === 'guide') {
        setGuides(prev => prev.filter(g => g.id !== userId));
      } else {
        setMembers(prev => prev.filter(m => m.id !== userId));
      }
      notifications.show({ title: 'Removed', message: `${name} removed from team`, color: 'orange' });
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Could not remove member', color: 'red' });
    }
  };

  const handleApproveRequest = async (request: any) => {
    try {
      await firebaseService.approveJoinRequest(request.id);
      notifications.show({ title: 'Approved', message: `${request.invitedByName} added to team`, color: 'green' });

      // Update state
      setJoinRequests(prev => prev.filter(r => r.id !== request.id));
      if (request.role === 'guide') {
        // Reload to get full user data or splice in simple object
        fetchTeamsData();
      } else {
        fetchTeamsData();
      }
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Action failed', color: 'red' });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!window.confirm("Reject this request?")) return;
    try {
      await firebaseService.rejectJoinRequest(requestId);
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
      notifications.show({ title: 'Rejected', message: 'Request rejected', color: 'gray' });
    } catch (error: any) {
      console.error(error);
      notifications.show({ title: 'Error', message: error.message || 'Action failed', color: 'red' });
    }
  };

  if (loadingTeam) {
    return (
      <Layout>
        <Center h="80vh"><Loader size="lg" /></Center>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container size="md" py="xl">
        <Stack gap="xl">
          <div>
            <Title order={1}>Team Management</Title>
            <Text c="dimmed">Manage your team settings, members, and invitations.</Text>
          </div>

          {!team ? (
            <Paper p="xl" withBorder radius="md">
              <Stack gap="md">
                <Group>
                  <IconUsers size={24} />
                  <Title order={3}>Create Your Team</Title>
                </Group>
                <Text size="sm" c="dimmed">Create a team to start inviting members and guides.</Text>

                {/* Guide Prompt */}
                {currentUser?.role === 'guide' && (
                  <Alert color="blue" variant="light" mb="md" title="Faculty Guide Notice">
                    As a guide, you typically <b>join</b> existing student teams using their referral codes (via Dashboard).
                    However, if you are creating a team from scratch, you will be assigned as its Leader.
                  </Alert>
                )}

                <TextInput
                  label="Team Name"
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  size="md"
                />
                <Button onClick={handleCreateTeam} loading={loading} size="md" leftSection={<IconUserPlus size={18} />}>
                  Create Team
                </Button>
              </Stack>
            </Paper>
          ) : (
            <>
              {/* Team Header */}
              <Paper p="xl" withBorder radius="md" bg="var(--mantine-color-indigo-light)">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <div>
                      <Text size="xs" fw={700} c="indigo.7" tt="uppercase">Current Team</Text>
                      {/* Team Selector for Multi-Team Users */}
                      {teams.length > 1 ? (
                        <Group mt={4}>
                          <Title order={2} c="indigo.9">{team.name}</Title>
                          <Menu shadow="md" width={200}>
                            <Menu.Target>
                              <Button variant="subtle" size="xs" rightSection={<IconUsers size={14} />}>Switch Team</Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Label>My Teams</Menu.Label>
                              {teams.map(t => (
                                <Menu.Item key={t.id} onClick={() => setSelectedTeamId(t.id)}>
                                  {t.name}
                                </Menu.Item>
                              ))}
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      ) : (
                        <Title order={2} c="indigo.9">{team.name}</Title>
                      )}
                    </div>
                    <Badge size="lg" variant="white" color="indigo">Active</Badge>
                  </Group>

                  <Divider my="xs" label="Referral Codes" labelPosition="left" styles={{ label: { color: 'var(--mantine-color-indigo-9)' } }} />

                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    {/* Member Code */}
                    <Box>
                      <Text size="xs" c="indigo.8" fw={700} tt="uppercase" mb={4}>Member Join Code</Text>
                      <Group gap="xs">
                        <CodeBox code={team.referralCode || 'N/A'} />
                        <CopyBtn value={team.referralCode || ''} />
                      </Group>
                    </Box>

                    {/* Guide Code */}
                    <Box>
                      <Text size="xs" c="indigo.8" fw={700} tt="uppercase" mb={4}>Guide Join Code</Text>
                      <Group gap="xs">
                        <CodeBox code={team.guideCode || 'N/A'} />
                        <CopyBtn value={team.guideCode || ''} />
                      </Group>
                    </Box>
                  </SimpleGrid>
                </Stack>
              </Paper>

              {/* Project Details Section */}
              <Paper p="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Group>
                    <ThemeIcon size="lg" radius="md" variant="light" color="grape">
                      <IconDeviceLaptop size={20} />
                    </ThemeIcon>
                    <Title order={4}>Project Details</Title>
                  </Group>
                  {currentUser?.role === 'team_lead' && (
                    <Button
                      variant="light"
                      size="xs"
                      leftSection={<IconPencil size={14} />}
                      onClick={openProjectModal}
                    >
                      Edit Details
                    </Button>
                  )}
                </Group>

                <Stack gap="lg">
                  {/* Description */}
                  <Box>
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>Description</Text>
                    <Text size="sm">
                      {team.description || <Text span c="dimmed" fs="italic">No description provided yet.</Text>}
                    </Text>
                  </Box>

                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    {/* Tech Stack */}
                    <Box>
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={8}>Tech Stack</Text>
                      {team.techStack && team.techStack.length > 0 ? (
                        <Group gap="xs">
                          {team.techStack.map((tech: string) => (
                            <Badge key={tech} variant="light" color="gray" size="sm">{tech}</Badge>
                          ))}
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed" fs="italic">Not specified</Text>
                      )}
                    </Box>

                    {/* Repository */}
                    <Box>
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>Repository</Text>
                      {team.repoUrl ? (
                        <Anchor href={team.repoUrl} target="_blank" rel="noopener noreferrer" size="sm" underline="hover">
                          <Group gap={6}>
                            <IconBrandGithub size={16} />
                            <Text span>{team.repoUrl.replace(/^https?:\/\//, '')}</Text>
                            <IconExternalLink size={12} />
                          </Group>
                        </Anchor>
                      ) : (
                        <Text size="sm" c="dimmed" fs="italic">No repository linked</Text>
                      )}
                    </Box>
                  </SimpleGrid>
                </Stack>
              </Paper>

              <Modal opened={projectModalOpened} onClose={closeProjectModal} title={<Text fw={700}>Edit Project Details</Text>} centered size="lg">
                <Stack>
                  <Textarea
                    label="Project Description"
                    placeholder="Briefly describe your project..."
                    minRows={5}
                    autosize
                    required
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  />

                  <TagsInput
                    label="Tech Stack"
                    placeholder="Press Enter to add tags (e.g., React, Firebase)"
                    required
                    value={projectForm.techStack}
                    onChange={(tags) => setProjectForm({ ...projectForm, techStack: tags })}
                    description="Add technologies used in your project"
                  />

                  <TextInput
                    label="Repository URL"
                    placeholder="https://github.com/username/project"
                    leftSection={<IconBrandGithub size={16} />}
                    value={projectForm.repoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, repoUrl: e.target.value })}
                  />

                  <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={closeProjectModal}>Cancel</Button>
                    <Button onClick={handleSaveProjectDetails} loading={savingProject}>Save Changes</Button>
                  </Group>
                </Stack>
              </Modal>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {/* Invite Member */}
                <Paper p="lg" withBorder radius="md">
                  <Stack gap="md">
                    <Group>
                      <IconMail size={20} />
                      <Title order={4}>Invite Team Members</Title>
                    </Group>
                    <TextInput
                      placeholder="email@example.com, another@example.com"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      description="Separate multiple emails with commas"
                    />
                    <Button onClick={() => handleInvite('member')} loading={loading} leftSection={<IconUserPlus size={16} />}>
                      Send Invites
                    </Button>
                  </Stack>
                </Paper>

                {/* Invite Guide */}
                <Paper p="lg" withBorder radius="md">
                  <Stack gap="md">
                    <Group>
                      <IconMail size={20} />
                      <Title order={4}>Invite Faculty Guide</Title>
                    </Group>
                    <TextInput
                      placeholder="guide@college.edu"
                      value={guideEmail}
                      onChange={(e) => setGuideEmail(e.target.value)}
                      description="Invite your project guide"
                    />
                    <Button onClick={() => handleInvite('guide')} loading={loading} variant="light" color="blue" leftSection={<IconUserPlus size={16} />}>
                      Invite Guide
                    </Button>
                  </Stack>
                </Paper>
              </SimpleGrid>



              {/* Join Requests */}
              {joinRequests.length > 0 && (
                <Paper p="lg" withBorder radius="md" style={{ borderColor: 'var(--mantine-color-blue-3)', backgroundColor: 'var(--mantine-color-blue-light)' }}>
                  <Group mb="md">
                    <IconUserPlus size={20} color="var(--mantine-color-blue-6)" />
                    <Title order={4}>Join Requests</Title>
                    <Badge color="blue">{joinRequests.length}</Badge>
                  </Group>
                  <Stack gap="sm">
                    {joinRequests.map((req) => (
                      <Group key={req.id} justify="space-between" p="sm" bg="var(--mantine-color-body)" style={{ borderRadius: 8, border: '1px solid var(--mantine-color-blue-2)' }}>
                        <div>
                          <Group gap="xs">
                            <Text fw={600} size="sm" lineClamp={1}>{req.invitedByName}</Text>
                            <Badge size="xs" color={req.role === 'guide' ? 'purple' : 'gray'}>{req.role}</Badge>
                          </Group>
                          <Text size="xs" c="dimmed" lineClamp={1}>{req.invitedEmail}</Text>
                        </div>
                        <Group gap="xs">
                          <Button size="xs" color="green" variant="light" leftSection={<IconCheck size={14} />} onClick={() => handleApproveRequest(req)}>Approve</Button>
                          <Button size="xs" color="red" variant="subtle" onClick={() => handleRejectRequest(req.id)}>Reject</Button>
                        </Group>
                      </Group>
                    ))}
                  </Stack>
                </Paper>
              )}

              {/* Team Roster Management */}
              <Paper p="lg" withBorder radius="md">
                <Title order={4} mb="lg">Team Roster</Title>

                <Stack gap="xl">
                  {/* Guides */}
                  <div>
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase" mb="xs">Guides</Text>
                    {guides.length === 0 ? <Text size="sm" c="dimmed" fs="italic">No guides assigned</Text> : (
                      <Stack gap="sm">
                        {guides.map(guide => (
                          <Paper key={guide.id} p="sm" withBorder radius="md">
                            <Group justify="space-between">
                              <Group>
                                <Avatar color="blue" radius="xl">{guide.name[0]}</Avatar>
                                <div>
                                  <Text fw={500} size="sm">{guide.name}</Text>
                                  <Text size="xs" c="dimmed">{guide.email}</Text>
                                </div>
                              </Group>

                              {/* Restricted Delete Action */}
                              {(currentUser?.role === 'admin' || currentUser?.uid === guide.id) && (
                                <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveMember(guide.id, 'guide', guide.name)}>
                                  <IconTrash size={16} />
                                </ActionIcon>
                              )}
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </div>

                  <Divider />

                  {/* Members */}
                  <div>
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase" mb="xs">Members</Text>
                    {members.length === 0 ? <Text size="sm" c="dimmed" fs="italic">No other members</Text> : (
                      <Stack gap="sm">
                        {members.map(member => (
                          <Paper key={member.id} p="sm" withBorder radius="md">
                            <Group justify="space-between">
                              <Group>
                                <Avatar color="gray" radius="xl">{member.name[0]}</Avatar>
                                <div>
                                  <Text fw={500} size="sm">{member.name}</Text>
                                  <Text size="xs" c="dimmed">{member.email}</Text>
                                </div>
                              </Group>
                              <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveMember(member.id, 'member', member.name)}>
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </div>
                </Stack>
              </Paper>
            </>
          )}
        </Stack>
      </Container>
    </Layout >
  );
}
