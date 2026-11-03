create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'Thành viên',
  color text not null default '#7658e8',
  email text,
  is_manager boolean not null default false
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('manager', 'member')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  assignee_id uuid not null references public.profiles(id),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  due_date date not null,
  created_at timestamptz not null default now(),
  completion_report text
);

alter table public.tasks add column if not exists group_id uuid references public.groups(id) on delete cascade;
alter table public.tasks add column if not exists completion_report text;
alter table public.tasks add column if not exists prerequisites text;
alter table public.tasks add column if not exists input text;
alter table public.tasks add column if not exists output text;
update public.tasks
set prerequisites = 'Không có yêu cầu tiên quyết.'
where prerequisites is null or char_length(btrim(prerequisites)) = 0;
alter table public.tasks alter column prerequisites set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_prerequisites_not_blank'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_prerequisites_not_blank
      check (char_length(btrim(prerequisites)) > 0);
  end if;
end
$$;

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  event_type text not null check (event_type in ('group_created', 'task_created', 'task_completed', 'task_status_changed')),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  subject text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.activity_logs drop constraint if exists activity_logs_event_type_check;
alter table public.activity_logs add constraint activity_logs_event_type_check
  check (event_type in (
    'group_created',
    'task_created',
    'task_completed',
    'task_status_changed',
    'task_reassigned',
    'task_deleted',
    'member_removed',
    'member_left',
    'manager_transferred'
  ));

create index if not exists tasks_assignee_id_idx on public.tasks(assignee_id);
create index if not exists tasks_group_due_date_idx on public.tasks(group_id, due_date);
create index if not exists tasks_group_assignee_open_idx
  on public.tasks(group_id, assignee_id)
  where status <> 'done';
create index if not exists group_members_user_created_at_idx on public.group_members(user_id, created_at);
create index if not exists group_members_group_created_at_idx on public.group_members(group_id, created_at);
create index if not exists activity_logs_group_created_at_idx on public.activity_logs(group_id, created_at desc);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'tasks'
    ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end
$$;

drop index if exists public.tasks_due_date_idx;
drop index if exists public.tasks_group_id_idx;
drop index if exists public.group_members_user_id_idx;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Thành viên'
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.create_profile_for_new_user();

insert into public.profiles (id, name, email)
select
  id,
  coalesce(
    nullif(raw_user_meta_data->>'name', ''),
    nullif(split_part(coalesce(email, ''), '@', 1), ''),
    'Thành viên'
  ),
  email
from auth.users
on conflict (id) do nothing;

do $$
declare
  legacy_manager_id uuid;
  legacy_group_id uuid;
begin
  if not exists (select 1 from public.groups)
    and exists (select 1 from public.profiles)
    and (
      exists (select 1 from public.tasks)
      or exists (select 1 from public.profiles where is_manager)
    ) then
    select id into legacy_manager_id
    from public.profiles
    where is_manager
    order by id
    limit 1;

    if legacy_manager_id is null then
      select id into legacy_manager_id
      from public.profiles
      order by id
      limit 1;
    end if;

    insert into public.groups (name, created_by)
    values ('Nhóm hiện tại', legacy_manager_id)
    returning id into legacy_group_id;

    insert into public.group_members (group_id, user_id, role)
    select
      legacy_group_id,
      id,
      case when is_manager or id = legacy_manager_id then 'manager' else 'member' end
    from public.profiles
    on conflict (group_id, user_id) do nothing;
  end if;

  update public.tasks
  set group_id = (select id from public.groups order by created_at, id limit 1)
  where group_id is null
    and exists (select 1 from public.groups);
end;
$$;

alter table public.tasks alter column group_id set not null;

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_manager(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'manager'
  );
$$;

create or replace function public.log_group_creation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_name text;
begin
  select name into creator_name from public.profiles where id = new.created_by;
  insert into public.activity_logs (group_id, event_type, actor_id, actor_name, subject, created_at)
  values (new.id, 'group_created', new.created_by, coalesce(creator_name, 'Thành viên'), new.name, new.created_at);
  return new;
end;
$$;

create or replace function public.log_task_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_label text;
  assignee_label text;
  event_label text;
  event_details text;
begin
  select name into actor_label from public.profiles where id = actor;

  if tg_op = 'INSERT' then
    select name into assignee_label from public.profiles where id = new.assignee_id;
    insert into public.activity_logs (group_id, task_id, event_type, actor_id, actor_name, subject, details)
    values (
      new.group_id,
      new.id,
      'task_created',
      actor,
      coalesce(actor_label, 'Hệ thống'),
      new.title,
      'Người phụ trách: ' || coalesce(assignee_label, 'Chưa rõ')
    );
    return new;
  end if;

  if new.status is distinct from old.status then
    event_label := case when new.status = 'done' then 'task_completed' else 'task_status_changed' end;
    event_details := case
      when old.status = 'done' then 'Hoàn thành bị hủy; trạng thái mới: ' ||
        case new.status
          when 'todo' then 'Chưa bắt đầu'
          when 'in_progress' then 'Đang thực hiện'
          else 'Đã hoàn thành'
        end
      else
        case old.status
          when 'todo' then 'Chưa bắt đầu'
          when 'in_progress' then 'Đang thực hiện'
          else 'Đã hoàn thành'
        end || ' → ' ||
        case new.status
          when 'todo' then 'Chưa bắt đầu'
          when 'in_progress' then 'Đang thực hiện'
          else 'Đã hoàn thành'
        end
    end;
    insert into public.activity_logs (group_id, task_id, event_type, actor_id, actor_name, subject, details)
    values (
      new.group_id,
      new.id,
      event_label,
      actor,
      coalesce(actor_label, 'Hệ thống'),
      new.title,
      event_details
    );
  elsif new.assignee_id is distinct from old.assignee_id then
    select name into assignee_label from public.profiles where id = new.assignee_id;
    insert into public.activity_logs (group_id, task_id, event_type, actor_id, actor_name, subject, details)
    values (
      new.group_id,
      new.id,
      'task_reassigned',
      actor,
      coalesce(actor_label, 'Hệ thống'),
      new.title,
      'Đã chuyển công việc cho ' || coalesce(assignee_label, 'thành viên khác')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists groups_log_creation on public.groups;
create trigger groups_log_creation
after insert on public.groups
for each row execute procedure public.log_group_creation();

drop trigger if exists tasks_log_activity on public.tasks;
create trigger tasks_log_activity
after insert on public.tasks
for each row execute procedure public.log_task_activity();

drop trigger if exists tasks_log_status_change on public.tasks;
create trigger tasks_log_status_change
after update of status, assignee_id on public.tasks
for each row execute procedure public.log_task_activity();

insert into public.activity_logs (group_id, event_type, actor_id, actor_name, subject, created_at)
select g.id, 'group_created', g.created_by, coalesce(p.name, 'Thành viên'), g.name, g.created_at
from public.groups g
left join public.profiles p on p.id = g.created_by
where not exists (
  select 1 from public.activity_logs log
  where log.group_id = g.id and log.event_type = 'group_created'
);

insert into public.activity_logs (group_id, task_id, event_type, actor_name, subject, details, created_at)
select t.group_id, t.id, 'task_created', 'Hệ thống', t.title, 'Công việc đã được tạo trước khi bật nhật ký.', t.created_at
from public.tasks t
where not exists (
  select 1 from public.activity_logs log
  where log.task_id = t.id and log.event_type = 'task_created'
);

revoke all on function public.log_group_creation() from public;
revoke all on function public.log_task_activity() from public;

create or replace function public.can_view_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members viewer
    join public.group_members subject on subject.group_id = viewer.group_id
    where viewer.user_id = auth.uid() and subject.user_id = p_profile_id
  ) or exists (
    select 1
    from public.group_members viewer
    join public.tasks task on task.group_id = viewer.group_id
    where viewer.user_id = auth.uid() and task.assignee_id = p_profile_id
  );
$$;

create or replace function public.create_group(p_name text)
returns table (id uuid, name text, invite_code text, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
  clean_name text := btrim(coalesce(p_name, ''));
begin
  if auth.uid() is null then
    raise exception 'Bạn cần đăng nhập để tạo nhóm.';
  end if;
  if char_length(clean_name) < 2 or char_length(clean_name) > 80 then
    raise exception 'Tên nhóm cần có từ 2 đến 80 ký tự.';
  end if;

  insert into public.groups (name, created_by)
  values (clean_name, auth.uid())
  returning groups.id into new_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, auth.uid(), 'manager');

  return query
  select g.id, g.name, g.invite_code, gm.role
  from public.groups g
  join public.group_members gm on gm.group_id = g.id
  where g.id = new_group_id and gm.user_id = auth.uid();
end;
$$;

create or replace function public.join_group(p_invite_code text)
returns table (id uuid, name text, invite_code text, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Bạn cần đăng nhập để tham gia nhóm.';
  end if;

  select g.id into target_group_id
  from public.groups g
  where g.invite_code = upper(btrim(coalesce(p_invite_code, '')));

  if target_group_id is null then
    raise exception 'Mã mời không hợp lệ.';
  end if;

  if exists (
    select 1
    from public.group_members
    where group_id = target_group_id and user_id = auth.uid()
  ) then
    raise exception 'Bạn đã là thành viên của nhóm này rồi.';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  if not found then
    raise exception 'Bạn đã là thành viên của nhóm này rồi.';
  end if;

  return query
  select g.id, g.name, g.invite_code, gm.role
  from public.groups g
  join public.group_members gm on gm.group_id = g.id
  where g.id = target_group_id and gm.user_id = auth.uid();
end;
$$;

create or replace function public.delete_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Bạn cần đăng nhập để xóa nhóm.';
  end if;

  if not public.is_group_manager(p_group_id) then
    raise exception 'Chỉ trưởng nhóm mới có quyền xóa nhóm.';
  end if;

  delete from public.groups where id = p_group_id;
end;
$$;

create or replace function public.remove_group_member(
  p_group_id uuid,
  p_user_id uuid,
  p_reassign_to_user_id uuid,
  p_delete_open_tasks boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_name text;
  actor_name text;
  member_role text;
  open_task_count integer;
begin
  if p_delete_open_tasks is null then
    raise exception 'Hãy chọn cách xử lý công việc chưa hoàn thành.';
  end if;
  if auth.uid() is null or not public.is_group_manager(p_group_id) then
    raise exception 'Chỉ trưởng nhóm mới có quyền xóa thành viên.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Hãy chuyển quyền trưởng nhóm trước khi rời nhóm.';
  end if;

  select gm.role, p.name
  into member_role, member_name
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  where gm.group_id = p_group_id and gm.user_id = p_user_id
  for update of gm;

  if not found then
    raise exception 'Không tìm thấy thành viên trong nhóm.';
  end if;
  if member_role <> 'member' then
    raise exception 'Hãy chuyển quyền trưởng nhóm trước khi xóa thành viên này.';
  end if;

  select count(*) into open_task_count
  from public.tasks
  where group_id = p_group_id and assignee_id = p_user_id and status <> 'done';

  if p_delete_open_tasks and p_reassign_to_user_id is not null then
    raise exception 'Chỉ được chọn một cách xử lý công việc chưa hoàn thành.';
  end if;
  if open_task_count > 0 and not p_delete_open_tasks and p_reassign_to_user_id is null then
    raise exception 'Hãy chọn thành viên nhận công việc hoặc chọn xóa công việc chưa hoàn thành.';
  end if;
  if p_reassign_to_user_id is not null and not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_reassign_to_user_id and user_id <> p_user_id
  ) then
    raise exception 'Người nhận công việc phải là thành viên khác trong nhóm.';
  end if;

  select name into actor_name from public.profiles where id = auth.uid();
  if open_task_count > 0 and p_delete_open_tasks then
    insert into public.activity_logs (group_id, task_id, event_type, actor_id, actor_name, subject, details)
    select p_group_id, t.id, 'task_deleted', auth.uid(), coalesce(actor_name, 'Thành viên'), t.title,
      'Đã xóa khi xóa thành viên ' || coalesce(member_name, 'đã rời nhóm')
    from public.tasks t
    where t.group_id = p_group_id and t.assignee_id = p_user_id and t.status <> 'done';

    delete from public.tasks
    where group_id = p_group_id and assignee_id = p_user_id and status <> 'done';
  elsif open_task_count > 0 then
    update public.tasks
    set assignee_id = p_reassign_to_user_id
    where group_id = p_group_id and assignee_id = p_user_id and status <> 'done';
  end if;

  insert into public.activity_logs (group_id, event_type, actor_id, actor_name, subject, details)
  values (
    p_group_id,
    'member_removed',
    auth.uid(),
    coalesce(actor_name, 'Thành viên'),
    coalesce(member_name, 'Thành viên'),
    case when p_delete_open_tasks and open_task_count > 0
      then 'Đã xóa thành viên và ' || open_task_count || ' công việc chưa hoàn thành.'
      when open_task_count > 0
      then 'Đã xóa thành viên và chuyển giao ' || open_task_count || ' công việc chưa hoàn thành.'
      else 'Đã xóa thành viên khỏi nhóm.'
    end
  );
  delete from public.group_members
  where group_id = p_group_id and user_id = p_user_id;
end;
$$;

create or replace function public.leave_group(
  p_group_id uuid,
  p_reassign_to_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_role text;
  member_name text;
  open_task_count integer;
begin
  if auth.uid() is null then
    raise exception 'Bạn cần đăng nhập để rời nhóm.';
  end if;

  select gm.role, p.name
  into member_role, member_name
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  where gm.group_id = p_group_id and gm.user_id = auth.uid()
  for update of gm;

  if not found then
    raise exception 'Bạn không phải thành viên của nhóm này.';
  end if;
  if member_role = 'manager' then
    raise exception 'Hãy chuyển quyền trưởng nhóm trước khi rời nhóm.';
  end if;

  select count(*) into open_task_count
  from public.tasks
  where group_id = p_group_id and assignee_id = auth.uid() and status <> 'done';

  if open_task_count > 0 and (
    p_reassign_to_user_id is null
    or p_reassign_to_user_id = auth.uid()
    or not exists (
      select 1 from public.group_members
      where group_id = p_group_id and user_id = p_reassign_to_user_id
    )
  ) then
    raise exception 'Hãy chọn thành viên khác trong nhóm để nhận công việc chưa hoàn thành.';
  end if;

  if open_task_count > 0 then
    update public.tasks
    set assignee_id = p_reassign_to_user_id
    where group_id = p_group_id and assignee_id = auth.uid() and status <> 'done';
  end if;

  insert into public.activity_logs (group_id, event_type, actor_id, actor_name, subject, details)
  values (
    p_group_id,
    'member_left',
    auth.uid(),
    coalesce(member_name, 'Thành viên'),
    coalesce(member_name, 'Thành viên'),
    case when open_task_count > 0
      then 'Đã rời nhóm và chuyển giao ' || open_task_count || ' công việc chưa hoàn thành.'
      else 'Đã rời nhóm.'
    end
  );
  delete from public.group_members
  where group_id = p_group_id and user_id = auth.uid();
end;
$$;

create or replace function public.transfer_group_manager(
  p_group_id uuid,
  p_new_manager_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_manager_name text;
  new_manager_name text;
begin
  if auth.uid() is null or not public.is_group_manager(p_group_id) then
    raise exception 'Chỉ trưởng nhóm mới có thể chuyển quyền.';
  end if;
  if p_new_manager_id = auth.uid() or not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_new_manager_id and role = 'member'
  ) then
    raise exception 'Hãy chọn một thành viên khác trong nhóm làm trưởng nhóm mới.';
  end if;

  select name into previous_manager_name from public.profiles where id = auth.uid();
  select name into new_manager_name from public.profiles where id = p_new_manager_id;

  update public.group_members
  set role = 'manager'
  where group_id = p_group_id and user_id = p_new_manager_id;
  update public.group_members
  set role = 'member'
  where group_id = p_group_id and user_id = auth.uid();

  insert into public.activity_logs (group_id, event_type, actor_id, actor_name, subject, details)
  values (
    p_group_id,
    'manager_transferred',
    auth.uid(),
    coalesce(previous_manager_name, 'Trưởng nhóm'),
    coalesce(new_manager_name, 'Thành viên'),
    'Quyền trưởng nhóm đã được chuyển giao.'
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_manager_insert on public.profiles;
drop policy if exists profiles_manager_update on public.profiles;
drop policy if exists profiles_manager_delete on public.profiles;
drop policy if exists profiles_select_group_members on public.profiles;
create policy profiles_select_group_members on public.profiles
for select to authenticated using (public.can_view_profile(id));

drop policy if exists groups_select_members on public.groups;
create policy groups_select_members on public.groups
for select to authenticated using (public.is_group_member(id));

drop policy if exists group_members_select_group on public.group_members;
create policy group_members_select_group on public.group_members
for select to authenticated using (public.is_group_member(group_id));

drop policy if exists tasks_select_authenticated on public.tasks;
drop policy if exists tasks_manager_insert on public.tasks;
drop policy if exists tasks_update_status on public.tasks;
drop policy if exists tasks_manager_update on public.tasks;
drop policy if exists tasks_manager_delete on public.tasks;
drop policy if exists tasks_select_group_members on public.tasks;
create policy tasks_select_group_members on public.tasks
for select to authenticated using (
  public.is_group_manager(group_id)
  or (assignee_id = auth.uid() and public.is_group_member(group_id))
);

drop policy if exists tasks_insert_group_managers on public.tasks;
create policy tasks_insert_group_managers on public.tasks
for insert to authenticated with check (
  public.is_group_manager(group_id)
  and exists (
    select 1 from public.group_members
    where group_id = tasks.group_id and user_id = tasks.assignee_id
  )
);

drop policy if exists tasks_update_group_members on public.tasks;
create policy tasks_update_group_members on public.tasks
for update to authenticated
using (public.is_group_manager(group_id) or (auth.uid() = assignee_id and public.is_group_member(group_id)))
with check (public.is_group_manager(group_id) or (auth.uid() = assignee_id and public.is_group_member(group_id)));

drop policy if exists activity_logs_select_group_managers on public.activity_logs;
create policy activity_logs_select_group_managers on public.activity_logs
for select to authenticated using (public.is_group_manager(group_id));

revoke all on public.profiles, public.groups, public.group_members, public.tasks, public.activity_logs from anon, authenticated;
grant select on public.profiles, public.groups, public.group_members, public.tasks, public.activity_logs to authenticated;
grant insert on public.tasks to authenticated;
grant update (status, completion_report) on public.tasks to authenticated;

revoke all on function public.create_profile_for_new_user() from public;
revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_group_manager(uuid) from public;
revoke all on function public.can_view_profile(uuid) from public;
revoke all on function public.create_group(text) from public;
revoke all on function public.join_group(text) from public;
revoke all on function public.delete_group(uuid) from public;
revoke all on function public.remove_group_member(uuid, uuid, uuid, boolean) from public;
revoke all on function public.leave_group(uuid, uuid) from public;
revoke all on function public.transfer_group_manager(uuid, uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_manager(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
grant execute on function public.delete_group(uuid) to authenticated;
grant execute on function public.remove_group_member(uuid, uuid, uuid, boolean) to authenticated;
grant execute on function public.leave_group(uuid, uuid) to authenticated;
grant execute on function public.transfer_group_manager(uuid, uuid) to authenticated;

drop function if exists public.is_manager();
drop function if exists public.update_task_status(uuid, text);
