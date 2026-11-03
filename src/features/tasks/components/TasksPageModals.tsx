import { AppUser } from '../../../api/supabaseAuth';
import {
  AccountModal,
  CompletionReportModal,
  ConfirmationModal,
  GroupModal,
  InviteCodeModal,
  MembersModal,
  TaskDetailsModal,
  TaskModal,
} from './TaskDialogs';
import { TeamGroup } from '../../groups/groupTypes';
import { TeamMember } from '../../members/memberTypes';
import { NewTask, Task } from '../taskTypes';

type Props = {
  showTaskModal: boolean;
  showDeleteGroupConfirm: boolean;
  groupModalMode: 'create' | 'join' | null;
  showInviteModal: boolean;
  showMembersModal: boolean;
  showAccountModal: boolean;
  completionTask: Task | null;
  detailsTask: Task | null;
  currentGroup?: TeamGroup;
  user: AppUser | null;
  currentMember?: TeamMember;
  members: TeamMember[];
  tasks: Task[];
  isManager: boolean;
  onCloseTask: () => void;
  onCloseDeleteGroupConfirm: () => void;
  onConfirmDeleteGroup: () => Promise<void>;
  onGroupAction: (value: string) => Promise<void>;
  onCloseGroup: () => void;
  onCloseInvite: () => void;
  onRemoveMember: (memberId: string, transferToId: string | null, deleteOpenTasks: boolean) => Promise<void>;
  onLeaveGroup: (transferToId: string | null) => Promise<void>;
  onTransferManager: (targetUserId: string) => Promise<void>;
  onCloseMembers: () => void;
  onCloseAccount: () => void;
  onCloseCompletion: () => void;
  onCompletionReport: (report: string) => Promise<boolean>;
  onCloseDetails: () => void;
  onCreateTask: (task: NewTask) => Promise<void>;
};

export function TasksPageModals({
  showTaskModal,
  showDeleteGroupConfirm,
  groupModalMode,
  showInviteModal,
  showMembersModal,
  showAccountModal,
  completionTask,
  detailsTask,
  currentGroup,
  user,
  currentMember,
  members,
  tasks,
  isManager,
  onCloseTask,
  onCloseDeleteGroupConfirm,
  onConfirmDeleteGroup,
  onGroupAction,
  onCloseGroup,
  onCloseInvite,
  onRemoveMember,
  onLeaveGroup,
  onTransferManager,
  onCloseMembers,
  onCloseAccount,
  onCloseCompletion,
  onCompletionReport,
  onCloseDetails,
  onCreateTask,
}: Props) {
  return (
    <>
      {showTaskModal && <TaskModal members={members} onClose={onCloseTask} onSubmit={onCreateTask} />}
      {showDeleteGroupConfirm && currentGroup && (
        <ConfirmationModal
          title={`Xóa nhóm "${currentGroup.name}"?`}
          message="Tất cả công việc, thành viên và nhật ký của nhóm cũng sẽ bị xóa. Thao tác này không thể hoàn tác."
          confirmLabel="Xóa nhóm"
          onClose={onCloseDeleteGroupConfirm}
          onConfirm={onConfirmDeleteGroup}
        />
      )}
      {groupModalMode && <GroupModal mode={groupModalMode} onClose={onCloseGroup} onSubmit={onGroupAction} />}
      {showInviteModal && currentGroup && <InviteCodeModal group={currentGroup} onClose={onCloseInvite} />}
      {showMembersModal && currentGroup && user && (
        <MembersModal
          groupId={currentGroup.id}
          groupName={currentGroup.name}
          members={members}
          tasks={tasks}
          currentUserId={user.id}
          isManager={isManager}
          onRemoveMember={onRemoveMember}
          onLeaveGroup={onLeaveGroup}
          onTransferManager={onTransferManager}
          onClose={onCloseMembers}
        />
      )}
      {showAccountModal && user && <AccountModal user={user} member={currentMember} onClose={onCloseAccount} />}
      {completionTask && <CompletionReportModal task={completionTask} onClose={onCloseCompletion} onSubmit={onCompletionReport} />}
      {detailsTask && <TaskDetailsModal task={detailsTask} onClose={onCloseDetails} />}
    </>
  );
}
