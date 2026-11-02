import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppUser } from '../api/supabaseAuth';
import { supabaseConfigured } from '../api/supabaseClient';
import { createGroup, deleteGroup, joinGroup, listGroups } from '../features/groups/groupsApi';
import { listActivityLogs } from '../features/activity/activityApi';
import { leaveGroup, listMembers, removeGroupMember, transferGroupManager } from '../features/members/membersApi';
import { createTask, listTasks, updateTask } from '../features/tasks/tasksApi';
import { Icon } from '../components/Icon';
import {
  AccountModal,
  CompletionReportModal,
  GroupModal,
  InviteCodeModal,
  MembersModal,
  TaskModal,
  TaskDetailsModal,
} from '../features/tasks/TaskDialogs';
import { TaskRow } from '../features/tasks/TaskRow';
import { NotificationBanner } from '../features/notifications/NotificationBanner';
import { ActivityLog } from '../features/activity/activityTypes';
import { TeamGroup } from '../features/groups/groupTypes';
import { TeamMember } from '../features/members/memberTypes';
import { NewTask, Task, TaskStatus } from '../features/tasks/taskTypes';
import './TasksPage.css';

type Props = {
  user: AppUser | null;
  onSignOut?: () => void;
};

type ViewFilter = 'all' | TaskStatus;
type MyTaskFilter = 'active' | 'done';

const taskFilters: Array<[ViewFilter, string]> = [
  ['all', 'Tất cả'],
  ['todo', 'Chưa bắt đầu'],
  ['in_progress', 'Đang thực hiện'],
  ['done', 'Đã hoàn thành'],
];

function activityLabel(eventType: ActivityLog['eventType']): string {
  switch (eventType) {
    case 'group_created': return 'Tạo nhóm';
    case 'task_created': return 'Tạo công việc';
    case 'task_completed': return 'Hoàn thành công việc';
    case 'task_status_changed': return 'Đổi trạng thái công việc';
    case 'task_reassigned': return 'Chuyển giao công việc';
    case 'task_deleted': return 'Xóa công việc';
    case 'member_removed': return 'Xóa thành viên';
    case 'member_left': return 'Thành viên rời nhóm';
    case 'manager_transferred': return 'Chuyển quyền trưởng nhóm';
  }
}

export function TasksPage({ user, onSignOut }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [filter, setFilter] = useState<ViewFilter>('all');
  const [myTaskFilter, setMyTaskFilter] = useState<MyTaskFilter>('active');
  const [search, setSearch] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<'create' | 'join' | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [completionTask, setCompletionTask] = useState<Task | null>(null);
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const currentGroup = groups.find((group) => group.id === selectedGroupId);
  const currentMember = members.find((member) => user
    ? member.id === user.id
    : member.role === 'Trưởng nhóm');
  const isManager = supabaseConfigured ? currentGroup?.role === 'manager' : true;

  const loadActivityLogs = useCallback(async (groupId: string, manager: boolean) => {
    if (groupId !== selectedGroupId) return;
    if (!manager) {
      setActivityLogs([]);
      return;
    }
    setActivityLogs([]);
    try {
      const nextLogs = await listActivityLogs(groupId);
      if (groupId === selectedGroupId) setActivityLogs(nextLogs);
    } catch (caught) {
      if (groupId === selectedGroupId) {
        setError(caught instanceof Error ? caught.message : 'Không thể tải nhật ký nhóm.');
      }
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (!user || !supabaseConfigured) return;
    let active = true;
    listGroups(user.id)
      .then((nextGroups) => {
        if (!active) return;
        setGroups(nextGroups);
        const savedGroupId = window.localStorage.getItem(`teamflow.active-group.${user.id}`);
        setSelectedGroupId((current) => {
          if (nextGroups.some((group) => group.id === current)) return current;
          if (savedGroupId && nextGroups.some((group) => group.id === savedGroupId)) return savedGroupId;
          return nextGroups[0]?.id || '';
        });
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Không thể tải danh sách nhóm.');
      });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (user && selectedGroupId) {
      window.localStorage.setItem(`teamflow.active-group.${user.id}`, selectedGroupId);
    }
  }, [selectedGroupId, user]);

  const loadData = useCallback(async () => {
    if (supabaseConfigured && !selectedGroupId) {
      setTasks([]);
      setMembers([]);
      setActivityLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setActivityLogs([]);
    try {
      const [nextTasks, nextMembers] = await Promise.all([
        listTasks(selectedGroupId || undefined),
        listMembers(selectedGroupId || undefined),
      ]);
      setTasks(nextTasks);
      setMembers(nextMembers);
      await loadActivityLogs(selectedGroupId, isManager);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể tải dữ liệu nhóm.');
    } finally {
      setLoading(false);
    }
  }, [isManager, loadActivityLogs, selectedGroupId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi');
    return tasks
      .filter((task) => filter === 'all' || task.status === filter)
      .filter((task) => !query || `${task.title} ${task.description} ${task.prerequisites || ''} ${task.input || ''} ${task.output || ''} ${task.assigneeName}`.toLocaleLowerCase('vi').includes(query))
      .sort((a, b) => {
        const completionOrder = Number(a.status === 'done') - Number(b.status === 'done');
        return completionOrder || (sortAscending ? 1 : -1) * a.dueDate.localeCompare(b.dueDate);
      });
  }, [filter, search, sortAscending, tasks]);

  const myTasks = useMemo(() => tasks
    .filter((task) => task.assigneeId === currentMember?.id)
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done') || a.title.localeCompare(b.title, 'vi')),
  [currentMember, tasks]);
  const visibleMyTasks = useMemo(() => myTasks.filter((task) => (
    myTaskFilter === 'done' ? task.status === 'done' : task.status !== 'done'
  )), [myTaskFilter, myTasks]);

  const taskCounts = useMemo(() => {
    const counts: Record<ViewFilter, number> = {
      all: tasks.length,
      todo: 0,
      in_progress: 0,
      done: 0,
    };
    tasks.forEach((task) => { counts[task.status] += 1; });
    return counts;
  }, [tasks]);

  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

  async function handleCreateTask(task: NewTask) {
    try {
      const created = await createTask(task, selectedGroupId || undefined);
      setTasks((current) => [created, ...current]);
      if (currentGroup && isManager) void loadActivityLogs(currentGroup.id, isManager);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể giao công việc.');
      throw caught;
    }
  }

  async function handleUpdateStatus(task: Task, status: TaskStatus, completionReport?: string): Promise<boolean> {
    setSavingTaskId(task.id);
    setError('');
    try {
      const updated = await updateTask(task.id, { status, completionReport }, selectedGroupId || undefined);
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
      if (status === 'done') {
        setFilter('done');
        if (task.assigneeId === currentMember?.id) setMyTaskFilter('done');
      } else if (task.status === 'done' && task.assigneeId === currentMember?.id) {
        setMyTaskFilter('active');
      }
      if (currentGroup && isManager) void loadActivityLogs(currentGroup.id, isManager);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể cập nhật trạng thái.');
      return false;
    } finally {
      setSavingTaskId(null);
    }
  }

  function requestStatusChange(task: Task, status: TaskStatus) {
    if (status === 'done' && task.status !== 'done') {
      setCompletionTask(task);
      setError('');
      return;
    }
    void handleUpdateStatus(task, status);
  }

  async function handleCompletionReport(report: string): Promise<boolean> {
    if (!completionTask) return false;
    const saved = await handleUpdateStatus(completionTask, 'done', report);
    if (saved) setCompletionTask(null);
    return saved;
  }

  async function handleGroupAction(value: string) {
    const group = groupModalMode === 'create'
      ? await createGroup(value)
      : await joinGroup(value);
    setGroups((current) => [group, ...current.filter((item) => item.id !== group.id)]);
    setSelectedGroupId(group.id);
    setTasks([]);
    setMembers([]);
    setActivityLogs([]);
    setFilter('all');
  }

  async function handleDeleteGroup() {
    if (!currentGroup || !isManager) return;
    const confirmed = window.confirm(
      `Xóa vĩnh viễn nhóm "${currentGroup.name}"? Tất cả công việc, thành viên và nhật ký của nhóm cũng sẽ bị xóa. Thao tác này không thể hoàn tác.`,
    );
    if (!confirmed) return;

    setError('');
    try {
      await deleteGroup(currentGroup.id);
      const remainingGroups = groups.filter((group) => group.id !== currentGroup.id);
      setGroups(remainingGroups);
      setSelectedGroupId(remainingGroups[0]?.id || '');
      setTasks([]);
      setMembers([]);
      setActivityLogs([]);
      if (user) {
        if (remainingGroups.length) {
          window.localStorage.setItem(`teamflow.active-group.${user.id}`, remainingGroups[0].id);
        } else {
          window.localStorage.removeItem(`teamflow.active-group.${user.id}`);
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể xóa nhóm.');
    }
  }

  async function handleRemoveMember(memberId: string, transferToId: string | null, deleteOpenTasks: boolean) {
    if (!currentGroup || !isManager) throw new Error('Chỉ trưởng nhóm mới có quyền xóa thành viên.');
    await removeGroupMember(currentGroup.id, memberId, transferToId, deleteOpenTasks);
    await loadData();
  }

  async function handleTransferManager(targetUserId: string) {
    if (!currentGroup || !isManager) throw new Error('Chỉ trưởng nhóm mới có thể chuyển quyền.');
    await transferGroupManager(currentGroup.id, targetUserId);
    setGroups((current) => current.map((group) => group.id === currentGroup.id
      ? { ...group, role: 'member' }
      : group));
    setMembers((current) => current.map((member) => ({
      ...member,
      isManager: member.id === targetUserId,
      role: member.id === targetUserId ? 'Trưởng nhóm' : member.id === user?.id ? 'Thành viên' : member.role,
    })));
    setActivityLogs([]);
  }

  async function handleLeaveGroup(transferToId: string | null) {
    if (!currentGroup || !user) throw new Error('Không tìm thấy nhóm hoặc tài khoản hiện tại.');
    if (isManager) throw new Error('Hãy chuyển quyền trưởng nhóm trước khi rời nhóm.');
    await leaveGroup(currentGroup.id, transferToId);
    const remainingGroups = groups.filter((group) => group.id !== currentGroup.id);
    setGroups(remainingGroups);
    setSelectedGroupId(remainingGroups[0]?.id || '');
    setTasks([]);
    setMembers([]);
    setActivityLogs([]);
    setShowMembersModal(false);
    if (remainingGroups.length) {
      window.localStorage.setItem(`teamflow.active-group.${user.id}`, remainingGroups[0].id);
    } else {
      window.localStorage.removeItem(`teamflow.active-group.${user.id}`);
    }
  }

  const canUpdateTask = (task: Task) => !supabaseConfigured
    || Boolean(user && (user.id === task.assigneeId || currentMember?.isManager));

  return (
    <div className="app-shell">
      <main className="main-content">
        <div className="page-content">
          {error && (
            <NotificationBanner
              message={error}
              onRetry={() => void loadData()}
              onDismiss={() => setError('')}
            />
          )}
          <section className="welcome-row">
            <div className="welcome-header-content">
              {supabaseConfigured && !groups.length && (
                <div className="demo-banner"><span className="demo-dot" /><span><strong>Bạn chưa có nhóm</strong> · Tạo nhóm mới hoặc nhập mã mời để bắt đầu.</span></div>
              )}
              {!supabaseConfigured && (
                <div className="demo-banner"><span className="demo-dot" /><span><strong>Đang dùng dữ liệu mẫu</strong> · Thông tin chỉ lưu trên trình duyệt này, chưa chia sẻ với nhóm.</span></div>
              )}
              {user && supabaseConfigured && (
                <div className="welcome-actions group-switcher">
                <div className="header-action-row group-management-row" aria-label="Thao tác tài khoản và nhóm">
                  <button className="outline-button header-action" onClick={() => setGroupModalMode('create')}><Icon name="plus" />Tạo nhóm</button>
                  <button className="outline-button header-action" onClick={() => setGroupModalMode('join')}><Icon name="key" />Tham gia nhóm</button>
                  {onSignOut && <button className="header-signout header-action" onClick={() => setShowAccountModal(true)}><Icon name="user" />QLTK</button>}
                  {onSignOut && <button className="header-signout header-action" onClick={onSignOut}><Icon name="logout" />Đăng xuất</button>}
                </div>
                <div className="header-action-row group-actions-row" aria-label="Thao tác trong nhóm">
                  {groups.length > 0 && (
                    <label className="group-select-label">
                      <select
                        className="header-action"
                        aria-label="Danh sách nhóm"
                        value={selectedGroupId}
                        onChange={(event) => {
                          setSelectedGroupId(event.target.value);
                          setTasks([]);
                          setMembers([]);
                          setActivityLogs([]);
                          setFilter('all');
                        }}
                      >
                        {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                      </select>
                    </label>
                  )}
                  {currentGroup && isManager && (
                    <button className="danger-button header-action" onClick={() => void handleDeleteGroup()}>
                      <Icon name="trash" />Xóa nhóm
                    </button>
                  )}
                  {currentGroup && <button className="outline-button header-action" onClick={() => setShowInviteModal(true)}><Icon name="invite" />Mã mời</button>}
                  {currentGroup && <button className="outline-button header-action" onClick={() => setShowMembersModal(true)}><Icon name="team" />Thành viên</button>}
                  {isManager && currentGroup && <button className="primary-button create-button header-action" onClick={() => setShowTaskModal(true)} disabled={!members.length}>
                    <Icon name="plus" />Giao việc mới
                  </button>}
                </div>
              </div>
              )}
            </div>
          </section>

          <section className="today-section today-card" aria-label="Việc của tôi">
            <h2>Việc của tôi</h2>
            <div className="my-task-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="Lọc việc của tôi">
                <button type="button" role="tab" aria-selected={myTaskFilter === 'active'} className={myTaskFilter === 'active' ? 'selected' : ''} onClick={() => setMyTaskFilter('active')}>
                  Đang làm<span>{myTasks.filter((task) => task.status !== 'done').length}</span>
                </button>
                <button type="button" role="tab" aria-selected={myTaskFilter === 'done'} className={myTaskFilter === 'done' ? 'selected' : ''} onClick={() => setMyTaskFilter('done')}>
                  Đã hoàn thành<span>{myTasks.filter((task) => task.status === 'done').length}</span>
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
              ) : visibleMyTasks.length ? visibleMyTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  assignee={membersById.get(task.assigneeId)}
                  isSaving={savingTaskId === task.id}
                  canUpdateStatus={canUpdateTask(task)}
                  onStatusChange={requestStatusChange}
                  onViewDetails={setDetailsTask}
                  workflow
                />
              )) : <div className="today-empty">{myTaskFilter === 'done' ? 'Chưa có công việc đã hoàn thành' : 'Chưa có công việc cần làm'}</div>}
            </div>
          </section>

          {isManager && <section className="tasks-section">
            <div className="section-heading">
              <h2>Danh sách công việc</h2>
              <label className="search-box">
                <Icon name="search" size={20} />
                <input aria-label="Tìm công việc" placeholder="Tìm tên việc hoặc người phụ trách" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
            </div>
            <div className="task-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="Lọc danh sách công việc">
                {taskFilters.map(([key, label]) => (
                  <button key={key} role="tab" aria-selected={filter === key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>
                    {label}<span>{taskCounts[key]}</span>
                  </button>
                ))}
              </div>
              <button className="sort-button" onClick={() => setSortAscending((current) => !current)}><Icon name="calendar" size={18} /><span>{sortAscending ? 'Hạn gần trước' : 'Hạn xa trước'}</span></button>
            </div>
            <div className="task-list team-task-list">
              <div className="task-list-header team-task-header">
                <span>TÊN CÔNG VIỆC</span>
              </div>
              {loading ? (
                <div className="task-empty" role="status"><span className="loading-spinner" />Đang tải công việc...</div>
              ) : filteredTasks.length ? filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  assignee={membersById.get(task.assigneeId)}
                  isSaving={savingTaskId === task.id}
                  canUpdateStatus={canUpdateTask(task)}
                  onStatusChange={requestStatusChange}
                  onViewDetails={setDetailsTask}
                  workflow
                  showAssignee
                />
              )) : (
                <div className="task-empty"><span className="empty-illustration"><Icon name="tasks" size={28} /></span><strong>Chưa có công việc phù hợp</strong><span>Hãy đổi mục lọc hoặc bấm “Giao việc mới” để tạo việc.</span></div>
              )}
            </div>
            <div className="list-footer">
              <span>Đang hiển thị <strong>{filteredTasks.length}</strong> / <strong>{tasks.length}</strong> công việc</span>
              <span className="live-indicator"><i />{supabaseConfigured ? 'Đã đồng bộ' : 'Chỉ lưu trên thiết bị này'}</span>
            </div>
          </section>}
          {supabaseConfigured && currentGroup && isManager && (
            <section className="activity-section" aria-labelledby="activity-heading">
              <div className="activity-heading">
                <div>
                  <span className="eyebrow">THEO DÕI HOẠT ĐỘNG</span>
                  <h2 id="activity-heading">Nhật ký nhóm</h2>
                </div>
                <button className="secondary-button" onClick={() => void loadActivityLogs(currentGroup.id, isManager)}>
                  Làm mới
                </button>
              </div>
              {activityLogs.length ? (
                <div className="activity-table-wrap">
                  <table className="activity-table">
                    <thead><tr><th>Thời gian</th><th>Hoạt động</th><th>Người thực hiện</th><th>Chi tiết</th></tr></thead>
                    <tbody>
                      {activityLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                          <td>{activityLabel(log.eventType)}</td>
                          <td>{log.actorName}</td>
                          <td>{log.subject}{log.details ? ` · ${log.details}` : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="activity-empty">Chưa có hoạt động nào được ghi nhận.</p>}
            </section>
          )}
          <footer className="page-footer"><span>© 2026 Teamflow</span><span>Dùng bộ lọc phía trên để tìm công việc.</span></footer>
        </div>
      </main>
      {showTaskModal && <TaskModal members={members} onClose={() => setShowTaskModal(false)} onSubmit={handleCreateTask} />}
      {groupModalMode && <GroupModal mode={groupModalMode} onClose={() => setGroupModalMode(null)} onSubmit={handleGroupAction} />}
      {showInviteModal && currentGroup && <InviteCodeModal group={currentGroup} onClose={() => setShowInviteModal(false)} />}
      {showMembersModal && currentGroup && user && (
        <MembersModal
          groupId={currentGroup.id}
          groupName={currentGroup.name}
          members={members}
          tasks={tasks}
          currentUserId={user.id}
          isManager={isManager}
          onRemoveMember={handleRemoveMember}
          onLeaveGroup={handleLeaveGroup}
          onTransferManager={handleTransferManager}
          onClose={() => setShowMembersModal(false)}
        />
      )}
      {showAccountModal && user && <AccountModal user={user} member={currentMember} onClose={() => setShowAccountModal(false)} />}
      {completionTask && <CompletionReportModal task={completionTask} onClose={() => setCompletionTask(null)} onSubmit={handleCompletionReport} />}
      {detailsTask && <TaskDetailsModal task={detailsTask} onClose={() => setDetailsTask(null)} />}
    </div>
  );
}
