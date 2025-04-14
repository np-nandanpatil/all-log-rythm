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
  AppShell
} from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { dataServiceAdapter } from '../services';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

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
      const fetchLog = async () => {
        const logData = await dataServiceAdapter.getLogById(id);
        if (logData) {
          setLog(logData);
        } else {
          alert('Log not found');
          navigate('/dashboard');
        }
        setLoading(false);
      };
      fetchLog();
    }
  }, [id, navigate]);

  const handleStatusChange = async (newStatus: string) => {
    if (!log) return;
    
    setSubmitting(true);
    
    try {
      const updatedLog = await dataServiceAdapter.updateLog(id!, {
        status: newStatus,
        startDate: log.startDate,
        endDate: log.endDate,
        updatedAt: new Date().toISOString()
      });
      
      setLog(updatedLog);
      alert(`Log status updated to ${getLogStatusText(newStatus)}`);
    } catch (error) {
      console.error('Error updating log status:', error);
      alert('Failed to update log status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmitForReview = async () => {
    if (!log) return;
    
    setSubmitting(true);
    
    try {
      let nextStatus = 'pending-lead';
      if (log.status === 'needs-revision') {
        const lastApprover = log.comments && log.comments.length > 0 
          ? log.comments[log.comments.length - 1].userRole 
          : null;
        
        if (lastApprover === 'guide' || lastApprover === 'coordinator') {
          nextStatus = 'pending-guide';
        }
      }
      
      const updatedLog = await dataServiceAdapter.updateLog(id!, {
        status: nextStatus,
        startDate: log.startDate,
        endDate: log.endDate,
        updatedAt: new Date().toISOString()
      });
      
      setLog(updatedLog);
      alert('Log resubmitted for review');
    } catch (error) {
      console.error('Error resubmitting log:', error);
      alert('Failed to resubmit log');
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

  const canEdit = currentUser?.id === log?.createdBy && (log?.status === 'draft' || log?.status === 'needs-revision');
  const canSubmitForReview = currentUser?.id === log?.createdBy && (log?.status === 'draft' || log?.status === 'needs-revision');
  const canApproveAsLead = currentUser?.role === 'team_lead' && log?.status === 'pending-lead';
  const canApproveAsGuide = currentUser?.role === 'guide' && log?.status === 'pending-guide';
  const canApproveAsCoordinator = currentUser?.role === 'coordinator' && log?.status === 'approved';
  const canRequestRevision = (currentUser?.role === 'team_lead' && log?.status === 'pending-lead') ||
                           (currentUser?.role === 'guide' && log?.status === 'pending-guide') ||
                           (currentUser?.role === 'coordinator' && log?.status === 'approved');
  const canResubmit = currentUser?.id === log?.createdBy && log?.status === 'needs-revision';
  const canDelete = currentUser?.role === 'team_lead';

  const handleAddComment = async () => {
    if (!log || !comment.trim()) return;
    
    setSubmitting(true);
    
    try {
      const newComment = {
        text: comment,
        userId: currentUser?.id,
        userName: currentUser?.name,
        userRole: currentUser?.role,
        createdAt: new Date().toISOString()
      };
      
      const updatedLog = await dataServiceAdapter.addComment(id!, newComment);
      setLog(updatedLog);
      setComment('');
      setShowCommentForm(false);
      alert('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!log || !revisionMessage.trim()) return;
    
    setSubmitting(true);
    
    try {
      const newComment = {
        text: revisionMessage,
        userId: currentUser?.id,
        userName: currentUser?.name,
        userRole: currentUser?.role,
        createdAt: new Date().toISOString()
      };
      
      const updatedLog = await dataServiceAdapter.addComment(id!, newComment);
      
      const finalUpdatedLog = await dataServiceAdapter.updateLog(id!, {
        status: 'needs-revision',
        startDate: log.startDate,
        endDate: log.endDate,
        updatedAt: new Date().toISOString()
      });
      
      setLog(finalUpdatedLog);
      setRevisionMessage('');
      setShowRevisionForm(false);
      alert('Revision requested successfully');
    } catch (error) {
      console.error('Error requesting revision:', error);
      alert('Failed to request revision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!log) return;
    
    setSubmitting(true);
    
    try {
      const updatedLog = await dataServiceAdapter.updateLog(id!, {
        status: 'pending-lead',
        startDate: log.startDate,
        endDate: log.endDate,
        updatedAt: new Date().toISOString()
      });
      
      setLog(updatedLog);
      alert('Log submitted for review');
    } catch (error) {
      console.error('Error submitting log for review:', error);
      alert('Failed to submit log for review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteLog = async () => {
    if (!log) return;
    
    if (!window.confirm('Are you sure you want to delete this log? This action cannot be undone.')) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      await dataServiceAdapter.deleteLog(id!);
      alert('Log deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting log:', error);
      alert('Failed to delete log');
    } finally {
      setSubmitting(false);
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
            <Title order={3}>All Log Rythm</Title>
            <Group>
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
            <Title order={3}>All Log Rythm</Title>
            <Group>
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

  const activities = log.activities || [];

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
          <Stack gap="lg">
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="light"
              color="indigo"
              radius="md"
              leftSection={<span>←</span>}
              mb="md"
            >
              Back to Dashboard
            </Button>
            
            <Paper withBorder shadow="md" p="xl" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={2}>Week {log.weekNumber}</Title>
                <Badge color={getStatusColor(log.status)} size="lg" radius="md">
                  {getLogStatusText(log.status)}
                </Badge>
              </Group>

              <Text size="sm" c="dimmed" mb="md">
                {formatDate(log.startDate)} - {formatDate(log.endDate)}
              </Text>

              <Text mb="md">
                Created by: {log.createdByName} ({log.createdByUsername || log.createdBy})
              </Text>

              <Group justify="flex-end">
                {canEdit && (
                  <Button 
                    onClick={() => navigate(`/logs/${id}/edit`)}
                    variant="light"
                    color="blue"
                    radius="md"
                  >
                    Edit Log
                  </Button>
                )}
                {canSubmitForReview && (
                  <Button 
                    onClick={handleSubmitForReview}
                    loading={submitting}
                    color="blue"
                    radius="md"
                  >
                    Submit for Review
                  </Button>
                )}
                {canDelete && (
                  <Button 
                    onClick={handleDeleteLog}
                    variant="light"
                    color="red"
                    radius="md"
                    loading={submitting}
                  >
                    Delete Log
                  </Button>
                )}
              </Group>
            </Paper>

            <Paper withBorder shadow="md" p="xl" radius="md">
              <Title order={3} mb="lg">Activities</Title>
              <Stack gap="md">
                {activities.map((activity: any, index: number) => (
                  <Paper key={index} withBorder p="md" radius="md">
                    <Group justify="space-between" mb="xs">
                      <Text fw={500}>
                        {new Date(activity.date).toLocaleDateString()}
                      </Text>
                      <Badge radius="md">{activity.hours} hours</Badge>
                    </Group>
                    <Text>{activity.description}</Text>
                  </Paper>
                ))}
              </Stack>
            </Paper>

            <Paper withBorder shadow="md" p="xl" radius="md">
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
            </Paper>

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
            </Group>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
} 