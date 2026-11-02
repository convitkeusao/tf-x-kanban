import { Alert, Button, Group, Select, Stack } from '@mantine/core';
import { Icon } from '../../../components/Icon';
import { supabaseConfigured } from '../../../api/supabaseClient';
import { TeamGroup } from '../../groups/groupTypes';
import { TeamMember } from '../../members/memberTypes';
import { AppUser } from '../../../api/supabaseAuth';

type Props = {
  user: AppUser | null;
  groups: TeamGroup[];
  members: TeamMember[];
  selectedGroupId: string;
  currentGroup?: TeamGroup;
  isManager: boolean;
  onSignOut?: () => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
  onShowAccount: () => void;
  onSelectGroup: (groupId: string) => void;
  onDeleteGroup: () => void;
  onShowInvite: () => void;
  onShowMembers: () => void;
  onCreateTask: () => void;
};

export function TasksPageHeader({ user, groups, members, selectedGroupId, currentGroup, isManager, onSignOut, onCreateGroup, onJoinGroup, onShowAccount, onSelectGroup, onDeleteGroup, onShowInvite, onShowMembers, onCreateTask }: Props) {
  return (
    <Stack gap="md">
      {supabaseConfigured && !groups.length && <Alert color="yellow" title="Bạn chưa có nhóm">Tạo nhóm mới hoặc nhập mã mời để bắt đầu.</Alert>}
      {!supabaseConfigured && <Alert color="yellow" title="Đang dùng dữ liệu mẫu">Thông tin chỉ lưu trên trình duyệt này, chưa chia sẻ với nhóm.</Alert>}
      {user && supabaseConfigured && (
        <Stack gap="sm">
          <Group gap="xs" aria-label="Thao tác tài khoản và nhóm">
            <Button variant="default" leftSection={<Icon name="plus" />} onClick={onCreateGroup}>Tạo nhóm</Button>
            <Button variant="default" leftSection={<Icon name="key" />} onClick={onJoinGroup}>Tham gia nhóm</Button>
            {onSignOut && <Button variant="subtle" leftSection={<Icon name="user" />} onClick={onShowAccount}>Tài khoản</Button>}
            {onSignOut && <Button variant="subtle" leftSection={<Icon name="logout" />} onClick={onSignOut}>Đăng xuất</Button>}
          </Group>
          <Group gap="xs" align="end" aria-label="Thao tác trong nhóm">
            {groups.length > 0 && <Select label="Nhóm" aria-label="Danh sách nhóm" w={{ base: '100%', sm: 280 }} data={groups.map((group) => ({ value: group.id, label: group.name }))} value={selectedGroupId} onChange={(value) => onSelectGroup(value || '')} />}
            {currentGroup && isManager && <Button color="red" variant="light" leftSection={<Icon name="trash" />} onClick={onDeleteGroup}>Xóa nhóm</Button>}
            {currentGroup && <Button variant="default" leftSection={<Icon name="invite" />} onClick={onShowInvite}>Mã mời</Button>}
            {currentGroup && <Button variant="default" leftSection={<Icon name="team" />} onClick={onShowMembers}>Thành viên</Button>}
            {isManager && currentGroup && <Button leftSection={<Icon name="plus" />} onClick={onCreateTask} disabled={!members.length}>Giao việc mới</Button>}
          </Group>
        </Stack>
      )}
    </Stack>
  );
}
