import { requireSupabase } from '../../api/requireSupabase';
import { supabaseConfigured } from '../../api/supabaseClient';
import { readLocalData } from '../../shared/localStorage';
import { demoMembers } from '../../shared/demoData';
import { TeamGroup } from '../groups/groupTypes';
import { TeamMember } from './memberTypes';

const membersStorageKey = 'teamflow.demo.members';

type ProfileRow = {
  id: string;
  name: string;
  role: string;
  color: string;
  email: string | null;
  is_manager: boolean;
};

type GroupMemberRow = {
  user_id: string;
  role: TeamGroup['role'];
  created_at: string;
  profiles: Pick<ProfileRow, 'id' | 'name' | 'email' | 'color'> | Pick<ProfileRow, 'id' | 'name' | 'email' | 'color'>[];
};

function mapMember(row: ProfileRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    color: row.color,
    email: row.email || undefined,
    isManager: row.is_manager,
  };
}

export async function listMembers(groupId?: string): Promise<TeamMember[]> {
  if (!supabaseConfigured) return readLocalData(membersStorageKey, demoMembers);
  if (!groupId) return [];

  const { data, error } = await requireSupabase()
    .from('group_members')
    .select('user_id,role,created_at,profiles(id,name,email,color)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as GroupMemberRow[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!profile) throw new Error('Không tìm thấy hồ sơ của thành viên trong nhóm.');
    return {
      ...mapMember({
        ...profile,
        role: row.role === 'manager' ? 'Trưởng nhóm' : 'Thành viên',
        is_manager: row.role === 'manager',
      }),
      id: row.user_id,
      isManager: row.role === 'manager',
      joinedAt: row.created_at,
    };
  });
}

export async function removeGroupMember(
  groupId: string,
  memberId: string,
  transferToId: string | null,
  deleteOpenTasks: boolean,
): Promise<void> {
  const { error } = await requireSupabase().rpc('remove_group_member', {
    p_group_id: groupId,
    p_user_id: memberId,
    p_reassign_to_user_id: transferToId,
    p_delete_open_tasks: deleteOpenTasks,
  });
  if (error) throw error;
}

export async function leaveGroup(groupId: string, transferToId: string | null): Promise<void> {
  const { error } = await requireSupabase().rpc('leave_group', {
    p_group_id: groupId,
    p_reassign_to_user_id: transferToId,
  });
  if (error) throw error;
}

export async function transferGroupManager(groupId: string, targetUserId: string): Promise<void> {
  const { error } = await requireSupabase().rpc('transfer_group_manager', {
    p_group_id: groupId,
    p_new_manager_id: targetUserId,
  });
  if (error) throw error;
}
