import React, { FormEvent, useState } from 'react';
import { Alert, Avatar, Button, Group, Modal, Paper, Select, Stack, Text, TextInput, Textarea, Title } from '@mantine/core';
import { AppUser } from '../../../api/supabaseAuth';
import { Icon } from '../../../components/Icon';
import { TeamGroup } from '../../groups/groupTypes';
import { TeamMember } from '../../members/memberTypes';
import { NewTask, Task } from '../taskTypes';
import { formatDueDate, initials, localDateString } from '../taskUi';

type ModalProps = { onClose: () => void };
function ModalFrame({ children, onClose, size = 'md' }: ModalProps & { children: React.ReactNode; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  return <Modal opened onClose={onClose} centered size={size} radius={0} withCloseButton={false}>{children}</Modal>;
}

export function ConfirmationModal({ title, message, confirmLabel, onClose, onConfirm }: ModalProps & {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setSubmitting(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể hoàn tất thao tác.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalFrame onClose={onClose}>
      <Stack gap="md">
        <Title order={2} size="h3">{title}</Title>
        <Text size="sm">{message}</Text>
        {error && <Alert color="red" role="alert">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button color="red" onClick={() => void confirm()} loading={submitting}>{confirmLabel}</Button>
        </Group>
      </Stack>
    </ModalFrame>
  );
}

export function TaskModal({ members, onClose, onSubmit }: ModalProps & { members: TeamMember[]; onSubmit: (task: NewTask) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [assigneeId, setAssigneeId] = useState(members[0]?.id ?? '');
  const [dueDate, setDueDate] = useState(localDateString(new Date(Date.now() + 86400000 * 3)));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const assignee = members.find((member) => member.id === assigneeId);
    if (!title.trim() || !prerequisites.trim() || !input.trim() || !output.trim() || !assignee || !dueDate) { setFormError('Vui lòng điền đầy đủ các trường bắt buộc.'); return; }
    setSubmitting(true); setFormError('');
    try {
      await onSubmit({ title: title.trim(), description: input.trim(), prerequisites: prerequisites.trim(), input: input.trim(), output: output.trim(), assigneeId, assigneeName: assignee.name, status: 'todo', priority: 'medium', dueDate });
      onClose();
    } catch (caught) { setFormError(caught instanceof Error ? caught.message : 'Không thể giao công việc.'); }
    finally { setSubmitting(false); }
  }
  return (
    <ModalFrame onClose={onClose} size="lg">
      <form onSubmit={submit}><Stack gap="sm">
        <Title order={2} size="h3" id="task-modal-title">Giao việc cho thành viên</Title>
        <TextInput id="task-title" label="Việc cần làm" value={title} onChange={(event) => setTitle(event.currentTarget.value)} placeholder="Nhập tên công việc" maxLength={120} required autoFocus />
        <Textarea id="task-prerequisites" label="Yêu cầu tiên quyết" value={prerequisites} onChange={(event) => setPrerequisites(event.currentTarget.value)} minRows={2} required />
        <Textarea id="task-input" label="Đầu vào" value={input} onChange={(event) => setInput(event.currentTarget.value)} minRows={2} required />
        <Textarea id="task-output" label="Đầu ra" value={output} onChange={(event) => setOutput(event.currentTarget.value)} minRows={2} required />
        <Select id="task-assignee" label="Giao cho" value={assigneeId} onChange={(value) => setAssigneeId(value || '')} data={members.map((member) => ({ value: member.id, label: member.name }))} required />
        <TextInput id="task-due-date" label="Hạn cần hoàn thành" type="date" value={dueDate} onChange={(event) => setDueDate(event.currentTarget.value)} required />
        {formError && <Alert color="red" role="alert">{formError}</Alert>}
        <Group justify="flex-end"><Button variant="default" type="button" onClick={onClose}>Hủy</Button><Button type="submit" loading={submitting} disabled={!members.length}>Giao công việc</Button></Group>
      </Stack></form>
    </ModalFrame>
  );
}

export function GroupModal({ mode, onClose, onSubmit }: ModalProps & { mode: 'create' | 'join'; onSubmit: (value: string) => Promise<void> }) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setFormError('');
    try { await onSubmit(value.trim()); onClose(); }
    catch (caught) { setFormError(caught instanceof Error ? caught.message : 'Không thể hoàn tất thao tác với nhóm.'); }
    finally { setSubmitting(false); }
  }
  return (
    <ModalFrame onClose={onClose}>
      <form onSubmit={submit}><Stack gap="sm">
        <Title order={2} size="h3">{mode === 'create' ? 'Tạo nhóm mới' : 'Nhập mã mời'}</Title>
        <Text size="sm" c="dimmed">{mode === 'create' ? 'Bạn sẽ trở thành trưởng nhóm và có thể chia sẻ mã mời cho các thành viên.' : 'Nhập mã mời do trưởng nhóm chia sẻ để tham gia nhóm.'}</Text>
        <TextInput id="group-value" label={mode === 'create' ? 'Tên nhóm' : 'Mã mời'} value={value} onChange={(event) => setValue(mode === 'join' ? event.currentTarget.value.toUpperCase() : event.currentTarget.value)} placeholder={mode === 'create' ? 'Nhập tên nhóm' : 'Nhập mã mời'} maxLength={mode === 'create' ? 80 : 16} minLength={mode === 'create' ? 2 : 1} required autoFocus />
        {formError && <Alert color="red" role="alert">{formError}</Alert>}
        <Group justify="flex-end"><Button variant="default" type="button" onClick={onClose}>Hủy</Button><Button type="submit" loading={submitting}>{mode === 'create' ? 'Tạo nhóm' : 'Tham gia nhóm'}</Button></Group>
      </Stack></form>
    </ModalFrame>
  );
}

export function InviteCodeModal({ group, onClose }: ModalProps & { group: TeamGroup }) {
  const [copyLabel, setCopyLabel] = useState('Sao chép mã');
  async function copyCode() {
    try { await navigator.clipboard.writeText(group.inviteCode); setCopyLabel('Đã sao chép'); }
    catch { setCopyLabel('Không thể sao chép'); }
  }
  return (
    <ModalFrame onClose={onClose}><Stack gap="sm">
      <Title order={2} size="h3">Mã mời nhóm</Title>
      <Text size="sm" c="dimmed">Gửi mã này cho người cần tham gia “{group.name}”. Họ nhập mã sau khi đăng nhập.</Text>
      <Paper withBorder p="lg" ta="center"><Text ff="monospace" fw={700} size="lg">{group.inviteCode}</Text></Paper>
      <Group justify="flex-end"><Button variant="default" onClick={onClose}>Đóng</Button><Button leftSection={<Icon name="invite" />} onClick={() => void copyCode()}>{copyLabel}</Button></Group>
    </Stack></ModalFrame>
  );
}

type MembersModalProps = ModalProps & {
  groupId: string; groupName: string; members: TeamMember[]; tasks: Task[]; currentUserId: string; isManager: boolean;
  onRemoveMember: (memberId: string, transferToId: string | null, deleteOpenTasks: boolean) => Promise<void>;
  onLeaveGroup: (transferToId: string | null) => Promise<void>;
  onTransferManager: (targetUserId: string) => Promise<void>;
};

export function MembersModal({ groupId, groupName, members, tasks, currentUserId, isManager, onRemoveMember, onLeaveGroup, onTransferManager, onClose }: MembersModalProps) {
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{
    member: TeamMember;
    transferToId: string | null;
    deleteOpenTasks: boolean;
    openTaskCount: number;
  } | null>(null);
  const [taskHandling, setTaskHandling] = useState<'reassign' | 'delete'>('reassign');
  const [reassignToId, setReassignToId] = useState(members.find((member) => member.id !== currentUserId)?.id || '');
  const [leaveTransferToId, setLeaveTransferToId] = useState(members.find((member) => member.id !== currentUserId)?.id || '');
  const [newManagerId, setNewManagerId] = useState(members.find((member) => member.id !== currentUserId)?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const otherMembers = members.filter((member) => member.id !== currentUserId);
  return (
    <>
    <ModalFrame onClose={onClose} size="xl"><Stack gap="md">
      <Title order={2} size="h3">Thành viên nhóm</Title>
      <Stack mah="55vh" style={{ overflowY: 'auto' }} gap="sm">
        {members.map((member) => {
          const openTasks = tasks.filter((task) => task.assigneeId === member.id && task.status !== 'done');
          return <Paper key={member.id} withBorder p="sm">
            <Group wrap="nowrap">
              <Avatar radius={0} color="gray" style={{ backgroundColor: member.color }}>{initials(member.name)}</Avatar>
              <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                <Text fw={600} size="sm">{member.name}{member.id === currentUserId ? ' (Bạn)' : ''}</Text>
                <Text size="xs" c="dimmed">{member.role} · Tham gia {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('vi-VN') : 'chưa rõ ngày'}{member.email ? ` · ${member.email}` : ''}</Text>
              </Stack>
              {isManager && member.id !== currentUserId && !member.isManager && <Button color="red" variant="light" size="xs" onClick={() => { setRemovingMemberId(member.id); setReassignToId(currentUserId); setActionError(''); }}>Xóa</Button>}
            </Group>
            {removingMemberId === member.id && <Stack mt="sm" p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)' }}>
              <Text fw={600}>Xóa {member.name} khỏi nhóm</Text>
              {openTasks.length > 0 ? <>
                <Text size="sm">Thành viên này đang phụ trách {openTasks.length} công việc chưa hoàn thành.</Text>
                <Select label="Xử lý công việc" value={taskHandling} onChange={(value) => { if (value === 'reassign' || value === 'delete') setTaskHandling(value); }} data={[{ value: 'reassign', label: 'Chuyển cho thành viên khác' }, { value: 'delete', label: 'Xóa công việc chưa hoàn thành' }]} />
                {taskHandling === 'reassign' && <Select label="Chuyển cho" value={reassignToId} onChange={(value) => setReassignToId(value || '')} data={members.filter((item) => item.id !== member.id).map((item) => ({ value: item.id, label: item.name }))} />}
              </> : <Text size="sm">Thành viên này không có công việc chưa hoàn thành.</Text>}
              {actionError && <Alert color="red">{actionError}</Alert>}
              <Group justify="flex-end">
                <Button color="red" loading={submitting} disabled={taskHandling === 'reassign' && !reassignToId && openTasks.length > 0} onClick={() => {
                  const hasOpenTasks = openTasks.length > 0;
                  setPendingRemoval({
                    member,
                    transferToId: hasOpenTasks && taskHandling === 'reassign' ? reassignToId : null,
                    deleteOpenTasks: hasOpenTasks && taskHandling === 'delete',
                    openTaskCount: openTasks.length,
                  });
                }}>Xác nhận xóa</Button>
              </Group>
            </Stack>}
          </Paper>;
        })}
      </Stack>
      {isManager && otherMembers.length > 0 && <Paper withBorder p="md">
        <Stack gap="sm"><Text fw={600}>Chuyển quyền trưởng nhóm</Text><Text size="sm">Quyền của bạn sẽ chuyển thành thành viên. Bạn cần thực hiện thao tác này trước khi rời nhóm.</Text>
          <Select id={`new-manager-${groupId}`} label="Trưởng nhóm mới" value={newManagerId} onChange={(value) => setNewManagerId(value || '')} data={otherMembers.map((member) => ({ value: member.id, label: member.name }))} />
          {actionError && <Alert color="red">{actionError}</Alert>}
          <Button loading={submitting} disabled={!newManagerId} onClick={async () => {
            if (!window.confirm('Chuyển quyền trưởng nhóm? Bạn sẽ trở thành thành viên.')) return;
            setSubmitting(true); setActionError('');
            try { await onTransferManager(newManagerId); }
            catch (caught) { setActionError(caught instanceof Error ? caught.message : 'Không thể chuyển quyền trưởng nhóm.'); }
            finally { setSubmitting(false); }
          }}>Chuyển quyền</Button>
        </Stack>
      </Paper>}
      {!isManager && <Paper withBorder p="md"><Stack gap="sm"><Text fw={600}>Rời nhóm</Text>
        {tasks.some((task) => task.assigneeId === currentUserId && task.status !== 'done') ? <>
          <Text size="sm">Chuyển các công việc chưa hoàn thành cho thành viên khác trước khi rời nhóm.</Text>
          <Select id={`leave-transfer-${groupId}`} label="Chuyển công việc cho" value={leaveTransferToId} onChange={(value) => setLeaveTransferToId(value || '')} data={otherMembers.map((member) => ({ value: member.id, label: member.name }))} />
        </> : <Text size="sm">Bạn không có công việc chưa hoàn thành; các công việc đã hoàn thành sẽ được giữ lại.</Text>}
        {actionError && <Alert color="red">{actionError}</Alert>}
        <Button color="red" variant="light" loading={submitting} onClick={async () => {
          if (!window.confirm(`Rời khỏi nhóm "${groupName}"?`)) return;
          setSubmitting(true); setActionError('');
          try { await onLeaveGroup(tasks.some((task) => task.assigneeId === currentUserId && task.status !== 'done') ? leaveTransferToId : null); }
          catch (caught) { setActionError(caught instanceof Error ? caught.message : 'Không thể rời nhóm.'); }
          finally { setSubmitting(false); }
        }}>Rời nhóm</Button>
      </Stack></Paper>}
      <Group justify="flex-end"><Button onClick={onClose}>Đóng</Button></Group>
    </Stack></ModalFrame>
    {pendingRemoval && (
      <ConfirmationModal
        title={`Xóa ${pendingRemoval.member.name} khỏi nhóm?`}
        message={pendingRemoval.deleteOpenTasks
          ? `Thành viên và ${pendingRemoval.openTaskCount} công việc chưa hoàn thành sẽ bị xóa. Công việc đã hoàn thành được giữ lại. Thao tác này không thể hoàn tác.`
          : pendingRemoval.openTaskCount
            ? `Công việc chưa hoàn thành của thành viên sẽ được chuyển giao. Công việc đã hoàn thành được giữ lại. Thao tác này không thể hoàn tác.`
            : 'Thao tác này không thể hoàn tác.'}
        confirmLabel="Xóa thành viên"
        onClose={() => setPendingRemoval(null)}
        onConfirm={async () => {
          await onRemoveMember(
            pendingRemoval.member.id,
            pendingRemoval.transferToId,
            pendingRemoval.deleteOpenTasks,
          );
          setRemovingMemberId(null);
          setPendingRemoval(null);
        }}
      />
    )}
    </>
  );
}

export function CompletionReportModal({ task, onClose, onSubmit }: ModalProps & { task: Task; onSubmit: (report: string) => Promise<boolean> }) {
  const [report, setReport] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError('');
    try { if (await onSubmit(report.trim())) onClose(); else setError('Không thể lưu báo cáo. Vui lòng thử lại.'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể lưu báo cáo.'); }
    finally { setSubmitting(false); }
  }
  return <ModalFrame onClose={onClose}><form onSubmit={(event) => void submit(event)}><Stack gap="sm">
    <Text size="xs" fw={700} c="violet" tt="uppercase">Báo cáo công việc</Text><Title order={2} size="h3">Chi tiết hoàn thành</Title>
    <Text size="sm" c="dimmed">Mô tả kết quả hoặc phần việc đã hoàn thành cho “{task.title}”. Báo cáo sẽ hiển thị với cả nhóm.</Text>
    <Textarea id="completion-report" label="Chi tiết báo cáo" value={report} onChange={(event) => setReport(event.currentTarget.value)} minRows={5} maxLength={2000} required autoFocus />
    <Text size="xs" c="dimmed" ta="right">{report.length}/2000</Text>{error && <Alert color="red">{error}</Alert>}
    <Group justify="flex-end"><Button variant="default" type="button" onClick={onClose}>Hủy</Button><Button type="submit" loading={submitting} disabled={!report.trim()}>Lưu báo cáo và hoàn thành</Button></Group>
  </Stack></form></ModalFrame>;
}

export function TaskDetailsModal({ task, onClose }: ModalProps & { task: Task }) {
  const createdAt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(task.createdAt));
  const statuses = { todo: 'Chưa bắt đầu', in_progress: 'Đang thực hiện', done: 'Đã hoàn thành' };
  const rows = [['Yêu cầu tiên quyết', task.prerequisites], ['Đầu vào', task.input || task.description || 'Chưa có đầu vào'], ['Đầu ra', task.output || 'Chưa có đầu ra'], ['Hạn hoàn thành', formatDueDate(task.dueDate)], ['Trạng thái', statuses[task.status]], ['Người phụ trách', task.assigneeName], ['Ngày tạo', createdAt], ...(task.completionReport ? [['Báo cáo hoàn thành', task.completionReport]] : [])];
  return <ModalFrame onClose={onClose} size="lg"><Stack gap="sm"><Text size="xs" fw={700} c="violet" tt="uppercase">Chi tiết công việc</Text><Title order={2} size="h3">{task.title}</Title>
    {rows.map(([label, value]) => <Paper key={label} p="sm" bg="gray.0"><Text size="xs" c="dimmed" fw={500}>{label}</Text><Text size="sm" mt={4} style={{ whiteSpace: 'pre-wrap' }}>{value}</Text></Paper>)}
    <Group justify="flex-end"><Button onClick={onClose}>Đóng</Button></Group>
  </Stack></ModalFrame>;
}

export function AccountModal({ user, member, onClose }: ModalProps & { user: AppUser; member?: TeamMember }) {
  return <ModalFrame onClose={onClose}><Stack gap="sm"><Title order={2} size="h3">Tài khoản của bạn</Title>
    <Paper withBorder p="sm"><Text size="xs" c="dimmed">Họ và tên</Text><Text size="sm" fw={600}>{member?.name || user.name}</Text></Paper>
    <Paper withBorder p="sm"><Text size="xs" c="dimmed">Email đăng nhập</Text><Text size="sm" fw={600}>{user.email || 'Chưa cập nhật'}</Text></Paper>
    <Group justify="flex-end"><Button onClick={onClose}>Đóng</Button></Group>
  </Stack></ModalFrame>;
}
