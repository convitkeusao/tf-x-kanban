import { Button, Group, Paper, ScrollArea, Table, Text, Title } from '@mantine/core';
import { ActivityLog } from '../activityTypes';

type Props = { logs: ActivityLog[]; onRefresh: () => void };

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

export function ActivityLogSection({ logs, onRefresh }: Props) {
  return (
    <Paper withBorder radius={0} style={{ overflow: 'hidden' }}>
      <Group justify="space-between" p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Title order={2} size="h3" id="activity-heading">Hoạt động</Title>
        <Button variant="default" size="xs" onClick={onRefresh}>Làm mới</Button>
      </Group>
      {logs.length ? (
        <ScrollArea>
          <Table striped highlightOnHover miw={640}>
            <Table.Thead><Table.Tr><Table.Th>Thời gian</Table.Th><Table.Th>Hoạt động</Table.Th><Table.Th>Người thực hiện</Table.Th><Table.Th>Chi tiết</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {logs.map((log) => (
                <Table.Tr key={log.id}>
                  <Table.Td>{new Date(log.createdAt).toLocaleString('vi-VN')}</Table.Td>
                  <Table.Td><Text c="violet.8" fw={600}>{activityLabel(log.eventType)}</Text></Table.Td>
                  <Table.Td>{log.actorName}</Table.Td>
                  <Table.Td>{log.subject}{log.details ? ` · ${log.details}` : ''}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      ) : <Text c="dimmed" size="sm" ta="center" py="xl">Chưa có hoạt động nào được ghi nhận.</Text>}
    </Paper>
  );
}
