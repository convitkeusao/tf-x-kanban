import React from 'react';
import { Icon } from '../../components/Icon';
import { Task, TaskStatus } from './taskTypes';
import { formatDueDate, localDateString } from './taskUi';
import { TaskDetailsButton, TaskProgressButton } from './TaskActions';

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Chưa bắt đầu',
  in_progress: 'Đang thực hiện',
  done: 'Đã hoàn thành',
};

type Props = {
  task: Task;
  isSaving: boolean;
  canUpdateStatus: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onViewDetails: (task: Task) => void;
};

export const TaskRow = React.memo(function TaskRow({
  task,
  isSaving,
  canUpdateStatus,
  onStatusChange,
  onViewDetails,
}: Props) {
  const overdue = task.status !== 'done' && task.dueDate < localDateString(new Date());

  return (
    <article className={`task-row workflow-task-row ${task.status === 'done' ? 'task-row-done' : ''}`}>
      <strong className={task.status === 'done' ? 'completed-title' : ''}>{task.title}</strong>
      <span className={`workflow-task-due ${overdue ? 'overdue' : ''}`} data-label="Hạn hoàn thành">
        <Icon name="calendar" size={15} />
        <span>{formatDueDate(task.dueDate)}</span>
        {overdue && <small>Quá hạn</small>}
      </span>
      <span className="workflow-task-status-cell" data-label="Trạng thái">
        <span className={`workflow-task-status ${task.status}`}>{statusLabels[task.status]}</span>
      </span>
      <span className="workflow-task-action-cell" data-label="Thao tác">
        <TaskDetailsButton task={task} onViewDetails={onViewDetails} />
        <TaskProgressButton
          task={task}
          isSaving={isSaving}
          canUpdateStatus={canUpdateStatus}
          onStatusChange={onStatusChange}
        />
      </span>
    </article>
  );
});
