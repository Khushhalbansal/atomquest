import { useEffect, useRef } from 'react';
import { Bell, Check, AlertTriangle, Clock, TrendingUp, X, CheckCheck } from 'lucide-react';
import useNotificationStore from '../../stores/notificationStore';
import useAuthStore from '../../stores/authStore';
import { timeAgo } from '../../utils/helpers';
import { NOTIFICATION_TYPES } from '../../utils/constants';
import './NotificationPanel.css';

const TYPE_ICONS = {
  [NOTIFICATION_TYPES.APPROVAL_REQUESTED]: { icon: Clock, color: 'var(--accent-warning)' },
  [NOTIFICATION_TYPES.GOAL_APPROVED]: { icon: Check, color: 'var(--accent-success)' },
  [NOTIFICATION_TYPES.GOAL_REJECTED]: { icon: X, color: 'var(--accent-danger)' },
  [NOTIFICATION_TYPES.DEADLINE_WARNING]: { icon: AlertTriangle, color: 'var(--accent-warning)' },
  [NOTIFICATION_TYPES.ESCALATION]: { icon: AlertTriangle, color: 'var(--accent-danger)' },
  [NOTIFICATION_TYPES.PROGRESS_REMINDER]: { icon: TrendingUp, color: 'var(--accent-info)' },
};

export default function NotificationPanel({ onClose }) {
  const { currentUser } = useAuthStore();
  const { getUserNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const panelRef = useRef(null);

  const notifications = getUserNotifications(currentUser?.id);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="notif-panel animate-fade-in-down" ref={panelRef} role="dialog" aria-label="Notifications">
      <div className="notif-header">
        <h3>Notifications</h3>
        <button
          className="notif-mark-all"
          onClick={() => markAllAsRead(currentUser?.id)}
          aria-label="Mark all as read"
        >
          <CheckCheck size={14} />
          Mark all read
        </button>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <Bell size={24} />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map(notif => {
            const typeConfig = TYPE_ICONS[notif.type] || { icon: Bell, color: 'var(--text-muted)' };
            const Icon = typeConfig.icon;
            return (
              <button
                key={notif.id}
                className={`notif-item ${!notif.isRead ? 'notif-unread' : ''}`}
                onClick={() => markAsRead(notif.id)}
                aria-label={`${notif.isRead ? '' : 'Unread: '}${notif.title}`}
              >
                <div className="notif-icon" style={{ color: typeConfig.color }}>
                  <Icon size={16} />
                </div>
                <div className="notif-content">
                  <div className="notif-title">{notif.title}</div>
                  <div className="notif-message">{notif.message}</div>
                  <div className="notif-time">{timeAgo(notif.createdAt)}</div>
                </div>
                {!notif.isRead && <div className="notif-dot" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
