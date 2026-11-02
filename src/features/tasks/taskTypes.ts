import { TeamMember } from '../members/memberTypes';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  description: string;
  prerequisites: string;
  input?: string | null;
  output?: string | null;
  assigneeId: string;
  assigneeName: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  completionReport?: string | null;
};

export type NewTask = Omit<Task, 'id' | 'createdAt' | 'input' | 'output'> & {
  input: string;
  output: string;
};
export type TaskUpdate = Pick<Task, 'status'> & { completionReport?: string | null };
export type { TeamMember };
