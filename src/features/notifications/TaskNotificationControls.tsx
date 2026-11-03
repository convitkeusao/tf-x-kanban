import { Alert, Button, Group, Stack, Text } from '@mantine/core';
import { useTaskNotifications } from './useTaskNotifications';

type Props = {
  userId: string;
};

export function TaskNotificationControls({ userId }: Props) {
  const notifications = useTaskNotifications(userId);

  return (
    <Stack gap="xs">
      {!notifications.supported && (
        <Text size="xs" c="dimmed">Trình duyệt này không hỗ trợ thông báo trên web.</Text>
      )}
      {notifications.supported && (
        <Group gap="xs">
          <Button
            variant="default"
            size="sm"
            onClick={() => notifications.enabled ? notifications.disable() : void notifications.enable()}
          >
            {notifications.enabled ? 'Tắt thông báo công việc' : 'Bật thông báo công việc'}
          </Button>
          <Text size="xs" c="dimmed">Thông báo khi có công việc mới được giao cho bạn.</Text>
        </Group>
      )}
      {notifications.error && <Alert color="red" role="alert">{notifications.error}</Alert>}
    </Stack>
  );
}
