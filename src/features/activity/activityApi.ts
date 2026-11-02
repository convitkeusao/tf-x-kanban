import { requireSupabase } from '../../api/requireSupabase';
import { ActivityLog } from './activityTypes';

type ActivityLogRow = {
  id: string;
  event_type: ActivityLog['eventType'];
  actor_name: string;
  subject: string;
  details: string | null;
  created_at: string;
};

export async function listActivityLogs(groupId?: string): Promise<ActivityLog[]> {
  if (!groupId) return [];

  const { data, error } = await requireSupabase()
    .from('activity_logs')
    .select('id,event_type,actor_name,subject,details,created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ActivityLogRow[]).map((row) => ({
    id: row.id,
    eventType: row.event_type,
    actorName: row.actor_name,
    subject: row.subject,
    details: row.details,
    createdAt: row.created_at,
  }));
}
