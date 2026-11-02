import React, { FormEvent, useState } from 'react';
import { AppUser } from '../../api/supabaseAuth';
import { Icon } from '../../components/Icon';
import { TeamGroup } from '../groups/groupTypes';
import { TeamMember } from '../members/memberTypes';
import { NewTask, Task } from './taskTypes';
import { formatDueDate, initials, localDateString } from './taskUi';

type ModalProps = { onClose: () => void };

export function TaskModal({ members, onClose, onSubmit }: ModalProps & {
  members: TeamMember[];
  onSubmit: (task: NewTask) => Promise<void>;
}) {
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
    if (!title.trim() || !prerequisites.trim() || !input.trim() || !output.trim() || !assignee || !dueDate) {
      setFormError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({
        title: title.trim(),
        description: input.trim(),
        prerequisites: prerequisites.trim(),
        input: input.trim(),
        output: output.trim(),
        assigneeId,
        assigneeName: assignee.name,
        status: 'todo',
        priority: 'medium',
        dueDate,
      });
      onClose();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Không thể giao công việc.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal-card task-create-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div className="modal-heading">
          <div><h2 id="task-modal-title">Giao việc cho thành viên</h2></div>
        </div>
        <label htmlFor="task-title">Việc cần làm</label>
        <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Chuẩn bị báo cáo tuần" maxLength={120} required autoFocus />
        <label htmlFor="task-prerequisites">Yêu cầu tiên quyết</label>
        <textarea id="task-prerequisites" value={prerequisites} onChange={(event) => setPrerequisites(event.target.value)} placeholder="Điều kiện hoặc việc cần hoàn thành trước..." rows={2} required />
        <label htmlFor="task-input">Đầu vào</label>
        <textarea id="task-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Thông tin, tài liệu hoặc nguồn lực cần có..." rows={2} required />
        <label htmlFor="task-output">Đầu ra</label>
        <textarea id="task-output" value={output} onChange={(event) => setOutput(event.target.value)} placeholder="Kết quả cần bàn giao sau khi hoàn thành..." rows={2} required />
        <div className="form-grid task-assignee-grid">
          <div>
            <label htmlFor="task-assignee">Giao cho</label>
            <select id="task-assignee" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} required>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </div>
        </div>
        <label htmlFor="task-due-date">Hạn cần hoàn thành</label>
        <input id="task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Hủy</button>
          <button className="primary-button" type="submit" disabled={submitting || members.length === 0}>
            {submitting ? 'Đang giao việc...' : 'Giao công việc'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function GroupModal({ mode, onClose, onSubmit }: ModalProps & {
  mode: 'create' | 'join';
  onSubmit: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit(value.trim());
      onClose();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Không thể hoàn tất thao tác với nhóm.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal-card" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="group-modal-title">
        <div className="modal-heading">
          <div>
            <h2 id="group-modal-title">{mode === 'create' ? 'Tạo nhóm mới' : 'Nhập mã mời'}</h2>
          </div>
        </div>
        <p className="modal-intro">{mode === 'create'
          ? 'Bạn sẽ trở thành trưởng nhóm và có thể chia sẻ mã mời cho các thành viên.'
          : 'Nhập mã mời do trưởng nhóm chia sẻ để tham gia nhóm.'}</p>
        <label htmlFor="group-value">{mode === 'create' ? 'Tên nhóm' : 'Mã mời'}</label>
        <input
          id="group-value"
          value={value}
          onChange={(event) => setValue(mode === 'join' ? event.target.value.toUpperCase() : event.target.value)}
          placeholder={mode === 'create' ? 'Ví dụ: Nhóm thiết kế' : 'Nhập mã mời'}
          maxLength={mode === 'create' ? 80 : 16}
          minLength={mode === 'create' ? 2 : 1}
          required
          autoFocus
        />
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Hủy</button>
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Đang xử lý...' : mode === 'create' ? 'Tạo nhóm' : 'Tham gia nhóm'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function InviteCodeModal({ group, onClose }: ModalProps & { group: TeamGroup }) {
  const [copyLabel, setCopyLabel] = useState('Sao chép mã');

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopyLabel('Đã sao chép');
    } catch {
      setCopyLabel('Không thể sao chép');
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="invite-modal-title">
        <div className="modal-heading">
          <div><h2 id="invite-modal-title">Mã mời nhóm</h2></div>
        </div>
        <p className="modal-intro">Gửi mã này cho người cần tham gia “{group.name}”. Họ nhập mã sau khi đăng nhập.</p>
        <div className="invite-code">{group.inviteCode}</div>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Đóng</button>
          <button className="primary-button" type="button" onClick={() => void copyCode()}><Icon name="invite" size={18} />{copyLabel}</button>
        </div>
      </section>
    </div>
  );
}

export function MembersModal({
  groupId,
  groupName,
  members,
  tasks,
  currentUserId,
  isManager,
  onRemoveMember,
  onLeaveGroup,
  onTransferManager,
  onClose,
}: ModalProps & {
  groupId: string;
  groupName: string;
  members: TeamMember[];
  tasks: Task[];
  currentUserId: string;
  isManager: boolean;
  onRemoveMember: (memberId: string, transferToId: string | null, deleteOpenTasks: boolean) => Promise<void>;
  onLeaveGroup: (transferToId: string | null) => Promise<void>;
  onTransferManager: (targetUserId: string) => Promise<void>;
}) {
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [taskHandling, setTaskHandling] = useState<'reassign' | 'delete'>('reassign');
  const [reassignToId, setReassignToId] = useState(
    members.find((member) => member.id !== currentUserId)?.id || '',
  );
  const [leaveTransferToId, setLeaveTransferToId] = useState(
    members.find((member) => member.id !== currentUserId)?.id || '',
  );
  const [newManagerId, setNewManagerId] = useState(
    members.find((member) => member.id !== currentUserId)?.id || '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const otherMembers = members.filter((member) => member.id !== currentUserId);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card members-modal" role="dialog" aria-modal="true" aria-labelledby="members-modal-title">
        <div className="modal-heading">
          <div><h2 id="members-modal-title">Thành viên nhóm</h2></div>
        </div>
        {members.length ? (
          <div className="members-modal-list">
            {members.map((member) => (
              <div className="member-management-card" key={member.id}>
                <div className="members-modal-row">
                  <span className="avatar avatar-small" style={{ backgroundColor: member.color }}>{initials(member.name)}</span>
                  <span className="member-copy">
                    <strong>{member.name}{member.id === currentUserId ? ' (Bạn)' : ''}</strong>
                    <small>
                      {member.role} · Tham gia {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('vi-VN') : 'chưa rõ ngày'}
                      {member.email ? ` · ${member.email}` : ''}
                    </small>
                  </span>
                  {isManager && member.id !== currentUserId && !member.isManager && (
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => {
                        setRemovingMemberId((current) => current === member.id ? null : member.id);
                        setReassignToId(currentUserId);
                        setActionError('');
                      }}
                    >
                      Xóa
                    </button>
                  )}
                </div>
                {removingMemberId === member.id && (
                  <div className="member-action-panel">
                    <strong>Xóa {member.name} khỏi nhóm</strong>
                    {tasks.some((task) => task.assigneeId === member.id && task.status !== 'done') ? (
                      <>
                        <p>Thành viên này đang phụ trách {tasks.filter((task) => task.assigneeId === member.id && task.status !== 'done').length} công việc chưa hoàn thành.</p>
                        <label htmlFor={`remove-task-handling-${member.id}`}>Xử lý công việc</label>
                        <select
                          id={`remove-task-handling-${member.id}`}
                          value={taskHandling}
                          onChange={(event) => setTaskHandling(event.target.value as 'reassign' | 'delete')}
                        >
                          <option value="reassign">Chuyển cho thành viên khác</option>
                          <option value="delete">Xóa công việc chưa hoàn thành</option>
                        </select>
                        {taskHandling === 'reassign' && (
                          <>
                            <label htmlFor={`remove-reassign-${member.id}`}>Chuyển cho</label>
                            <select id={`remove-reassign-${member.id}`} value={reassignToId} onChange={(event) => setReassignToId(event.target.value)}>
                              {members.filter((candidate) => candidate.id !== member.id).map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </>
                    ) : <p>Thành viên này không có công việc chưa hoàn thành.</p>}
                    {actionError && <p className="form-error" role="alert">{actionError}</p>}
                    <div className="modal-actions">
                      <button className="secondary-button" type="button" onClick={() => setRemovingMemberId(null)} disabled={submitting}>Hủy</button>
                      <button
                        className="danger-button"
                        type="button"
                        disabled={submitting || (taskHandling === 'reassign' && !reassignToId && tasks.some((task) => task.assigneeId === member.id && task.status !== 'done'))}
                        onClick={async () => {
                          const hasOpenTasks = tasks.some((task) => task.assigneeId === member.id && task.status !== 'done');
                          const deleteOpenTasks = hasOpenTasks && taskHandling === 'delete';
                          if (!window.confirm(deleteOpenTasks
                            ? `Xóa ${member.name} và các công việc chưa hoàn thành của họ? Công việc đã hoàn thành sẽ được giữ lại.`
                            : `Xóa ${member.name} khỏi nhóm${hasOpenTasks ? ' và chuyển giao công việc chưa hoàn thành' : ''}?`)) return;
                          setSubmitting(true);
                          setActionError('');
                          try {
                            await onRemoveMember(
                              member.id,
                              hasOpenTasks && taskHandling === 'reassign' ? reassignToId : null,
                              deleteOpenTasks,
                            );
                            setRemovingMemberId(null);
                          } catch (caught) {
                            setActionError(caught instanceof Error ? caught.message : 'Không thể xóa thành viên.');
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        {submitting ? 'Đang xử lý...' : 'Xác nhận xóa'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="team-empty">Nhóm chưa có thành viên.</p>}
        {isManager && otherMembers.length > 0 && (
          <div className="member-action-panel">
            <strong>Chuyển quyền trưởng nhóm</strong>
            <p>Quyền của bạn sẽ chuyển thành thành viên. Bạn cần thực hiện thao tác này trước khi rời nhóm.</p>
            <label htmlFor={`new-manager-${groupId}`}>Trưởng nhóm mới</label>
            <select id={`new-manager-${groupId}`} value={newManagerId} onChange={(event) => setNewManagerId(event.target.value)}>
              {otherMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
            {actionError && <p className="form-error" role="alert">{actionError}</p>}
            <button
              className="secondary-button"
              type="button"
              disabled={submitting || !newManagerId}
              onClick={async () => {
                if (!window.confirm('Chuyển quyền trưởng nhóm? Bạn sẽ trở thành thành viên.')) return;
                setSubmitting(true);
                setActionError('');
                try {
                  await onTransferManager(newManagerId);
                } catch (caught) {
                  setActionError(caught instanceof Error ? caught.message : 'Không thể chuyển quyền trưởng nhóm.');
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Chuyển quyền
            </button>
          </div>
        )}
        {!isManager && (
          <div className="member-action-panel">
            <strong>Rời nhóm</strong>
            {tasks.some((task) => task.assigneeId === currentUserId && task.status !== 'done') ? (
              <>
                <p>Chuyển các công việc chưa hoàn thành cho thành viên khác trước khi rời nhóm.</p>
                <label htmlFor={`leave-transfer-${groupId}`}>Chuyển công việc cho</label>
                <select id={`leave-transfer-${groupId}`} value={leaveTransferToId} onChange={(event) => setLeaveTransferToId(event.target.value)}>
                  {otherMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
              </>
            ) : <p>Bạn không có công việc chưa hoàn thành; các công việc đã hoàn thành sẽ được giữ lại.</p>}
            {actionError && <p className="form-error" role="alert">{actionError}</p>}
            <button
              className="danger-button"
              type="button"
              disabled={submitting || (tasks.some((task) => task.assigneeId === currentUserId && task.status !== 'done') && !leaveTransferToId)}
              onClick={async () => {
                if (!window.confirm(`Rời khỏi nhóm "${groupName}"?`)) return;
                setSubmitting(true);
                setActionError('');
                try {
                  await onLeaveGroup(tasks.some((task) => task.assigneeId === currentUserId && task.status !== 'done') ? leaveTransferToId : null);
                } catch (caught) {
                  setActionError(caught instanceof Error ? caught.message : 'Không thể rời nhóm.');
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? 'Đang xử lý...' : 'Rời nhóm'}
            </button>
          </div>
        )}
        <div className="modal-actions">
          <button className="primary-button" type="button" onClick={onClose}>Đóng</button>
        </div>
      </section>
    </div>
  );
}

export function CompletionReportModal({ task, onClose, onSubmit }: ModalProps & {
  task: Task;
  onSubmit: (report: string) => Promise<boolean>;
}) {
  const [report, setReport] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (await onSubmit(report.trim())) onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal-card" onSubmit={(event) => void submit(event)} role="dialog" aria-modal="true" aria-labelledby="completion-report-title">
        <div className="modal-heading">
          <div><span className="eyebrow">BÁO CÁO CÔNG VIỆC</span><h2 id="completion-report-title">Chi tiết hoàn thành</h2></div>
          <button className="icon-button" type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </div>
        <p className="modal-intro">Mô tả kết quả hoặc phần việc đã hoàn thành cho “{task.title}”. Báo cáo sẽ hiển thị với cả nhóm.</p>
        <label htmlFor="completion-report">Chi tiết báo cáo</label>
        <textarea
          id="completion-report"
          value={report}
          onChange={(event) => setReport(event.target.value)}
          placeholder="Ví dụ: Đã hoàn thành các hạng mục..., kết quả được lưu tại..."
          rows={5}
          maxLength={2000}
          required
          autoFocus
        />
        <div className="report-character-count">{report.length}/2000</div>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Hủy</button>
          <button className="primary-button" type="submit" disabled={submitting || !report.trim()}>
            {submitting ? 'Đang lưu...' : 'Lưu báo cáo và hoàn thành'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function TaskDetailsModal({ task, onClose }: ModalProps & { task: Task }) {
  const createdAt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(task.createdAt));
  const statusLabels = { todo: 'Chưa bắt đầu', in_progress: 'Đang thực hiện', done: 'Đã hoàn thành' };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card task-details-modal" role="dialog" aria-modal="true" aria-labelledby="task-details-title">
        <div className="modal-heading">
          <div><span className="eyebrow">CHI TIẾT CÔNG VIỆC</span><h2 id="task-details-title">{task.title}</h2></div>
          <button className="icon-button" type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </div>
        <dl className="task-details-list">
          <div><dt>Yêu cầu tiên quyết</dt><dd>{task.prerequisites}</dd></div>
          <div><dt>Đầu vào</dt><dd>{task.input || task.description || 'Chưa có đầu vào'}</dd></div>
          <div><dt>Đầu ra</dt><dd>{task.output || 'Chưa có đầu ra'}</dd></div>
          <div><dt>Hạn hoàn thành</dt><dd>{formatDueDate(task.dueDate)}</dd></div>
          <div><dt>Trạng thái</dt><dd>{statusLabels[task.status]}</dd></div>
          <div><dt>Người phụ trách</dt><dd>{task.assigneeName}</dd></div>
          <div><dt>Ngày tạo</dt><dd>{createdAt}</dd></div>
          {task.completionReport && <div><dt>Báo cáo hoàn thành</dt><dd>{task.completionReport}</dd></div>}
        </dl>
        <div className="modal-actions">
          <button className="primary-button" type="button" onClick={onClose}>Đóng</button>
        </div>
      </section>
    </div>
  );
}

export function AccountModal({ user, member, onClose }: ModalProps & {
  user: AppUser;
  member?: TeamMember;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card account-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
        <div className="modal-heading">
          <div><h2 id="account-modal-title">Tài khoản của bạn</h2></div>
        </div>
        <div className="account-details">
          <div><span>Họ và tên</span><strong>{member?.name || user.name}</strong></div>
          <div><span>Email đăng nhập</span><strong>{user.email || 'Chưa cập nhật'}</strong></div>
        </div>
        <div className="modal-actions"><button className="primary-button" type="button" onClick={onClose}>Đóng</button></div>
      </section>
    </div>
  );
}
