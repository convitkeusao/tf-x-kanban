import React from 'react';
import { Badge, Group, Paper, Text } from '@mantine/core';
import { Icon } from '../../../components/Icon';
import { Task, TaskStatus } from '../taskTypes';
import { formatDueDate, localDateString } from '../taskUi';
import { TaskDetailsButton, TaskProgressButton } from './TaskActions';

const statusLabels: Record<TaskStatus, string> = { todo: 'Chưa bắt đầu', in_progress: 'Đang thực hiện', done: 'Đã hoàn thành' };
type Props = { task: Task; isSaving: boolean; canUpdateStatus: boolean; onStatusChange: (task: Task, status: TaskStatus) => void; onViewDetails: (task: Task) => void };

export const TaskRow = React.memo(function TaskRow({ task, isSaving, canUpdateStatus, onStatusChange, onViewDetails }: Props) {
  const overdue = task.status !== 'done' && task.dueDate < localDateString(new Date());
  const color = task.status === 'done' ? 'green' : task.status === 'in_progress' ? 'yellow' : 'gray';
  return (
    <Paper component="article" radius={0} p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
      <div className="task-row">
        <Text className="task-row__title" size="sm" fw={500} c={task.status === 'done' ? 'dimmed' : 'dark'} td={task.status === 'done' ? 'line-through' : undefined}>{task.title}</Text>
        <Group gap="xs" wrap="nowrap"><Icon name="calendar" size={15} /><Text size="sm" c={overdue ? 'red' : 'dimmed'}>{formatDueDate(task.dueDate)}</Text>{overdue && <Badge color="red" radius={0}>Quá hạn</Badge>}</Group>
        <Group gap="xs" wrap="nowrap">
          <Badge color={color} radius={0}>{statusLabels[task.status]}</Badge>
          <TaskDetailsButton task={task} onViewDetails={onViewDetails} />
          <TaskProgressButton task={task} isSaving={isSaving} canUpdateStatus={canUpdateStatus} onStatusChange={onStatusChange} />
        </Group>
      </div>
    </Paper>
  );
});
