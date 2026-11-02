import React from 'react';
import { Icon } from '../../components/Icon';
import { Task, TaskStatus, TeamMember } from './taskTypes';
import { formatDueDate, initials, localDateString } from './taskUi';

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Chưa bắt đầu',
  in_progress: 'Đang thực hiện',
  done: 'Đã hoàn thành',
};

type Props = {
  task: Task;
  assignee?: TeamMember;
  isSaving: boolean;
  canUpdateStatus: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onViewDetails: (task: Task) => void;
  workflow?: boolean;
  showAssignee?: boolean;
};

export function TaskRow({ task, assignee, isSaving, canUpdateStatus, onStatusChange, onViewDetails, workflow = false, showAssignee = false }: Props) {
  const overdue = task.status !== 'done' && task.dueDate < localDateString(new Date());
  const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';

  if (workflow) {
    if (showAssignee) {
      return (
        <article className={`task-row workflow-task-row team-workflow-task-row ${task.status === 'done' ? 'task-row-done' : ''}`}>
          <div className="team-task-info">
            <strong className={task.status === 'done' ? 'completed-title' : ''}>{task.title}</strong>
            <button
              className="workflow-task-details"
              type="button"
              aria-label={`Xem chi tiết công việc: ${task.title}`}
              onClick={() => onViewDetails(task)}
            >
              <Icon name="eye" size={16} />
              <span>Chi tiết</span>
            </button>
          </div>
        </article>
      );
    }

    const action = !showAssignee && task.status === 'todo'
      ? { label: 'Làm', status: 'in_progress' as const }
      : null;

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
          <button
            className="workflow-task-details"
            type="button"
            aria-label={`Xem chi tiết công việc: ${task.title}`}
            onClick={() => onViewDetails(task)}
          >
            <Icon name="eye" size={16} />
            <span>Chi tiết</span>
          </button>
          {action && (
            <button
              className={`workflow-task-action ${task.status}`}
              type="button"
              disabled={isSaving || !canUpdateStatus}
              onClick={() => onStatusChange(task, action.status)}
            >
              {isSaving ? 'Đang lưu...' : action.label}
            </button>
          )}
        </span>
      </article>
    );
  }

  return (
    <article className={`task-row ${task.status === 'done' ? 'task-row-done' : ''}`}>
      <button
        className={`task-check ${task.status === 'done' ? 'checked' : ''}`}
        type="button"
        aria-label={task.status === 'done' ? `Đánh dấu chưa hoàn thành: ${task.title}` : `Đánh dấu hoàn thành: ${task.title}`}
        title={task.status === 'done' ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
        disabled={isSaving || !canUpdateStatus}
        onClick={() => onStatusChange(task, nextStatus)}
      >
        {task.status === 'done' ? <Icon name="check" size={15} /> : <Icon name="circle" size={15} />}
      </button>
      <div className="task-info">
        <div className="task-title-copy">
          <strong className={task.status === 'done' ? 'completed-title' : ''}>{task.title}</strong>
          <span className="task-description">{task.input || task.description || task.output || 'Chưa thêm mô tả'}</span>
          {task.status === 'done' && task.completionReport && (
            <span className="completion-report-copy"><strong>Chi tiết:</strong> {task.completionReport}</span>
          )}
          <span className="task-assignee-mobile">
            <span className="avatar avatar-tiny" style={{ backgroundColor: assignee?.color || '#7658e8' }}>{initials(task.assigneeName)}</span>
            {task.assigneeName}
          </span>
        </div>
        <button
          className="task-details-button"
          type="button"
          aria-label={`Xem chi tiết công việc: ${task.title}`}
          title="Xem chi tiết"
          onClick={() => onViewDetails(task)}
        >
          <Icon name="eye" size={17} />
        </button>
      </div>
      <div className={`task-due ${overdue ? 'overdue' : ''}`}>
        <span className="task-date"><Icon name="calendar" size={14} />{formatDueDate(task.dueDate)}</span>
        {overdue && <span>Đã quá hạn</span>}
      </div>
      <div className="task-status-cell">
        <select
          aria-label={`Trạng thái: ${task.title}`}
          className={`status-select ${task.status}`}
          value={task.status}
          disabled={isSaving || !canUpdateStatus}
          onChange={(event) => onStatusChange(task, event.target.value as TaskStatus)}
        >
          {(Object.keys(statusLabels) as TaskStatus[]).map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
        </select>
      </div>
      <div className="task-assignee" title={task.assigneeName}>
        <span className="avatar avatar-tiny" style={{ backgroundColor: assignee?.color || '#7658e8' }}>{initials(task.assigneeName)}</span>
        <span>{task.assigneeName}</span>
      </div>
    </article>
  );
}
