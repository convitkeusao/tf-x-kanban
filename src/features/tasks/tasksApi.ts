import { requireSupabase } from '../../api/requireSupabase';
import { supabaseConfigured } from '../../api/supabaseClient';
import { demoTasks, demoMembers } from '../../shared/demoData';
import { readLocalData, saveLocalData } from '../../shared/localStorage';
import { Task, TaskUpdate, NewTask } from './taskTypes';

const tasksStorageKey = 'teamflow.demo.tasks';
const membersStorageKey = 'teamflow.demo.members';

type TaskRow = {
  id: string;
  title: string;
  description: string;
  prerequisites: string;
  input: string | null;
  output: string | null;
  assignee_id: string;
  status: Task['status'];
  priority: Task['priority'];
  due_date: string;
  created_at: string;
  completion_report: string | null;
  profiles?: { name: string } | { name: string }[] | null;
};

function mapTask(row: TaskRow): Task {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    prerequisites: row.prerequisites?.trim() || 'Không có yêu cầu tiên quyết.',
    input: row.input ?? row.description,
    output: row.output,
    assigneeId: row.assignee_id,
    assigneeName: profile?.name || 'Chưa rõ người phụ trách',
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    createdAt: row.created_at,
    completionReport: row.completion_report,
  };
}

export async function listTasks(groupId?: string): Promise<Task[]> {
  if (!supabaseConfigured) {
    return readLocalData(tasksStorageKey, demoTasks).map((task) => ({
      ...task,
      prerequisites: task.prerequisites?.trim() || 'Không có yêu cầu tiên quyết.',
    }));
  }
  if (!groupId) return [];

  const { data, error } = await requireSupabase()
    .from('tasks')
    .select('id,title,description,prerequisites,input,output,assignee_id,status,priority,due_date,created_at,completion_report,profiles(name)')
    .eq('group_id', groupId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return (data as TaskRow[]).map(mapTask);
}

export async function createTask(task: NewTask, groupId?: string): Promise<Task> {
  const prerequisites = task.prerequisites.trim();
  if (!task.title.trim() || !prerequisites || !task.input.trim() || !task.output.trim()
    || !task.assigneeId || !task.dueDate) {
    throw new Error('Vui lòng điền đầy đủ các trường bắt buộc.');
  }

  if (!supabaseConfigured) {
    const tasks = readLocalData(tasksStorageKey, demoTasks);
    const member = readLocalData(membersStorageKey, demoMembers).find((item) => item.id === task.assigneeId);
    const created: Task = {
      ...task,
      assigneeName: member?.name ?? task.assigneeName,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    saveLocalData(tasksStorageKey, [created, ...tasks]);
    return created;
  }
  if (!groupId) throw new Error('Hãy chọn một nhóm trước khi giao việc.');

  const { data, error } = await requireSupabase()
    .from('tasks')
    .insert({
      title: task.title,
      description: task.description,
      prerequisites,
      input: task.input.trim(),
      output: task.output.trim(),
      group_id: groupId,
      assignee_id: task.assigneeId,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate,
    })
    .select('id,title,description,prerequisites,input,output,assignee_id,status,priority,due_date,created_at,completion_report,profiles(name)')
    .single();
  if (error) throw error;
  return mapTask(data as TaskRow);
}

export async function updateTask(id: string, update: TaskUpdate, groupId?: string): Promise<Task> {
  const completionReport = update.status === 'done'
    ? update.completionReport?.trim()
    : null;
  if (update.status === 'done' && !completionReport) {
    throw new Error('Vui lòng nhập chi tiết báo cáo trước khi hoàn thành.');
  }

  if (!supabaseConfigured) {
    const tasks = readLocalData(tasksStorageKey, demoTasks);
    const index = tasks.findIndex((task) => task.id === id);
    if (index < 0) throw new Error('Không tìm thấy công việc cần cập nhật.');
    tasks[index] = { ...tasks[index], status: update.status, completionReport };
    saveLocalData(tasksStorageKey, tasks);
    return tasks[index];
  }
  if (!groupId) throw new Error('Hãy chọn một nhóm trước khi cập nhật công việc.');

  const { data, error } = await requireSupabase()
    .from('tasks')
    .update({
      status: update.status,
      completion_report: completionReport,
    })
    .eq('id', id)
    .eq('group_id', groupId)
    .select('id,title,description,prerequisites,input,output,assignee_id,status,priority,due_date,created_at,completion_report,profiles(name)')
    .single();
  if (error) throw error;
  return mapTask(data as TaskRow);
}
