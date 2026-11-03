import type { ReactNode } from 'react';
import { AppUser } from '../../../api/supabaseAuth';
import { LoadingScreen } from '../../../components/LoadingScreen';
import { ActivityLogSection } from '../../activity/components/ActivityLogSection';
import { NotificationBanner } from '../../notifications/NotificationBanner';
import { useTasksPage } from '../hooks/useTasksPage';
import { GroupTasksSection, MyTasksSection } from '../components/TaskSections';
import { TasksPageHeader } from '../components/TasksPageHeader';
import { TasksPageModals } from '../components/TasksPageModals';
import { TaskNotificationControls } from '../../notifications/TaskNotificationControls';

type Props = {
  user: AppUser;
  installButton: ReactNode;
  onSignOut: () => void;
};

export function TasksPage({ user, installButton, onSignOut }: Props) {
  const page = useTasksPage(user);

  if (page.initialLoading) {
    return <LoadingScreen message="Đang tải dữ liệu công việc..." />;
  }

  return (
    <Container fluid className="app-page">
      <main>
        <Stack gap="lg">
          {page.error && (
            <NotificationBanner
              message={page.error}
              onRetry={() => void page.loadData()}
              onDismiss={() => page.setError('')}
            />
          )}
          <TasksPageHeader
            installButton={installButton}
            groups={page.groups}
            members={page.members}
            selectedGroupId={page.selectedGroupId}
            currentGroup={page.currentGroup}
            isManager={page.isManager}
            onSignOut={onSignOut}
            onCreateGroup={() => page.setGroupModalMode('create')}
            onJoinGroup={() => page.setGroupModalMode('join')}
            onShowAccount={() => page.setShowAccountModal(true)}
            onSelectGroup={(groupId) => {
              page.setSelectedGroupId(groupId);
              page.setFilter('all');
            }}
            onDeleteGroup={() => page.setShowDeleteGroupConfirm(true)}
            onShowInvite={() => page.setShowInviteModal(true)}
            onShowMembers={() => page.setShowMembersModal(true)}
            onCreateTask={() => page.setShowTaskModal(true)}
          />
          <TaskNotificationControls userId={user.id} />

          <MyTasksSection
            tasks={page.myTasks}
            filter={page.myTaskFilter}
            onFilterChange={page.setMyTaskFilter}
            loading={page.loading}
            savingTaskId={page.savingTaskId}
            canUpdateTask={page.canUpdateTask}
            onStatusChange={page.requestStatusChange}
            onViewDetails={page.setDetailsTask}
          />

          {page.isManager && (
            <GroupTasksSection
              tasks={page.filteredTasks}
              totalTasks={page.tasks.length}
              counts={page.taskCounts}
              filter={page.filter}
              onFilterChange={page.setFilter}
              search={page.search}
              onSearchChange={page.setSearch}
              sortAscending={page.sortAscending}
              onSortToggle={page.toggleSortOrder}
              loading={page.loading}
              onViewDetails={page.setDetailsTask}
            />
          )}
          {page.currentGroup && page.isManager && (
            <ActivityLogSection
              logs={page.activityLogs}
              onRefresh={() => void page.loadActivityLogs(page.currentGroup!.id, page.isManager)}
            />
          )}
          <Group component="footer" justify="space-between" gap="xs" pt="xs">
            <Text size="xs" c="dimmed">© 2026 Teamflow</Text>
            <Text size="xs" c="dimmed">Dùng bộ lọc phía trên để tìm công việc.</Text>
          </Group>
        </Stack>
      </main>
      <TasksPageModals
        showTaskModal={page.showTaskModal}
        showDeleteGroupConfirm={page.showDeleteGroupConfirm}
        groupModalMode={page.groupModalMode}
        showInviteModal={page.showInviteModal}
        showMembersModal={page.showMembersModal}
        showAccountModal={page.showAccountModal}
        completionTask={page.completionTask}
        detailsTask={page.detailsTask}
        currentGroup={page.currentGroup}
        user={user}
        currentMember={page.currentMember}
        members={page.members}
        tasks={page.tasks}
        isManager={page.isManager}
        onCloseTask={() => page.setShowTaskModal(false)}
        onCloseDeleteGroupConfirm={() => page.setShowDeleteGroupConfirm(false)}
        onConfirmDeleteGroup={page.handleDeleteGroup}
        onGroupAction={page.handleGroupAction}
        onCloseGroup={() => page.setGroupModalMode(null)}
        onCloseInvite={() => page.setShowInviteModal(false)}
        onRemoveMember={page.handleRemoveMember}
        onLeaveGroup={page.handleLeaveGroup}
        onTransferManager={page.handleTransferManager}
        onCloseMembers={() => page.setShowMembersModal(false)}
        onCloseAccount={() => page.setShowAccountModal(false)}
        onCloseCompletion={() => page.setCompletionTask(null)}
        onCompletionReport={page.handleCompletionReport}
        onCloseDetails={() => page.setDetailsTask(null)}
        onCreateTask={page.handleCreateTask}
      />
    </Container>
  );
}
import { Container, Group, Stack, Text } from '@mantine/core';
