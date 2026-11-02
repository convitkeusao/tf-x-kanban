import React from 'react';
import { Button } from '@mantine/core';
import { Icon } from '../../../components/Icon';
import { Task, TaskStatus } from '../taskTypes';

type DetailsButtonProps = { task: Task; onViewDetails: (task: Task) => void };

export const TaskDetailsButton = React.memo(function TaskDetailsButton({ task, onViewDetails }: DetailsButtonProps) {
  return <Button variant="subtle" size="compact-sm" aria-label={`Xem chi tiết công việc: ${task.title}`} leftSection={<Icon name="eye" size={16} />} onClick={() => onViewDetails(task)}>Chi tiết</Button>;
});

type StatusButtonProps = { task: Task; isSaving: boolean; canUpdateStatus: boolean; onStatusChange: (task: Task, status: TaskStatus) => void };

export const TaskProgressButton = React.memo(function TaskProgressButton({ task, isSaving, canUpdateStatus, onStatusChange }: StatusButtonProps) {
  const action = task.status === 'todo' ? { label: 'Làm', status: 'in_progress' as const }
    : task.status === 'in_progress' ? { label: 'Nộp', status: 'done' as const } : null;
  if (!action) return null;
  return (
    <Button color={task.status === 'in_progress' ? 'green' : 'violet'} variant={task.status === 'in_progress' ? 'light' : 'filled'} size="compact-sm" loading={isSaving} disabled={!canUpdateStatus} onClick={() => onStatusChange(task, action.status)}>
      {action.label}
    </Button>
  );
});
