import React, { useState } from 'react';
import { Alert, Button, Container, Stack, Text, Title } from '@mantine/core';
import { supabaseConfigured } from './api/supabaseClient';
import { LoadingScreen } from './components/LoadingScreen';
import { SupabaseAuth } from './features/auth/SupabaseAuth';
import { LandingPage } from './features/landing/LandingPage';
import { TasksPage } from './features/tasks/pages/TasksPage';
import { useAuthSession } from './features/auth/useAuthSession';
import { usePwaInstall } from './app/usePwaInstall';
import { PwaInstallButton } from './components/PwaInstallButton';

function App() {
  const { user, setUser, authStatus, authError, signOutCurrentUser } = useAuthSession();
  const pwaInstall = usePwaInstall();
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [showAuth, setShowAuth] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery',
  );

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
  if (!supabaseConfigured) {
    return (
      <Container size="sm" mih="100vh" py="xl" style={{ display: 'flex', alignItems: 'center' }}>
        <Stack w="100%" gap="md">
          <Title order={1} size="h2">Cần cấu hình Supabase</Title>
          <Alert color="yellow" title="Chưa kết nối cơ sở dữ liệu">
            Thêm VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY vào file .env, sau đó khởi động lại ứng dụng.
          </Alert>
          <Text size="sm" c="dimmed">Ứng dụng không dùng dữ liệu mẫu hoặc lưu dữ liệu công việc trên thiết bị.</Text>
        </Stack>
      </Container>
    );
  }
  if (passwordRecovery) {
    return (
      <SupabaseAuth
        initialMode="reset-password"
        onSignedIn={(nextUser) => {
          setUser(nextUser);
          setPasswordRecovery(false);
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }}
      />
    );
  }
  if (!user) {
    if (!showAuth) {
      return (
        <LandingPage
          installButton={<PwaInstallButton install={pwaInstall} />}
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
      installButton={<PwaInstallButton install={pwaInstall} />}
      onSignOut={signOutCurrentUser}
    />
  );
}

export default App;
