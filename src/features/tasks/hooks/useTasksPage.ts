import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppUser } from '../../../api/supabaseAuth';
import { createGroup, deleteGroup, joinGroup, listGroups } from '../../groups/groupsApi';
import { TeamGroup } from '../../groups/groupTypes';
import { listActivityLogs } from '../../activity/activityApi';
import { ActivityLog } from '../../activity/activityTypes';
import { leaveGroup, listMembers, removeGroupMember, transferGroupManager } from '../../members/membersApi';
import { TeamMember } from '../../members/memberTypes';
import { createTask, listTasks, updateTask } from '../tasksApi';
import { MyTaskFilter, NewTask, Task, TaskCounts, TaskStatus, TaskViewFilter } from '../taskTypes';

export function useTasksPage(user: AppUser) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [filter, setFilter] = useState<TaskViewFilter>('all');
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const dataRequestId = useRef(0);

  const currentGroup = groups.find((group) => group.id === selectedGroupId);
  const currentMember = members.find((member) => member.id === user.id);
  const isManager = currentGroup?.role === 'manager';

  const loadActivityLogs = useCallback(async (groupId: string, manager: boolean, requestId = dataRequestId.current) => {
    if (groupId !== selectedGroupId || requestId !== dataRequestId.current) return;
    if (!manager) {
      setActivityLogs([]);
      return;
    }
    try {
      const nextLogs = await listActivityLogs(groupId);
      if (groupId === selectedGroupId && requestId === dataRequestId.current) setActivityLogs(nextLogs);
    } catch (caught) {
      if (groupId === selectedGroupId && requestId === dataRequestId.current) {
        setError(caught instanceof Error ? caught.message : 'Không thể tải nhật ký nhóm.');
      }
    }
  }, [selectedGroupId]);

  useEffect(() => {
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
      })
      .finally(() => {
        if (active) setGroupsLoaded(true);
      });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (selectedGroupId) {
      window.localStorage.setItem(`teamflow.active-group.${user.id}`, selectedGroupId);
    }
  }, [selectedGroupId, user]);

  const loadData = useCallback(async () => {
    if (!groupsLoaded) return;
    const requestId = ++dataRequestId.current;
    if (!selectedGroupId) {
      setTasks([]);
      setMembers([]);
      setActivityLogs([]);
      setLoading(false);
      setInitialLoading(false);
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
      if (requestId !== dataRequestId.current) return;
      setTasks(nextTasks);
      setMembers(nextMembers);
      await loadActivityLogs(selectedGroupId, isManager, requestId);
    } catch (caught) {
      if (requestId === dataRequestId.current) {
        setError(caught instanceof Error ? caught.message : 'Không thể tải dữ liệu nhóm.');
      }
    } finally {
      if (requestId === dataRequestId.current) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  }, [groupsLoaded, isManager, loadActivityLogs, selectedGroupId, user]);

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
  const taskCounts = useMemo(() => {
    const counts: TaskCounts = { all: tasks.length, todo: 0, in_progress: 0, done: 0 };
    tasks.forEach((task) => { counts[task.status] += 1; });
    return counts;
  }, [tasks]);

  async function handleCreateTask(task: NewTask) {
    try {
      const created = await createTask(task, selectedGroupId || undefined);
      setTasks((current) => [created, ...current]);
      if (selectedGroupId && isManager) void loadActivityLogs(selectedGroupId, isManager);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể giao công việc.');
      throw caught;
    }
  }

  const handleUpdateStatus = useCallback(async (task: Task, status: TaskStatus, completionReport?: string): Promise<boolean> => {
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
      if (selectedGroupId && isManager) void loadActivityLogs(selectedGroupId, isManager);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể cập nhật trạng thái.');
      return false;
    } finally {
      setSavingTaskId(null);
    }
  }, [currentMember?.id, isManager, loadActivityLogs, selectedGroupId]);

  const requestStatusChange = useCallback((task: Task, status: TaskStatus) => {
    if (status === 'done' && task.status !== 'done') {
      setCompletionTask(task);
      setError('');
      return;
    }
    void handleUpdateStatus(task, status);
  }, [handleUpdateStatus]);

  const handleCompletionReport = useCallback(async (report: string): Promise<boolean> => {
    if (!completionTask) return false;
    const saved = await handleUpdateStatus(completionTask, 'done', report);
    if (saved) setCompletionTask(null);
    return saved;
  }, [completionTask, handleUpdateStatus]);

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
      role: member.id === targetUserId ? 'Trưởng nhóm' : member.id === user.id ? 'Thành viên' : member.role,
    })));
    setActivityLogs([]);
  }

  async function handleLeaveGroup(transferToId: string | null) {
    if (!currentGroup) throw new Error('Không tìm thấy nhóm hiện tại.');
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

  const canUpdateTask = useCallback((task: Task) => (
    user.id === task.assigneeId || Boolean(currentMember?.isManager)
  ), [currentMember?.isManager, user.id]);
  const toggleSortOrder = useCallback(() => setSortAscending((current) => !current), []);

  return {
    tasks,
    activityLogs,
    members,
    groups,
    selectedGroupId,
    setSelectedGroupId,
    filter,
    setFilter,
    myTaskFilter,
    setMyTaskFilter,
    search,
    setSearch,
    sortAscending,
    showTaskModal,
    setShowTaskModal,
    showAccountModal,
    setShowAccountModal,
    showMembersModal,
    setShowMembersModal,
    groupModalMode,
    setGroupModalMode,
    showInviteModal,
    setShowInviteModal,
    completionTask,
    setCompletionTask,
    detailsTask,
    setDetailsTask,
    loading,
    initialLoading,
    savingTaskId,
    error,
    setError,
    currentGroup,
    currentMember,
    isManager,
    filteredTasks,
    myTasks,
    taskCounts,
    loadData,
    loadActivityLogs,
    handleCreateTask,
    requestStatusChange,
    handleCompletionReport,
    handleGroupAction,
    handleDeleteGroup,
    handleRemoveMember,
    handleLeaveGroup,
    handleTransferManager,
    canUpdateTask,
    toggleSortOrder,
  };
}
