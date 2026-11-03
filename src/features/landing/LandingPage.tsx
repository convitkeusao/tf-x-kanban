import type { ReactNode } from 'react';
import { Anchor, Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core';

type Props = {
  installButton: ReactNode;
  onSignIn: () => void;
  onSignUp: () => void;
};

const features = [
  { title: 'Giao việc rõ ràng', description: 'Phân công người phụ trách, thời hạn và kết quả cần hoàn thành.' },
  { title: 'Theo dõi tiến độ', description: 'Nắm nhanh công việc đang chờ, đang thực hiện hoặc đã hoàn tất.' },
  { title: 'Phối hợp trong một nơi', description: 'Tạo nhóm, mời thành viên và cùng cập nhật công việc.' },
];

export function LandingPage({ installButton, onSignIn, onSignUp }: Props) {
  return (
    <Stack mih="100vh" gap={0} bg="white">
      <Container size="xl" w="100%">
        <Group justify="space-between" mih={64} gap="md">
          <Anchor href="#home" c="dark" underline="never" aria-label="Teamflow - Trang chủ">
            <Group gap="sm" fw={700}><img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={32} height={32} /><Text inherit>Teamflow</Text></Group>
          </Anchor>
          <Group gap="sm">
            {installButton}
            <Button variant="subtle" size="sm" onClick={onSignIn}>Đăng nhập</Button>
            <Button size="sm" onClick={onSignUp}>Đăng ký</Button>
          </Group>
        </Group>
      </Container>
      <Container id="home" size="xl" w="100%" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div className="landing-grid">
          <Stack gap="lg">
            <Title order={1} size="h1" fw={800}>
              Teamflow
            </Title>

            <Title order={2} size="h2" fw={700} lh={1.3}>
              Làm việc nhóm dễ dàng.
              <Text component="span" c="blue" inherit>
                {' '}Hoàn thành mục tiêu nhanh hơn.
              </Text>
            </Title>

            <Text c="dimmed" maw={520} lh={1.8}>
              Teamflow – nền tảng quản lý công việc và cộng tác nhóm.
              Kết nối thành viên, phân chia nhiệm vụ, theo dõi tiến độ
              và cùng nhau tạo nên những kết quả tốt hơn.
            </Text>
          </Stack>
          <Stack id="features" gap="md" className="landing-features">
            <Title order={2} size="h2">Mọi thứ cần thiết cho nhóm</Title>
            {features.map((feature) => (
              <Card key={feature.title} withBorder padding="md">
                <Text fw={600}>{feature.title}</Text>
                <Text size="sm" c="dimmed" mt={4} lh={1.6}>{feature.description}</Text>
              </Card>
            ))}
          </Stack>
        </div>
      </Container>
      <Container size="xl" w="100%">
        <Group justify="space-between" mih={64} style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Text size="xs" c="dimmed">© 2026 Teamflow</Text>
        </Group>
      </Container>
    </Stack>
  );
}
