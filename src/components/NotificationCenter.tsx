import { useState, useEffect } from 'react';
import { Badge, Menu, Text, Stack, Group, Button } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { useNavigate } from 'react-router-dom';

export function NotificationCenter() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      // Fetch notifications from the data service
      const userNotifications = dataService.getNotifications(currentUser.id);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter((n: { read: boolean }) => !n.read).length);
    }
  }, [currentUser]);

  const handleMarkAsRead = (id: string) => {
    dataService.markNotificationAsRead(id);
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    if (currentUser) {
      dataService.markAllNotificationsAsRead(currentUser.id);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = (notification: any) => {
    handleMarkAsRead(notification.id);
    if (notification.logId) {
      navigate(`/logs/${notification.logId}`);
    }
  };

  if (!currentUser) return null;

  return (
    <Menu position="bottom-end" width={300} radius="md">
      <Menu.Target>
        <Badge 
          size="lg" 
          variant="filled" 
          color={unreadCount > 0 ? "indigo" : "gray"}
          radius="md"
        >
          {unreadCount > 0 ? unreadCount : 0}
        </Badge>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Notifications</Menu.Label>
        {notifications.length > 0 ? (
          <>
            <Stack gap="xs" p="xs">
              {notifications.map(notification => (
                <Menu.Item 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ 
                    backgroundColor: notification.read ? 'transparent' : 'rgba(99, 102, 241, 0.1)',
                    whiteSpace: 'normal',
                    borderRadius: '8px',
                    marginBottom: '4px'
                  }}
                >
                  <Text fw={500}>{notification.title}</Text>
                  <Text size="sm">{notification.message}</Text>
                  <Text size="xs" c="dimmed">
                    {new Date(notification.createdAt).toLocaleString()}
                  </Text>
                </Menu.Item>
              ))}
            </Stack>
            <Menu.Divider />
            <Group justify="space-between" p="xs">
              <Text size="sm" c="dimmed">
                {unreadCount} unread
              </Text>
              <Button 
                variant="subtle" 
                size="xs" 
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                color="indigo"
                radius="md"
              >
                Mark all as read
              </Button>
            </Group>
          </>
        ) : (
          <Text p="xs" c="dimmed" ta="center">
            No notifications
          </Text>
        )}
      </Menu.Dropdown>
    </Menu>
  );
} 