import React, { useState } from 'react';
import { Alert, Button, Stack } from '@mantine/core';
import { supabaseConfigured } from './api/supabaseClient';
import { LoadingScreen } from './components/LoadingScreen';
import { SupabaseAuth } from './features/auth/SupabaseAuth';
import { LandingPage } from './features/landing/LandingPage';
import { TasksPage } from './features/tasks/pages/TasksPage';
import { useAuthSession } from './features/auth/useAuthSession';

function App() {
  const { user, setUser, authStatus, authError, signOutCurrentUser } = useAuthSession();
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [showAuth, setShowAuth] = useState(false);

  if (authStatus === 'loading') {
    return <LoadingScreen message="Đang kiểm tra phiên đăng nhập..." />;
  }
  if (authError) {
    return (
      <Stack mih="100vh" align="center" justify="center" p="md" gap="md">
        <Alert color="red" role="alert">{authError}</Alert>
        <Button variant="default" onClick={() => window.location.reload()}>Thử lại</Button>
      </Stack>
    );
  }
  if (supabaseConfigured && !user) {
    if (!showAuth) {
      return (
        <LandingPage
          onSignIn={() => {
            setAuthMode('sign-in');
            setShowAuth(true);
          }}
          onSignUp={() => {
            setAuthMode('sign-up');
            setShowAuth(true);
          }}
        />
      );
    }
    return (
      <SupabaseAuth
        initialMode={authMode}
        onSignedIn={setUser}
        onBack={() => setShowAuth(false)}
      />
    );
  }
  return (
    <TasksPage
      user={user}
      onSignOut={supabaseConfigured ? signOutCurrentUser : undefined}
    />
  );
}

export default App;
