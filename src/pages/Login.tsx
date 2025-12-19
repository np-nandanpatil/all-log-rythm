import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  TextInput, Button, Paper, Title, Container, Alert, Text, Stack, 
  Anchor, Group, SegmentedControl, Grid, ThemeIcon
} from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconAt, IconLock, IconQuote } from '@tabler/icons-react';
import { firebaseService } from '../services';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<string>('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const isEduEmail = (email: string) => /^[^\s@]+@[^\s@]+\.edu(\.[a-z]{2,})?$/i.test(email);

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

        let teamIdToJoin = null;
        if (role === 'member' || role === 'guide') {
             if (!referralCode.trim()) throw new Error('Unique Code is required to join a team.');
             const type = role === 'guide' ? 'guide' : 'referral';
             const team = await firebaseService.getTeamByCode(referralCode.trim(), type);
             if (!team) throw new Error('Invalid Code. Please check with your Team Leader.');
             teamIdToJoin = team.id;
        }

        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const { auth } = await import('../config/firebase');

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        let newTeamId = null;
        if (role === 'team_lead') {
            if (!teamName.trim()) throw new Error("Team Name is required.");
            const team = await firebaseService.createTeam(teamName, uid);
            newTeamId = team.id;
        }

        const teamIds = [];
        if (newTeamId) teamIds.push(newTeamId);
        if (teamIdToJoin) teamIds.push(teamIdToJoin);

        await firebaseService.createUser(uid, {
            name,
            email,
            role, 
            teamIds,
            createdAt: new Date().toISOString()
        });

        if (teamIdToJoin) {
            await firebaseService.joinTeam(teamIdToJoin, uid, role as 'member' | 'guide');
        }

        navigate('/dashboard');

      } else {
        await login(email, password);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Failed to authenticate.');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setPassword('');
    setReferralCode('');
  };

  return (
    <Grid gutter={0} style={{ minHeight: '100vh', margin: 0 }}>
      {/* Left Side - Visual */}
      <Grid.Col span={{ base: 12, md: 6 }} style={{ position: 'relative', overflow: 'hidden', minHeight: '300px' }}>
          <div style={{
               position: 'absolute',
               inset: 0,
               background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
               display: 'flex',
               flexDirection: 'column',
               justifyContent: 'center',
               padding: 'clamp(2rem, 5vw, 4rem)',
               color: 'white'
           }}>
              <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(255,255,255,0.1) 0%, transparent 20%), radial-gradient(circle at 90% 90%, rgba(255,255,255,0.1) 0%, transparent 20%)' 
              }} />
              
              <Stack style={{ position: 'relative', zIndex: 1 }} gap="xl">
                  <ThemeIcon size={64} radius="md" color="white" variant="white" style={{ color: '#4f46e5' }}>
                        <IconQuote size={32} />
                  </ThemeIcon>
                  <Title order={1} style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', lineHeight: 1.1 }}>
                     The future of<br/>
                     <span style={{ opacity: 0.7 }}>Internship Tracking.</span>
                  </Title>
                  <Text size="xl" style={{ opacity: 0.8, maxWidth: '500px', fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>
                      Experience seamless collaboration between students, guides, and team leaders. 
                      Automated visuals, instant approvals, and real-time insights.
                  </Text>
              </Stack>
          </div>
      </Grid.Col>

      {/* Right Side - Form */}
      <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(1rem, 3vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Container size={480} px={{ base: 'md', sm: 'lg' }} w="100%">
          <Paper shadow="xl" radius="lg" p={{ base: 'lg', sm: 'xl' }} withBorder style={{ backgroundColor: 'white' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Stack gap="lg">
                <div>
                   <Title order={2} fw={700}>
                     {isRegistering ? 'Get Started' : 'Welcome Back'}
                   </Title>
                   <Text c="dimmed" size="sm" mt={4}>
                     {isRegistering ? 'Create your account to join the workspace' : 'Enter your credentials to access your dashboard'}
                   </Text>
                </div>

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
                        label="Email"
                        placeholder="yourname@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        leftSection={<IconAt size={16} stroke={1.5} />}
                        radius="md"
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

                        <Group justify="center" gap={4} mt="sm">
                        <Text size="sm" c="dimmed">
                            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                        </Text>
                        <Anchor component="button" type="button" size="sm" fw={600} onClick={toggleMode} c="indigo.6">
                            {isRegistering ? 'Sign In' : 'Sign Up'}
                        </Anchor>
                        </Group>
                    </Stack>
                </form>
              </Stack>
            </motion.div>
          </Paper>
        </Container>
      </Grid.Col>
    </Grid>
  );
}