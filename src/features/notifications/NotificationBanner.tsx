import React from 'react';
import './NotificationBanner.css';

type Props = {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
};

export function NotificationBanner({ message, onRetry, onDismiss }: Props) {
  return (
    <div className="notification-banner" role="alert">
      <span>{message}</span>
      <button type="button" onClick={onRetry}>Thử lại</button>
      <button type="button" onClick={onDismiss} aria-label="Đóng thông báo">×</button>
    </div>
  );
}
