import React from 'react';
import { Icon } from '../../components/Icon';
import { Task, TaskStatus } from './taskTypes';
import { GroupTaskRow } from './GroupTaskRow';
import { TaskRow } from './TaskRow';

export type TaskViewFilter = 'all' | TaskStatus;
export type MyTaskFilter = 'active' | 'done';
export type TaskCounts = Record<TaskViewFilter, number>;

const taskFilters: Array<[TaskViewFilter, string]> = [
  ['all', 'Tất cả'],
  ['todo', 'Chưa bắt đầu'],
  ['in_progress', 'Đang thực hiện'],
  ['done', 'Đã hoàn thành'],
];

type MyTasksSectionProps = {
  tasks: Task[];
  filter: MyTaskFilter;
  onFilterChange: (filter: MyTaskFilter) => void;
  loading: boolean;
  savingTaskId: string | null;
  canUpdateTask: (task: Task) => boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onViewDetails: (task: Task) => void;
};

export const MyTasksSection = React.memo(function MyTasksSection({
  tasks,
  filter,
  onFilterChange,
  loading,
  savingTaskId,
  canUpdateTask,
  onStatusChange,
  onViewDetails,
}: MyTasksSectionProps) {
  const activeCount = tasks.reduce((count, task) => count + Number(task.status !== 'done'), 0);
  const doneCount = tasks.length - activeCount;
  const visibleTasks = tasks.filter((task) => filter === 'done' ? task.status === 'done' : task.status !== 'done');

  return (
    <section className="today-section today-card" aria-label="Việc của tôi">
      <h2>Việc của tôi</h2>
      <div className="my-task-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Lọc việc của tôi">
          <button type="button" role="tab" aria-selected={filter === 'active'} className={filter === 'active' ? 'selected' : ''} onClick={() => onFilterChange('active')}>
            Đang làm<span>{activeCount}</span>
          </button>
          <button type="button" role="tab" aria-selected={filter === 'done'} className={filter === 'done' ? 'selected' : ''} onClick={() => onFilterChange('done')}>
            Đã hoàn thành<span>{doneCount}</span>
          </button>
        </div>
      </div>
      <div className="today-list">
        <div className="workflow-task-header">
          <span>TÊN CÔNG VIỆC</span>
          <span>HẠN HOÀN THÀNH</span>
          <span>TRẠNG THÁI</span>
          <span>THAO TÁC</span>
        </div>
        {loading ? (
          <div className="today-empty" role="status"><span className="loading-spinner" />Đang tải công việc...</div>
        ) : visibleTasks.length ? visibleTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            isSaving={savingTaskId === task.id}
            canUpdateStatus={canUpdateTask(task)}
            onStatusChange={onStatusChange}
            onViewDetails={onViewDetails}
          />
        )) : <div className="today-empty">{filter === 'done' ? 'Chưa có công việc đã hoàn thành' : 'Chưa có công việc cần làm'}</div>}
      </div>
    </section>
  );
});

type GroupTasksSectionProps = {
  tasks: Task[];
  totalTasks: number;
  counts: TaskCounts;
  filter: TaskViewFilter;
  onFilterChange: (filter: TaskViewFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
  sortAscending: boolean;
  onSortToggle: () => void;
  loading: boolean;
  isSynced: boolean;
  onViewDetails: (task: Task) => void;
};

export const GroupTasksSection = React.memo(function GroupTasksSection({
  tasks,
  totalTasks,
  counts,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  sortAscending,
  onSortToggle,
  loading,
  isSynced,
  onViewDetails,
}: GroupTasksSectionProps) {
  return (
    <section className="tasks-section">
      <div className="section-heading">
        <h2>Danh sách công việc</h2>
        <label className="search-box">
          <Icon name="search" size={20} />
          <input aria-label="Tìm công việc" placeholder="Tìm tên việc hoặc người phụ trách" value={search} onChange={(event) => onSearchChange(event.target.value)} />
        </label>
      </div>
      <div className="task-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Lọc danh sách công việc">
          {taskFilters.map(([key, label]) => (
            <button type="button" key={key} role="tab" aria-selected={filter === key} className={filter === key ? 'selected' : ''} onClick={() => onFilterChange(key)}>
              {label}<span>{counts[key]}</span>
            </button>
          ))}
        </div>
        <button className="sort-button" type="button" onClick={onSortToggle}>
          <Icon name="calendar" size={18} /><span>{sortAscending ? 'Hạn gần trước' : 'Hạn xa trước'}</span>
        </button>
      </div>
      <div className="task-list team-task-list">
        <div className="task-list-header team-task-header"><span>TÊN CÔNG VIỆC</span></div>
        {loading ? (
          <div className="task-empty" role="status"><span className="loading-spinner" />Đang tải công việc...</div>
        ) : tasks.length ? tasks.map((task) => (
          <GroupTaskRow key={task.id} task={task} onViewDetails={onViewDetails} />
        )) : (
          <div className="task-empty"><span className="empty-illustration"><Icon name="tasks" size={28} /></span><strong>Chưa có công việc phù hợp</strong><span>Hãy đổi mục lọc hoặc bấm “Giao việc mới” để tạo việc.</span></div>
        )}
      </div>
      <div className="list-footer">
        <span>Đang hiển thị <strong>{tasks.length}</strong> / <strong>{totalTasks}</strong> công việc</span>
        <span className="live-indicator"><i />{isSynced ? 'Đã đồng bộ' : 'Chỉ lưu trên thiết bị này'}</span>
      </div>
    </section>
  );
});
