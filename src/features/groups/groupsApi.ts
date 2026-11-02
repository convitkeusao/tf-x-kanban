import { requireSupabase } from '../../api/requireSupabase';
import { TeamGroup } from './groupTypes';

type GroupMembershipRow = {
  group_id: string;
  role: TeamGroup['role'];
  groups: { id: string; name: string; invite_code: string } | { id: string; name: string; invite_code: string }[];
};

function mapGroup(row: GroupMembershipRow): TeamGroup {
  const group = Array.isArray(row.groups) ? row.groups[0] : row.groups;
  if (!group) throw new Error('Không tìm thấy thông tin nhóm.');
  return { id: group.id, name: group.name, inviteCode: group.invite_code, role: row.role };
}

export async function listGroups(userId: string): Promise<TeamGroup[]> {
  const { data, error } = await requireSupabase()
    .from('group_members')
    .select('group_id,role,groups(id,name,invite_code)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Không thể tải danh sách nhóm: ${error.message}`);
  return (data as GroupMembershipRow[]).map(mapGroup);
}

async function groupRpc(
  name: 'create_group' | 'join_group',
  args: Record<string, string>,
): Promise<TeamGroup> {
  const { data, error } = await requireSupabase().rpc(name, args);
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id || !row?.name || !row?.invite_code || !row?.role) {
    throw new Error('Supabase không trả về thông tin nhóm hợp lệ.');
  }
  return { id: row.id, name: row.name, inviteCode: row.invite_code, role: row.role };
}

export async function createGroup(name: string): Promise<TeamGroup> {
  return groupRpc('create_group', { p_name: name.trim() });
}

export async function joinGroup(inviteCode: string): Promise<TeamGroup> {
  return groupRpc('join_group', { p_invite_code: inviteCode.trim().toUpperCase() });
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await requireSupabase().rpc('delete_group', { p_group_id: groupId });
  if (error) throw error;
}
