import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabaseClient';

type TaskNotification = {
  id: string;
  title: string;
  assignee_id: string;
};

function isTaskNotification(value: unknown): value is TaskNotification {
  if (!value || typeof value !== 'object') return false;
  const task = value as Record<string, unknown>;
  return typeof task.id === 'string'
    && typeof task.title === 'string'
    && typeof task.assignee_id === 'string';
}

export function useTaskNotifications(userId: string) {
  const [enabled, setEnabled] = useState(() => (
    typeof window !== 'undefined'
    && 'Notification' in window
    && window.Notification.permission === 'granted'
    && window.localStorage.getItem(`teamflow.task-notifications.${userId}`) === 'enabled'
  ));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return;
    if (!supabase) {
      setError('Chưa cấu hình kết nối Supabase.');
      return;
    }
    const client = supabase;
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      setEnabled(false);
      setError('Trình duyệt chưa cấp quyền thông báo. Hãy bật quyền trong cài đặt trang web.');
      return;
    }

    const channel = supabase
      .channel(`task-notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks',
        filter: `assignee_id=eq.${userId}`,
      }, (payload) => {
        if (!isTaskNotification(payload.new)) return;
        try {
          const notification = new Notification('Bạn được giao công việc mới', {
            body: payload.new.title,
            icon: `${import.meta.env.BASE_URL}logo.png`,
            tag: `teamflow-task-${payload.new.id}`,
          });
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Không thể hiển thị thông báo công việc.');
        }
      })
      .subscribe((status, caught) => {
        if (status === 'SUBSCRIBED') {
          setError('');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError(caught?.message || 'Không thể kết nối thông báo công việc realtime.');
        }
      });

    return () => {
      void client.removeChannel(channel);
    };
  }, [enabled, userId]);

  async function enable() {
    setError('');
    if (!('Notification' in window)) {
      setError('Trình duyệt này không hỗ trợ thông báo.');
      return;
    }

    try {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
      if (permission !== 'granted') {
        setError(permission === 'denied'
          ? 'Quyền thông báo đang bị chặn. Hãy bật lại trong cài đặt trang web của trình duyệt.'
          : 'Bạn chưa cấp quyền thông báo.');
        return;
      }

      window.localStorage.setItem(`teamflow.task-notifications.${userId}`, 'enabled');
      setEnabled(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể bật thông báo.');
    }
  }

  function disable() {
    try {
      window.localStorage.removeItem(`teamflow.task-notifications.${userId}`);
      setEnabled(false);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể tắt thông báo.');
    }
  }

  return { enabled, supported: typeof window !== 'undefined' && 'Notification' in window, error, enable, disable };
}
