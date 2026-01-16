import { Component, ErrorInfo, ReactNode } from 'react';
import { Container, Title, Text, Button, AppShell, Group, Paper, Stack, ThemeIcon, Code } from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconHome } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" py="xl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
          <Paper withBorder p="xl" radius="md" style={{ width: '100%' }}>
            <Stack align="center" gap="lg">
              <ThemeIcon size={80} radius="xl" color="red" variant="light">
                <IconAlertTriangle size={40} />
              </ThemeIcon>

              <div style={{ textAlign: 'center' }}>
                <Title order={2}>Something went wrong</Title>
                <Text c="dimmed" mt="xs">
                  The application encountered an unexpected error. We've logged this issue for investigation.
                </Text>
              </div>

              {this.state.error && (
                <Paper bg="gray.0" p="md" radius="sm" style={{ width: '100%' }}>
                  <Text size="xs" fw={700} c="dimmed" mb={4} tt="uppercase">Error Details</Text>
                  <Code block color="red" style={{ wordBreak: 'break-all' }}>
                    {this.state.error.toString()}
                  </Code>
                </Paper>
              )}

              <Group>
                <Button
                  variant="default"
                  leftSection={<IconHome size={16} />}
                  onClick={() => {
                    window.location.href = '/';
                  }}
                >
                  Go Home
                </Button>
                <Button
                  color="red"
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null });
                    window.location.reload();
                  }}
                >
                  Try Again
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}