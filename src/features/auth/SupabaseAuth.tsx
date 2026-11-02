import React, { FormEvent, useState } from 'react';
import { Alert, Anchor, Button, Container, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { AppUser, sendPasswordResetEmail, signIn, signUp, updatePassword } from '../../api/supabaseAuth';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password';

type Props = {
  onSignedIn: (user: AppUser) => void;
  initialMode?: 'sign-in' | 'sign-up' | 'reset-password';
  onBack?: () => void;
};

export function SupabaseAuth({ onSignedIn, initialMode = 'sign-in', onBack }: Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'reset-password' && password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (mode === 'sign-up' && !fullName.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (mode === 'sign-up' && password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'sign-in') onSignedIn(await signIn(email.trim(), password));
      else if (mode === 'sign-up') {
        const result = await signUp(fullName.trim(), email.trim(), password);
        if (result.emailConfirmationRequired) setConfirmationSent(true);
        else onSignedIn(result.user);
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(email.trim());
        setResetEmailSent(true);
      } else {
        onSignedIn(await updatePassword(password));
      }
    } catch (caught) {
      const fallbackMessage = mode === 'sign-in'
        ? 'Không thể đăng nhập.'
        : mode === 'sign-up'
          ? 'Không thể tạo tài khoản.'
          : mode === 'forgot-password'
            ? 'Không thể gửi email đặt lại mật khẩu.'
            : 'Không thể cập nhật mật khẩu.';
      setError(caught instanceof Error ? caught.message : fallbackMessage);
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setError('');
    setConfirmationSent(false);
    setResetEmailSent(false);
  }

  const title = mode === 'sign-in'
    ? 'Đăng nhập'
    : mode === 'sign-up'
      ? 'Tạo tài khoản'
      : mode === 'forgot-password'
        ? 'Quên mật khẩu'
        : 'Đặt lại mật khẩu';

  return (
    <Container size={420} mih="100vh" py="xl" style={{ display: 'flex', alignItems: 'center' }}>
      <Stack w="100%" align="center" gap="lg">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Teamflow" width={64} height={64} />
        <Paper w="100%" withBorder p="xl">
          <form onSubmit={handleSubmit}>
            {confirmationSent || resetEmailSent ? (
              <Stack gap="md" role="status">
                <Stack gap={6} ta="center">
                  <Title order={1} size="h2">
                    {resetEmailSent ? 'Kiểm tra email của bạn' : 'Kiểm tra email xác minh'}
                  </Title>
                  <Text size="sm" c="dimmed" lh={1.6}>
                    {resetEmailSent
                      ? <>Nếu tài khoản tồn tại với địa chỉ <strong>{email.trim()}</strong>, email hướng dẫn đặt lại mật khẩu sẽ được gửi đến đó.</>
                      : <>Supabase đã gửi liên kết xác minh đến <strong>{email.trim()}</strong>. Hãy xác minh email để hoàn tất đăng ký.</>}
                  </Text>
                </Stack>
                <Button fullWidth type="button" onClick={() => changeMode('sign-in')}>Quay lại đăng nhập</Button>
              </Stack>
            ) : (
              <Stack gap="md">
                <Stack gap={6} ta="center">
                  <Title order={1} size="h2">{title}</Title>
                  <Text size="sm" c="dimmed" lh={1.6}>
                    {mode === 'sign-in'
                      ? 'Đăng nhập để xem công việc của nhóm.'
                      : mode === 'sign-up'
                        ? 'Đăng ký bằng email để bắt đầu làm việc cùng nhóm.'
                        : mode === 'forgot-password'
                          ? 'Nhập email để nhận liên kết đặt lại mật khẩu.'
                          : 'Tạo mật khẩu mới cho tài khoản của bạn.'}
                  </Text>
                </Stack>
                {mode === 'sign-up' && (
                  <TextInput label="Họ và tên" id="auth-full-name" autoComplete="name" placeholder="Họ và tên" value={fullName} onChange={(event) => setFullName(event.currentTarget.value)} required />
                )}
                {mode !== 'reset-password' && (
                  <TextInput label="Địa chỉ email" id="auth-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="ten@congty.com" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required />
                )}
                {(mode === 'sign-in' || mode === 'sign-up' || mode === 'reset-password') && (
                  <PasswordInput label={mode === 'reset-password' ? 'Mật khẩu mới' : 'Mật khẩu'} id="auth-password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} placeholder={mode === 'sign-up' ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu'} value={password} onChange={(event) => setPassword(event.currentTarget.value)} minLength={mode === 'sign-in' ? undefined : 6} visible={showPassword} onVisibilityChange={setShowPassword} required />
                )}
                {(mode === 'sign-up' || mode === 'reset-password') && (
                  <PasswordInput label="Xác nhận mật khẩu" id="auth-confirm-password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(event) => setConfirmPassword(event.currentTarget.value)} minLength={6} visible={showPassword} onVisibilityChange={setShowPassword} required />
                )}
                {error && <Alert color="red" role="alert">{error}</Alert>}
                <Button fullWidth type="submit" loading={submitting}>
                  {mode === 'sign-in' ? 'Đăng nhập' : mode === 'sign-up' ? 'Tạo tài khoản' : mode === 'forgot-password' ? 'Gửi liên kết đặt lại mật khẩu' : 'Cập nhật mật khẩu'}
                </Button>
                {mode === 'sign-in' && (
                  <Text ta="center" size="sm">
                    <Anchor component="button" type="button" onClick={() => changeMode('forgot-password')}>Quên mật khẩu?</Anchor>
                  </Text>
                )}
                {(mode === 'sign-in' || mode === 'sign-up') && (
                  <Text ta="center" size="sm" c="dimmed">
                    {mode === 'sign-in' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
                    <Anchor component="button" type="button" onClick={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
                      {mode === 'sign-in' ? 'Đăng ký' : 'Đăng nhập'}
                    </Anchor>
                  </Text>
                )}
                {(mode === 'forgot-password' || mode === 'reset-password') && (
                  <Text ta="center" size="sm">
                    <Anchor component="button" type="button" onClick={() => changeMode('sign-in')}>Quay lại đăng nhập</Anchor>
                  </Text>
                )}
              </Stack>
            )}
          </form>
        </Paper>
        {onBack && <Button variant="subtle" type="button" onClick={onBack}>Quay lại trang chủ</Button>}
      </Stack>
    </Container>
  );
}
