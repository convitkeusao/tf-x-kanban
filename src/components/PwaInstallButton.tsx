import { Alert, Button, Group, Stack, Text } from '@mantine/core';
import { usePwaInstall } from '../app/usePwaInstall';

export function PwaInstallButton({ install }: { install: ReturnType<typeof usePwaInstall> }) {
  return (
    <Stack gap="xs">
      <Button variant="default" onClick={() => void install.installApp()} disabled={install.isInstalled}>
        {install.isInstalled ? 'Ứng dụng đã được cài đặt' : 'Cài đặt / ghim ứng dụng'}
      </Button>
      {install.message && (
        <Alert color={install.isInstalled ? 'green' : 'blue'} role="status">
          <Group gap="xs" align="start">
            <Text size="sm">{install.message}</Text>
          </Group>
        </Alert>
      )}
    </Stack>
  );
}
