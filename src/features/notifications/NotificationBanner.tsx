type Props = {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
};

export function NotificationBanner({ message, onRetry, onDismiss }: Props) {
  return (
    <Alert color="red" title={message} role="alert">
      <Group mt="xs" gap="xs">
        <Button size="xs" color="red" variant="light" onClick={onRetry}>Thử lại</Button>
        <Button size="xs" color="red" variant="subtle" onClick={onDismiss}>Đóng</Button>
      </Group>
    </Alert>
  );
}
import { Alert, Button, Group } from '@mantine/core';
