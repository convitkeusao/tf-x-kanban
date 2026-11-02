import React from 'react';
import { Task } from './taskTypes';
import { TaskDetailsButton } from './TaskActions';

type Props = {
  task: Task;
  onViewDetails: (task: Task) => void;
};

export const GroupTaskRow = React.memo(function GroupTaskRow({ task, onViewDetails }: Props) {
  return (
    <article className={`task-row workflow-task-row team-workflow-task-row ${task.status === 'done' ? 'task-row-done' : ''}`}>
      <div className="team-task-info">
        <strong>{task.title}</strong>
        <TaskDetailsButton task={task} onViewDetails={onViewDetails} />
      </div>
    </article>
  );
});
