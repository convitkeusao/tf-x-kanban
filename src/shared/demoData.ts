import { TeamMember } from '../features/members/memberTypes';
import { Task } from '../features/tasks/taskTypes';

export const demoMembers: TeamMember[] = [
  { id: 'member-linh', name: 'Nguyễn Khánh Linh', role: 'Trưởng nhóm', color: '#7658e8', isManager: true },
  { id: 'member-minh', name: 'Trần Quang Minh', role: 'Thiết kế', color: '#ec8e50' },
  { id: 'member-ha', name: 'Lê Thu Hà', role: 'Marketing', color: '#df6485' },
  { id: 'member-khoa', name: 'Phạm Đăng Khoa', role: 'Phát triển', color: '#398d83' },
  { id: 'member-an', name: 'Vũ Hoàng An', role: 'Nội dung', color: '#5182c9' },
];

function localDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

export const demoTasks: Task[] = [
  {
    id: 'task-brand-guide',
    title: 'Chuẩn bị nội dung họp nhóm hôm nay',
    description: 'Tổng hợp việc cần ưu tiên và gửi cập nhật cho nhóm.',
    prerequisites: 'Không có yêu cầu tiên quyết.',
    assigneeId: 'member-linh',
    assigneeName: 'Nguyễn Khánh Linh',
    status: 'todo',
    priority: 'high',
    dueDate: dayFromNow(0),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-campaign',
    title: 'Lên kế hoạch nội dung tháng 11',
    description: 'Lập lịch đăng bài cho các kênh Facebook và Instagram.',
    prerequisites: 'Đã thống nhất mục tiêu truyền thông tháng 11.',
    assigneeId: 'member-ha',
    assigneeName: 'Lê Thu Hà',
    status: 'todo',
    priority: 'medium',
    dueDate: dayFromNow(3),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-landing',
    title: 'Xây dựng landing page chiến dịch',
    description: 'Hoàn thiện giao diện trang đích theo bản thiết kế đã duyệt.',
    prerequisites: 'Đã có bản thiết kế được duyệt.',
    assigneeId: 'member-khoa',
    assigneeName: 'Phạm Đăng Khoa',
    status: 'in_progress',
    priority: 'high',
    dueDate: dayFromNow(4),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-customer-survey',
    title: 'Tổng hợp phản hồi khách hàng',
    description: 'Phân loại khảo sát tháng này và gửi báo cáo cho nhóm.',
    prerequisites: 'Đã thu thập đủ phản hồi khách hàng trong tháng.',
    assigneeId: 'member-an',
    assigneeName: 'Vũ Hoàng An',
    status: 'done',
    priority: 'low',
    dueDate: dayFromNow(-1),
    createdAt: new Date().toISOString(),
  },
];
