import React from 'react';
import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { Icon } from '../../../components/Icon';
import { Task } from '../taskTypes';
import { TaskDetailsButton } from './TaskActions';

type Props = { task: Task; onViewDetails: (task: Task) => void };

export const GroupTaskRow = React.memo(function GroupTaskRow({ task, onViewDetails }: Props) {
  const color = task.status === 'done' ? 'green' : task.status === 'in_progress' ? 'yellow' : 'gray';
  const label = task.status === 'done' ? 'Đã hoàn thành' : task.status === 'in_progress' ? 'Đang thực hiện' : 'Chưa bắt đầu';
  return (
    <Paper component="article" p="md" radius={0} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
      <Group justify="space-between" gap="md">
        <Stack gap="xs" style={{ minWidth: 0 }}>
          <Text size="sm" fw={500} style={{ overflowWrap: 'anywhere' }}>{task.title}</Text>
          <Badge color={color} radius={0} w="fit-content">{label}</Badge>
        </Stack>
        <Group gap="xs" wrap="nowrap">
          <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="user" size={14} />{task.assigneeName}</Text>
          <TaskDetailsButton task={task} onViewDetails={onViewDetails} />
        </Group>
      </Group>
    </Paper>
  );
});
