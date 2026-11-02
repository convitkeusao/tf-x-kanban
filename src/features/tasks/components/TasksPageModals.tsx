import { AppUser } from '../../../api/supabaseAuth';
import {
  AccountModal,
  CompletionReportModal,
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
