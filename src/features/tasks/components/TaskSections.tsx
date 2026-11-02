import React from 'react';
import { Badge, Button, Center, Group, Loader, Paper, Stack, Tabs, Text, TextInput, Title } from '@mantine/core';
import { Icon } from '../../../components/Icon';
import { MyTaskFilter, Task, TaskCounts, TaskStatus, TaskViewFilter } from '../taskTypes';
import { GroupTaskRow } from './GroupTaskRow';
import { TaskRow } from './TaskRow';

const taskFilters: Array<[TaskViewFilter, string]> = [['all', 'Tất cả'], ['todo', 'Chưa bắt đầu'], ['in_progress', 'Đang thực hiện'], ['done', 'Đã hoàn thành']];
type MyTasksSectionProps = { tasks: Task[]; filter: MyTaskFilter; onFilterChange: (filter: MyTaskFilter) => void; loading: boolean; savingTaskId: string | null; canUpdateTask: (task: Task) => boolean; onStatusChange: (task: Task, status: TaskStatus) => void; onViewDetails: (task: Task) => void };

export const MyTasksSection = React.memo(function MyTasksSection({ tasks, filter, onFilterChange, loading, savingTaskId, canUpdateTask, onStatusChange, onViewDetails }: MyTasksSectionProps) {
  const activeCount = tasks.reduce((count, task) => count + Number(task.status !== 'done'), 0);
  const doneCount = tasks.length - activeCount;
  const visibleTasks = tasks.filter((task) => filter === 'done' ? task.status === 'done' : task.status !== 'done');
  return (
    <Paper withBorder radius={0} style={{ overflow: 'hidden' }} aria-label="Việc của tôi">
      <Group p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}><Title order={2} size="h3">Việc của tôi</Title></Group>
      <Tabs value={filter} onChange={(value) => { if (value) onFilterChange(value as MyTaskFilter); }}>
        <Tabs.List px="md" aria-label="Lọc việc của tôi">
          <Tabs.Tab value="active" rightSection={<Badge size="sm" variant="light">{activeCount}</Badge>}>Đang làm</Tabs.Tab>
          <Tabs.Tab value="done" rightSection={<Badge size="sm" variant="light">{doneCount}</Badge>}>Đã hoàn thành</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {loading ? <Center mih={128} role="status"><Group gap="sm"><Loader size="sm" /><Text size="sm" c="dimmed">Đang tải công việc...</Text></Group></Center>
        : visibleTasks.length ? visibleTasks.map((task) => <TaskRow key={task.id} task={task} isSaving={savingTaskId === task.id} canUpdateStatus={canUpdateTask(task)} onStatusChange={onStatusChange} onViewDetails={onViewDetails} />)
          : <Center mih={128} px="md"><Text size="sm" c="dimmed" ta="center">{filter === 'done' ? 'Chưa có công việc đã hoàn thành' : 'Chưa có công việc cần làm'}</Text></Center>}
    </Paper>
  );
});

type GroupTasksSectionProps = { tasks: Task[]; totalTasks: number; counts: TaskCounts; filter: TaskViewFilter; onFilterChange: (filter: TaskViewFilter) => void; search: string; onSearchChange: (search: string) => void; sortAscending: boolean; onSortToggle: () => void; loading: boolean; onViewDetails: (task: Task) => void };

export const GroupTasksSection = React.memo(function GroupTasksSection({ tasks, totalTasks, counts, filter, onFilterChange, search, onSearchChange, sortAscending, onSortToggle, loading, onViewDetails }: GroupTasksSectionProps) {
  return (
    <Paper withBorder radius={0} style={{ overflow: 'hidden' }}>
      <Stack gap={0}>
        <Group justify="space-between" p="md" align="end" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Title order={2} size="h3">Danh sách công việc</Title>
          <TextInput aria-label="Tìm công việc" placeholder="Tìm tên việc hoặc người phụ trách" leftSection={<Icon name="search" size={18} />} value={search} onChange={(event) => onSearchChange(event.currentTarget.value)} w={{ base: '100%', sm: 320 }} />
        </Group>
        <Group justify="space-between" px="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Tabs value={filter} onChange={(value) => { if (value) onFilterChange(value as TaskViewFilter); }}>
            <Tabs.List aria-label="Lọc danh sách công việc">
              {taskFilters.map(([key, label]) => <Tabs.Tab key={key} value={key} rightSection={<Badge size="sm" variant="light">{counts[key]}</Badge>}>{label}</Tabs.Tab>)}
            </Tabs.List>
          </Tabs>
          <Button variant="default" size="xs" leftSection={<Icon name="calendar" size={16} />} onClick={onSortToggle}>{sortAscending ? 'Hạn gần trước' : 'Hạn xa trước'}</Button>
        </Group>
        {loading ? <Center mih={176} role="status"><Group gap="sm"><Loader size="sm" /><Text size="sm" c="dimmed">Đang tải công việc...</Text></Group></Center>
          : tasks.length ? tasks.map((task) => <GroupTaskRow key={task.id} task={task} onViewDetails={onViewDetails} />)
            : <Center mih={176} px="md"><Stack align="center" gap="xs"><Text c="violet"><Icon name="tasks" size={28} /></Text><Text fw={500}>Chưa có công việc phù hợp</Text><Text size="sm" c="dimmed" ta="center">Hãy đổi mục lọc hoặc bấm “Giao việc mới” để tạo việc.</Text></Stack></Center>}
        <Group justify="space-between" px="md" py="sm" gap="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Text size="xs" c="dimmed">Đang hiển thị <Text component="span" fw={600} c="dark">{tasks.length}</Text> / <Text component="span" fw={600} c="dark">{totalTasks}</Text> công việc</Text>
          <Badge color="green" variant="dot" radius={0}>Đã đồng bộ</Badge>
        </Group>
      </Stack>
    </Paper>
  );
});
