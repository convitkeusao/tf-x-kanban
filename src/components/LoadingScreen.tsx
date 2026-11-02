type Props = {
  message: string;
};

export function LoadingScreen({ message }: Props) {
  return (
    <Center mih="100vh" p="md" role="status">
      <Stack align="center" gap="sm"><Loader color="violet" /><Text size="sm" c="dimmed">{message}</Text></Stack>
    </Center>
  );
}
import { Center, Loader, Stack, Text } from '@mantine/core';
