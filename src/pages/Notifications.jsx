import { useMemo } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, Target, Award } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useNotificationStore from '../stores/notificationStore';
import { timeAgo } from '../utils/helpers';
import { NOTIFICATION_TYPES } from '../utils/constants';
import './Notifications.css';

const ICON_MAP = {
  [NOTIFICATION_TYPES.APPROVAL_REQUESTED]: Clock,
  [NOTIFICATION_TYPES.GOAL_APPROVED]: Check,
  [NOTIFICATION_TYPES.GOAL_REJECTED]: AlertTriangle,
  [NOTIFICATION_TYPES.DEADLINE_WARNING]: Clock,
  [NOTIFICATION_TYPES.PROGRESS_REMINDER]: Target,
  [NOTIFICATION_TYPES.ESCALATION]: AlertTriangle,
};

const COLOR_MAP = {
  [NOTIFICATION_TYPES.APPROVAL_REQUESTED]: 'var(--accent-warning)',
  [NOTIFICATION_TYPES.GOAL_APPROVED]: 'var(--accent-success)',
  [NOTIFICATION_TYPES.GOAL_REJECTED]: 'var(--accent-danger)',
  [NOTIFICATION_TYPES.DEADLINE_WARNING]: 'var(--accent-warning)',
  [NOTIFICATION_TYPES.PROGRESS_REMINDER]: 'var(--accent-info)',
  [NOTIFICATION_TYPES.ESCALATION]: 'var(--accent-danger)',
};

export default function Notifications() {
  const { currentUser } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  const userNotifs = useMemo(() =>
    notifications
      .filter(n => n.userId === currentUser?.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [notifications, currentUser?.id]
  );

  const unreadCount = userNotifs.filter(n => !n.isRead).length;

  return (
    <div className="notif-page">
      <div className="notif-header glass-card-static animate-fade-in">
        <div className="notif-header-left">
          <Bell size={20} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2>Notifications</h2>
            <p>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-ghost"
            onClick={() => markAllAsRead(currentUser?.id)}
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="notif-list stagger-children">
        {userNotifs.length === 0 ? (
          <div className="empty-state glass-card-static">
            <div className="empty-state-icon">
              <Bell size={32} />
            </div>
            <h3>No Notifications</h3>
            <p>You're all caught up! We'll notify you of important updates here.</p>
          </div>
        ) : (
          userNotifs.map(notif => {
            const Icon = ICON_MAP[notif.type] || Bell;
            const color = COLOR_MAP[notif.type] || 'var(--text-muted)';
            return (
              <div
                key={notif.id}
                className={`notif-card glass-card ${!notif.isRead ? 'notif-unread' : ''}`}
              >
                <div className="notif-icon" style={{ color, background: `${color}15` }}>
                  <Icon size={18} />
                </div>
                <div className="notif-content">
                  <h4 className="notif-title">{notif.title}</h4>
                  <p className="notif-message">{notif.message}</p>
                  <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                </div>
                {!notif.isRead && (
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => markAsRead(notif.id)}
                    aria-label="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
