import React, { useState } from 'react';
import { Modal, TextInput, Button, Stack, SegmentedControl, Text, Anchor, Group, Alert } from '@mantine/core';
import { IconAt, IconLock } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onModeChange: (mode: 'login' | 'signup') => void;
}

export function AuthModal({ opened, onClose, mode, onModeChange }: AuthModalProps) {
  const [role, setRole] = useState<string>('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const isRegistering = mode === 'signup';

  const handleClose = () => {
    setError('');
    setPassword('');
    setReferralCode('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) throw new Error('Name is required');
        
        if (email.indexOf('.edu') === -1) { 
            throw new Error('Access Restricted: Please use your university .edu email.');
        }

        const teamData: any = {};
        if (role === 'team_lead') {
            if (!teamName.trim()) throw new Error("Team Name is required.");
            teamData.createTeam = true;
            teamData.teamName = teamName;
        } else if (role === 'member' || role === 'guide') {
             if (!referralCode.trim()) throw new Error('Unique Code is required to join a team.');
             teamData.joinCode = referralCode.trim();
        }

        await signup(email, password, { name, role }, teamData);

        handleClose();
        navigate('/dashboard');

      } else {
        await login(email, password);
        handleClose();
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Failed to authenticate.');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    onModeChange(mode === 'login' ? 'signup' : 'login');
    setError('');
    setPassword('');
    setReferralCode('');
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isRegistering ? 'Create Account' : 'Welcome Back'}
      centered
      size="md"
      radius="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert color="red" radius="md" variant="light">
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {isRegistering && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <Stack gap="md">
                <SegmentedControl
                  fullWidth
                  value={role}
                  onChange={setRole}
                  data={[
                    { label: 'Member', value: 'member' },
                    { label: 'Leader', value: 'team_lead' },
                    { label: 'Guide', value: 'guide' },
                  ]}
                  radius="md"
                />

                <TextInput
                  label="Full Name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  radius="md"
                />

                {role === 'team_lead' && (
                  <TextInput
                    label="Team Name"
                    placeholder="e.g. Project Alpha"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    radius="md"
                    description="You will get invite codes after signup"
                  />
                )}

                {(role === 'member' || role === 'guide') && (
                  <TextInput
                    label={role === 'guide' ? "Guide Code" : "Referral Code"}
                    placeholder="Enter the 6-digit code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    required
                    radius="md"
                  />
                )}
              </Stack>
            </motion.div>
          )}

          <TextInput
            label="University Email"
            placeholder="yourname@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftSection={<IconAt size={16} stroke={1.5} />}
            radius="md"
            type="email"
          />

          <TextInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            leftSection={<IconLock size={16} stroke={1.5} />}
            radius="md"
          />

          <Button
            type="submit"
            fullWidth
            size="md"
            radius="md"
            loading={loading}
            color="indigo"
            mt="xs"
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </Button>

          <Group justify="center" gap={4}>
            <Text size="sm" c="dimmed">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <Anchor component="button" type="button" size="sm" fw={600} onClick={toggleMode} c="indigo.6">
              {isRegistering ? 'Sign In' : 'Sign Up'}
            </Anchor>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
