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
  Textarea,
  Timeline,
  Avatar,
  Box,
  Card
} from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services';
import { Layout } from '../components/Layout';
import { IconArrowLeft, IconCheck, IconClock } from '@tabler/icons-react';
import { motion } from 'framer-motion';

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
  const { currentUser } = useAuth();
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
        const logData = await firebaseService.getLogById(id);
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
      const updatedLog = await firebaseService.updateLog(id!, {
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
      const updatedLog = await firebaseService.updateLog(id!, {
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
      case 'draft': return 'Draft';
      case 'pending-lead': return 'Pending Team Lead Review';
      case 'pending-guide': return 'Pending Guide Review';
      case 'approved': return 'Approved by Guide';
      case 'final-approved': return 'Final Approved';
      case 'needs-revision': return 'Needs Revision';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'pending-lead': return 'indigo';
      case 'pending-guide': return 'blue';
      case 'approved': return 'teal';
      case 'final-approved': return 'green';
      case 'needs-revision': return 'red';
      default: return 'gray';
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const canEdit = (currentUser?.id === log?.createdBy && (log?.status === 'draft' || log?.status === 'needs-revision')) || isAdmin;
  const canSubmitForReview = (currentUser?.id === log?.createdBy && (log?.status === 'draft' || log?.status === 'needs-revision')) || isAdmin;
  const canApproveAsLead = (currentUser?.role === 'team_lead' && log?.status === 'pending-lead') || isAdmin;
  const canApproveAsGuide = (currentUser?.role === 'guide' && log?.status === 'pending-guide') || isAdmin;
  const canApproveAsCoordinator = (currentUser?.role === 'admin' && log?.status === 'approved') || isAdmin; // Admin is Coord now
  const canRequestRevision = (currentUser?.role === 'team_lead' && log?.status === 'pending-lead') ||
                           (currentUser?.role === 'guide' && log?.status === 'pending-guide') ||
                            isAdmin;
  const canResubmit = (currentUser?.id === log?.createdBy && log?.status === 'needs-revision') || isAdmin;
  const canDelete = currentUser?.role === 'team_lead' || isAdmin;

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
      const updatedLog = await firebaseService.addComment(id!, newComment);
      setLog(updatedLog);
      setComment('');
      setShowCommentForm(false);
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
      await firebaseService.addComment(id!, newComment);
      const finalUpdatedLog = await firebaseService.updateLog(id!, {
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
      const updatedLog = await firebaseService.updateLog(id!, {
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

  const handleDeleteLog = async () => {
    if (!log) return;
    if (!window.confirm('Are you sure you want to delete this log? This action cannot be undone.')) return;
    setSubmitting(true);
    try {
      await firebaseService.deleteLog(id!);
      alert('Log deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting log:', error);
      alert('Failed to delete log');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !log) {
    return (
      <Layout>
         <Text>Loading...</Text>
      </Layout>
    );
  }

  const activities = log.activities || [];

  return (
    <Layout>
        <Container size="md">
            <Button 
                variant="subtle" 
                color="gray" 
                mb="lg"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate('/dashboard')}
            >
                Back to Dashboard
            </Button>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Paper p="xl" radius="lg" withBorder mb="xl" bg="white">
                     <Group justify="space-between" mb="lg">
                        <Stack gap={0}>
                            <Text tt="uppercase" c="dimmed" size="xs" fw={700} style={{ letterSpacing: '1px' }}>Internship Log</Text>
                            <Title order={1}>Week {log.weekNumber}</Title>
                        </Stack>
                        <Badge size="xl" radius="md" color={getStatusColor(log.status)}>
                            {getLogStatusText(log.status)}
                        </Badge>
                     </Group>

                     <Group mb="xl" gap="xl">
                        <Group gap="xs">
                            <IconClock size={18} color="gray" />
                            <Text size="sm" c="dimmed">
                                {formatDate(log.startDate)} - {formatDate(log.endDate)}
                            </Text>
                        </Group>
                        <Text size="sm" c="dimmed">Author: <Text span fw={500} c="dark.8">{log.createdByName}</Text></Text>
                     </Group>

                     <Group>
                        {canEdit && (
                            <Button variant="outline" onClick={() => navigate(`/logs/${id}/edit`)}>Edit Log</Button>
                        )}
                         {canSubmitForReview && (
                            <Button onClick={handleSubmitForReview} loading={submitting} color="indigo">Submit for Review</Button>
                        )}
                        {canDelete && (
                             <Button color="red" variant="light" onClick={handleDeleteLog} loading={submitting}>Delete</Button>
                        )}
                        {canApproveAsLead && (
                             <Button onClick={() => handleStatusChange('pending-guide')} color="indigo" loading={submitting}>Approve & Send to Guide</Button>
                        )}
                         {canApproveAsGuide && (
                             <Button onClick={() => handleStatusChange('approved')} color="teal" loading={submitting}>Approve Log</Button>
                        )}
                         {canApproveAsCoordinator && (
                             <Button onClick={() => handleStatusChange('final-approved')} color="green" loading={submitting}>Final Approve</Button>
                        )}
                         {canResubmit && (
                             <Button onClick={handleResubmitForReview} color="blue" loading={submitting}>Resubmit</Button>
                        )}
                     </Group>
                </Paper>

                <Paper p="xl" radius="lg" withBorder mb="xl" bg="white">
                    <Title order={3} mb="lg">Weekly Activities</Title>
                    <Timeline active={activities.length} bulletSize={24} lineWidth={2}>
                        {activities.map((activity: any, index: number) => (
                            <Timeline.Item 
                                key={index} 
                                bullet={<IconCheck size={12} />} 
                                title={formatDate(activity.date)}
                            >
                                <Text c="dimmed" size="sm" mb="xs">
                                    Duration: {activity.hours} hours
                                </Text>
                                <Text size="sm" mt={4}>{activity.description}</Text>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </Paper>

                <Paper p="xl" radius="lg" withBorder bg="white">
                   <Group justify="space-between" mb="lg">
                        <Title order={3}>Comments & Feedback</Title>
                        <Button variant="light" size="xs" onClick={() => setShowCommentForm(p => !p)}>
                            {showCommentForm ? 'Cancel' : 'Add Comment'}
                        </Button>
                   </Group>
                   
                   {showCommentForm && (
                       <Box mb="xl">
                           <Textarea 
                                placeholder="Type your comment here..." 
                                minRows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                mb="sm"
                           />
                           <Button size="sm" onClick={handleAddComment} loading={submitting}>Post Comment</Button>
                       </Box>
                   )}

                   {canRequestRevision && !showRevisionForm && (
                       <Button 
                            color="orange" 
                            variant="light" 
                            fullWidth 
                            mb="xl" 
                            onClick={() => setShowRevisionForm(true)}
                       >
                           Request Changes / Revision
                       </Button>
                   )}

                   {showRevisionForm && (
                        <Box mb="xl" p="md" bg="orange.0" style={{ borderRadius: 8 }}>
                           <Text fw={500} c="orange.9" mb="xs">Request Revision</Text>
                           <Textarea 
                                placeholder="Explain what needs to be changed..." 
                                minRows={3}
                                value={revisionMessage}
                                onChange={(e) => setRevisionMessage(e.target.value)}
                                mb="sm"
                           />
                           <Group justify="flex-end">
                                <Button variant="subtle" color="gray" size="sm" onClick={() => setShowRevisionForm(false)}>Cancel</Button>
                                <Button size="sm" color="orange" onClick={handleRequestRevision} loading={submitting}>Submit Request</Button>
                           </Group>
                       </Box>
                   )}

                   <Stack gap="lg">
                        {log.comments && log.comments.length > 0 ? (
                            log.comments.map((comment: any, index: number) => (
                                <Card key={index} withBorder radius="md" padding="md" bg="gray.0">
                                    <Group mb="xs">
                                        <Avatar color="indigo" radius="xl" size="sm">{comment.userName?.[0]}</Avatar>
                                        <Box>
                                            <Text size="sm" fw={500} lh={1}>{comment.userName}</Text>
                                            <Text size="xs" c="dimmed" lh={1}>{comment.userRole}</Text>
                                        </Box>
                                        <Text size="xs" c="dimmed" style={{ marginLeft: 'auto' }}>
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </Text>
                                    </Group>
                                    <Text size="sm">{comment.text}</Text>
                                </Card>
                            ))
                        ) : (
                            <Text c="dimmed" ta="center" py="lg">No comments yet.</Text>
                        )}
                   </Stack>
                </Paper>
            </motion.div>
        </Container>
    </Layout>
  );
} 