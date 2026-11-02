import React, { FormEvent, useState } from 'react';
import { Alert, Anchor, Button, Container, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { AppUser, signIn, signUp } from '../../api/supabaseAuth';

type Props = {
  onSignedIn: (user: AppUser) => void;
  initialMode?: 'sign-in' | 'sign-up';
  onBack?: () => void;
};

export function SupabaseAuth({ onSignedIn, initialMode = 'sign-in', onBack }: Props) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      else {
        const result = await signUp(fullName.trim(), email.trim(), password);
        if (result.emailConfirmationRequired) setConfirmationSent(true);
        else onSignedIn(result.user);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : mode === 'sign-in' ? 'Không thể đăng nhập.' : 'Không thể tạo tài khoản.');
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode: 'sign-in' | 'sign-up') {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setError('');
    setConfirmationSent(false);
  }

  return (
    <Container size={420} mih="100vh" py="xl" style={{ display: 'flex', alignItems: 'center' }}>
      <Stack w="100%" align="center" gap="lg">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Teamflow" width={64} height={64} />
        <Paper w="100%" withBorder p="xl">
          <form onSubmit={handleSubmit}>
            {confirmationSent ? (
              <Stack gap="md" role="status">
                <Stack gap={6} ta="center">
                  <Title order={1} size="h2">Kiểm tra email của bạn</Title>
                  <Text size="sm" c="dimmed" lh={1.6}>Supabase đã gửi liên kết xác minh đến <strong>{email.trim()}</strong>. Hãy xác minh email để hoàn tất đăng ký.</Text>
                </Stack>
                <Button fullWidth type="button" onClick={() => changeMode('sign-in')}>Quay lại đăng nhập</Button>
              </Stack>
            ) : (
              <Stack gap="md">
                <Stack gap={6} ta="center">
                  <Title order={1} size="h2">{mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'}</Title>
                  <Text size="sm" c="dimmed" lh={1.6}>{mode === 'sign-in' ? 'Đăng nhập để xem công việc của nhóm.' : 'Đăng ký bằng email để bắt đầu làm việc cùng nhóm.'}</Text>
                </Stack>
                {mode === 'sign-up' && (
                  <TextInput label="Họ và tên" id="auth-full-name" autoComplete="name" placeholder="Nguyễn Văn A" value={fullName} onChange={(event) => setFullName(event.currentTarget.value)} required />
                )}
                <TextInput label="Địa chỉ email" id="auth-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="ten@congty.com" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required />
                <PasswordInput label="Mật khẩu" id="auth-password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} placeholder={mode === 'sign-up' ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu'} value={password} onChange={(event) => setPassword(event.currentTarget.value)} minLength={mode === 'sign-up' ? 6 : undefined} visible={showPassword} onVisibilityChange={setShowPassword} required />
                {mode === 'sign-up' && (
                  <PasswordInput label="Xác nhận mật khẩu" id="auth-confirm-password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(event) => setConfirmPassword(event.currentTarget.value)} minLength={6} visible={showPassword} onVisibilityChange={setShowPassword} required />
                )}
                {error && <Alert color="red" role="alert">{error}</Alert>}
                <Button fullWidth type="submit" loading={submitting}>{mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'}</Button>
                <Text ta="center" size="sm" c="dimmed">
                  {mode === 'sign-in' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
                  <Anchor component="button" type="button" onClick={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
                    {mode === 'sign-in' ? 'Đăng ký' : 'Đăng nhập'}
                  </Anchor>
                </Text>
              </Stack>
            )}
          </form>
        </Paper>
        {onBack && <Button variant="subtle" type="button" onClick={onBack}>Quay lại trang chủ</Button>}
      </Stack>
    </Container>
  );
}
