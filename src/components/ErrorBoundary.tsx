import { Component, ErrorInfo, ReactNode } from 'react';
import { Container, Title, Text, Button, AppShell, Group } from '@mantine/core';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <AppShell
          header={{ height: 60 }}
          padding="md"
        >
          <AppShell.Header p="xs">
            <Group justify="space-between">
              <Title order={3}>ExposeNet log</Title>
            </Group>
          </AppShell.Header>

          <AppShell.Main>
            <Container size="md" py="xl">
              <Title>Something went wrong</Title>
              <Text mt="md" c="red">
                {this.state.error?.message}
              </Text>
              <Button
                mt="xl"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                Try again
              </Button>
            </Container>
          </AppShell.Main>
        </AppShell>
      );
    }

    return this.props.children;
  }
} 