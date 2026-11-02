import React from 'react';
import { Icon } from '../../components/Icon';
import { Task, TaskStatus } from './taskTypes';

type DetailsButtonProps = {
  task: Task;
  onViewDetails: (task: Task) => void;
};

export const TaskDetailsButton = React.memo(function TaskDetailsButton({ task, onViewDetails }: DetailsButtonProps) {
  return (
    <button
      className="workflow-task-details"
      type="button"
      aria-label={`Xem chi tiết công việc: ${task.title}`}
      onClick={() => onViewDetails(task)}
    >
      <Icon name="eye" size={16} />
      <span>Chi tiết</span>
    </button>
  );
});

type StatusButtonProps = {
  task: Task;
  isSaving: boolean;
  canUpdateStatus: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
};

export const TaskProgressButton = React.memo(function TaskProgressButton({
  task,
  isSaving,
  canUpdateStatus,
  onStatusChange,
}: StatusButtonProps) {
  const action = task.status === 'todo'
    ? { label: 'Làm', status: 'in_progress' as const }
    : task.status === 'in_progress'
      ? { label: 'Nộp', status: 'done' as const }
      : null;

  if (!action) return null;

  return (
    <button
      className={`workflow-task-action ${task.status}`}
      type="button"
      disabled={isSaving || !canUpdateStatus}
      onClick={() => onStatusChange(task, action.status)}
    >
      {isSaving ? 'Đang lưu...' : action.label}
    </button>
  );
});
