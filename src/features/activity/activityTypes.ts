export type ActivityLog = {
  id: string;
  eventType:
    | 'group_created'
    | 'task_created'
    | 'task_completed'
    | 'task_status_changed'
    | 'task_reassigned'
    | 'task_deleted'
    | 'member_removed'
    | 'member_left'
    | 'manager_transferred';
  actorName: string;
  subject: string;
  details: string | null;
  createdAt: string;
};
