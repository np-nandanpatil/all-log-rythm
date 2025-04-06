import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Text, 
  Group, 
  Button, 
  Paper, 
  Stack, 
  Badge, 
  Divider,
  Textarea,
  ActionIcon,
  Menu,
  AppShell
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { NotificationCenter } from '../components/NotificationCenter';

export function LogView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    if (id) {
      const logData = dataService.getLogById(id);
      if (logData) {
        setLog(logData);
      } else {
        notifications.show({
          title: 'Error',
          message: 'Log not found',
          color: 'red'
        });
        navigate('/dashboard');
      }
    }
    setLoading(false);
  }, [id, navigate]);

  const handleStatusChange = (newStatus: string) => {
    if (!log) return;
    
    setSubmitting(true);
    
    try {
      const updatedLog = dataService.updateLog(id!, {
        ...log,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      setLog(updatedLog);
      
      notifications.show({
        title: 'Success',
        message: `Log status updated to ${getLogStatusText(newStatus)}`,
        color: 'green'
      });
    } catch (error) {
      console.error('Error updating log status:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update log status',
        color: 'red'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmitForReview = () => {
    if (!log) return;
    
    setSubmitting(true);
    
    try {
      // Determine the next status based on the current status
      let nextStatus = 'pending-lead';
      if (log.status === 'needs-revision') {
        // If it was previously approved by team lead, go back to team lead
        // If it was previously approved by guide, go back to guide
        // If it was previously approved by coordinator, go back to guide
        const lastApprover = log.comments && log.comments.length > 0 
          ? log.comments[log.comments.length - 1].userRole 
          : null;
        
        if (lastApprover === 'guide' || lastApprover === 'coordinator') {
          nextStatus = 'pending-guide';
        }
      }
      
      const updatedLog = dataService.updateLog(id!, {
        ...log,
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
      
      setLog(updatedLog);
      
      // Create notification for the reviewer
      if (nextStatus === 'pending-lead') {
        // Find a team lead to notify
        const teamLeads = dataService.getUsers().filter((user: any) => user.role === 'team_lead');
        if (teamLeads.length > 0) {
          dataService.createNotification({
            userId: teamLeads[0].id,
            title: 'Log Resubmitted for Review',
            message: `Week ${log.weekNumber} log has been resubmitted for your review.`,
            logId: id,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      } else if (nextStatus === 'pending-guide') {
        // Find a guide to notify
        const guides = dataService.getUsers().filter((user: any) => user.role === 'guide');
        if (guides.length > 0) {
          dataService.createNotification({
            userId: guides[0].id,
            title: 'Log Resubmitted for Review',
            message: `Week ${log.weekNumber} log has been resubmitted for your review.`,
            logId: id,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      }
      
      notifications.show({
        title: 'Success',
        message: `Log resubmitted for ${nextStatus === 'pending-lead' ? 'team lead' : 'guide'} review`,
        color: 'green'
      });
    } catch (error) {
      console.error('Error resubmitting log:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to resubmit log',
        color: 'red'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getLogStatusText = (status: string) => {
    switch (status) {
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
        return status;
    }
  };

  const getStatusColor = (status: string) => {
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

  const canEdit = currentUser?.id === log?.createdBy && log?.status === 'draft';
  const canApproveAsLead = currentUser?.role === 'team_lead' && log?.status === 'pending-lead';
  const canApproveAsGuide = currentUser?.role === 'guide' && log?.status === 'pending-guide';
  const canApproveAsCoordinator = currentUser?.role === 'coordinator' && log?.status === 'approved';
  const canRequestRevision = (currentUser?.role === 'team_lead' && log?.status === 'pending-lead') ||
                           (currentUser?.role === 'guide' && log?.status === 'pending-guide') ||
                           (currentUser?.role === 'coordinator' && log?.status === 'approved');
  const canResubmit = currentUser?.id === log?.createdBy && log?.status === 'needs-revision';
  const canDelete = currentUser?.role === 'team_lead';

  const handleAddComment = () => {
    if (!comment.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a comment',
        color: 'red'
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const updatedLog = dataService.addComment(id!, {
        text: comment,
        userId: currentUser?.id,
        userName: currentUser?.name,
        userRole: currentUser?.role
      });
      
      setLog(updatedLog);
      setComment('');
      
      notifications.show({
        title: 'Success',
        message: 'Comment added successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to add comment',
        color: 'red'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = () => {
    if (!log) return;
    
    if (!revisionMessage.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please provide a message explaining what changes are needed',
        color: 'red'
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // First add the comment with the revision request
      const updatedLog = dataService.addComment(id!, {
        text: revisionMessage,
        userId: currentUser?.id,
        userName: currentUser?.name,
        userRole: currentUser?.role
      });
      
      // Then update the status to needs-revision
      const finalLog = dataService.updateLog(id!, {
        ...updatedLog,
        status: 'needs-revision',
        updatedAt: new Date().toISOString()
      });
      
      setLog(finalLog);
      setRevisionMessage('');
      setShowRevisionForm(false);
      
      notifications.show({
        title: 'Success',
        message: 'Log marked for revision',
        color: 'green'
      });
    } catch (error) {
      console.error('Error requesting revision:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to request revision',
        color: 'red'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteLog = () => {
    if (!log) return;
    
    if (window.confirm(`Are you sure you want to delete this log? This action cannot be undone.`)) {
      setSubmitting(true);
      
      try {
        dataService.deleteLog(id!);
        
        notifications.show({
          title: 'Success',
          message: 'Log deleted successfully',
          color: 'green'
        });
        
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting log:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete log',
          color: 'red'
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <AppShell
        header={{ height: 60 }}
        padding="md"
      >
        <AppShell.Header p="xs">
          <Group justify="space-between">
            <Title order={3}>ExposeNet log</Title>
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
            <Text>Loading...</Text>
          </Container>
        </AppShell.Main>
      </AppShell>
    );
  }

  if (!log) {
    return (
      <AppShell
        header={{ height: 60 }}
        padding="md"
      >
        <AppShell.Header p="xs">
          <Group justify="space-between">
            <Title order={3}>ExposeNet log</Title>
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
            <Text>Log not found</Text>
          </Container>
        </AppShell.Main>
      </AppShell>
    );
  }

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
          {loading ? (
            <Text>Loading...</Text>
          ) : log ? (
            <Stack gap="xl">
              <Group justify="space-between">
                <Title c="purple">Week {log.weekNumber} Log</Title>
                <Button 
                  variant="light" 
                  onClick={() => navigate('/dashboard')}
                  radius="md"
                >
                  Back to Dashboard
                </Button>
              </Group>

              <Paper withBorder shadow="md" p="xl" radius="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <div>
                      <Text fw={700} size="lg">Week {log.weekNumber}</Text>
                      <Text size="sm" c="dimmed">
                        {log.startDate ? new Date(log.startDate).toLocaleDateString() : 'Start date not available'} - {log.endDate ? new Date(log.endDate).toLocaleDateString() : 'End date not available'}
                      </Text>
                    </div>
                    <Text 
                      size="sm" 
                      fw={500} 
                      c={getStatusColor(log.status)}
                      style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        backgroundColor: `var(--mantine-color-${getStatusColor(log.status)}-1)`,
                        border: `1px solid var(--mantine-color-${getStatusColor(log.status)}-3)`
                      }}
                    >
                      {getLogStatusText(log.status)}
                    </Text>
                  </Group>
                  
                  <Text size="sm">
                    Created by: {log.createdByName || 'Unknown'}
                  </Text>
                  
                  <Text size="sm" c="dimmed">
                    Last updated: {log.updatedAt ? new Date(log.updatedAt).toLocaleString() : 'Date not available'}
                  </Text>

                  <Divider my="md" />

                  <Title order={3}>Activities</Title>
                  <Stack gap="md">
                    {log.activities.map((activity: any, index: number) => (
                      <Paper key={index} withBorder p="md" radius="md">
                        <Group justify="space-between">
                          <Text fw={500}>{activity.date ? new Date(activity.date).toLocaleDateString() : 'Date not available'}</Text>
                          <Badge size="lg" radius="md">{activity.hours} hours</Badge>
                        </Group>
                        <Text mt="sm">{activity.description}</Text>
                      </Paper>
                    ))}
                  </Stack>

                  <Divider my="md" />

                  <Title order={3}>Comments</Title>
                  <Stack gap="md">
                    {log.comments && log.comments.length > 0 ? (
                      log.comments.map((comment: any, index: number) => (
                        <Paper key={index} withBorder p="md" radius="md">
                          <Group justify="space-between" mb="xs">
                            <Text fw={500}>{comment.userName} ({comment.userRole})</Text>
                            <Text size="sm" c="dimmed">
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Date not available'}
                            </Text>
                          </Group>
                          <Text>{comment.text}</Text>
                        </Paper>
                      ))
                    ) : (
                      <Text c="dimmed">No comments yet</Text>
                    )}
                  </Stack>

                  <Divider my="md" />

                  <Group justify="space-between" align="center">
                    <Title order={3}>Add Comment</Title>
                    <Button 
                      variant="light" 
                      color="indigo" 
                      onClick={() => setShowCommentForm(!showCommentForm)}
                      radius="md"
                    >
                      {showCommentForm ? 'Hide Comment Form' : 'Add Comment'}
                    </Button>
                  </Group>
                  
                  {showCommentForm && (
                    <>
                      <Textarea
                        placeholder="Enter your comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        minRows={3}
                        radius="md"
                      />
                      <Button 
                        onClick={handleAddComment} 
                        loading={submitting}
                        style={{ alignSelf: 'flex-end' }}
                        color="indigo"
                        radius="md"
                      >
                        Submit Comment
                      </Button>
                    </>
                  )}

                  <Divider my="md" />

                  <Group justify="space-between" align="center">
                    <Title order={3}>Request Revision</Title>
                    {canRequestRevision && (
                      <Button 
                        variant="light" 
                        color="yellow" 
                        onClick={() => setShowRevisionForm(!showRevisionForm)}
                        radius="md"
                      >
                        {showRevisionForm ? 'Hide Revision Form' : 'Request Revision'}
                      </Button>
                    )}
                  </Group>

                  {showRevisionForm && (
                    <>
                      <Textarea
                        placeholder="Enter revision message"
                        value={revisionMessage}
                        onChange={(e) => setRevisionMessage(e.target.value)}
                        minRows={3}
                        radius="md"
                      />
                      <Group justify="flex-end">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowRevisionForm(false)}
                          radius="md"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleRequestRevision} 
                          loading={submitting}
                          color="red"
                          radius="md"
                        >
                          Request Revision
                        </Button>
                      </Group>
                    </>
                  )}

                  <Divider my="md" />

                  <Title order={3}>Actions</Title>
                  <Group>
                    {canEdit && (
                      <Button 
                        onClick={() => navigate(`/logs/${id}/edit`)}
                        color="indigo"
                        radius="md"
                      >
                        Edit Log
                      </Button>
                    )}
                    
                    {canApproveAsLead && (
                      <Button 
                        onClick={() => handleStatusChange('pending-guide')}
                        loading={submitting}
                        color="blue"
                        radius="md"
                      >
                        Approve & Send to Guide
                      </Button>
                    )}
                    
                    {canApproveAsGuide && (
                      <Button 
                        onClick={() => handleStatusChange('approved')}
                        loading={submitting}
                        color="green"
                        radius="md"
                      >
                        Approve
                      </Button>
                    )}
                    
                    {canRequestRevision && (
                      <Button 
                        onClick={() => setShowRevisionForm(true)}
                        color="yellow"
                        radius="md"
                      >
                        Request Revision
                      </Button>
                    )}
                    
                    {canResubmit && (
                      <Button 
                        onClick={handleResubmitForReview}
                        loading={submitting}
                        color="blue"
                        radius="md"
                      >
                        Resubmit for Review
                      </Button>
                    )}
                    
                    {canApproveAsCoordinator && (
                      <Button 
                        onClick={() => handleStatusChange('final-approved')}
                        loading={submitting}
                        color="teal"
                        radius="md"
                      >
                        Final Approve
                      </Button>
                    )}
                    
                    {canDelete && (
                      <Button 
                        onClick={handleDeleteLog}
                        loading={submitting}
                        color="red"
                        radius="md"
                      >
                        Delete Log
                      </Button>
                    )}
                  </Group>
                </Stack>
              </Paper>
            </Stack>
          ) : (
            <Text>Log not found</Text>
          )}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
} 