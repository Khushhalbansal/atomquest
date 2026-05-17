import { create } from 'zustand';
import { SEED_NOTIFICATIONS, SEED_AUDIT_LOGS } from '../data/seedData';
import { storage, generateId } from '../utils/helpers';

const useNotificationStore = create((set, get) => ({
  notifications: storage.get('notifications', SEED_NOTIFICATIONS),
  auditLogs: storage.get('auditLogs', SEED_AUDIT_LOGS),
  toasts: [],

  // Notifications
  addNotification: (data) => {
    const notification = {
      ...data,
      id: generateId(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    set(state => {
      const notifications = [notification, ...state.notifications];
      storage.set('notifications', notifications);
      return { notifications };
    });
    return notification;
  },

  markAsRead: (notifId) => {
    set(state => {
      const notifications = state.notifications.map(n =>
        n.id === notifId ? { ...n, isRead: true } : n
      );
      storage.set('notifications', notifications);
      return { notifications };
    });
  },

  markAllAsRead: (userId) => {
    set(state => {
      const notifications = state.notifications.map(n =>
        n.userId === userId ? { ...n, isRead: true } : n
      );
      storage.set('notifications', notifications);
      return { notifications };
    });
  },

  getUnreadCount: (userId) => {
    return get().notifications.filter(n => n.userId === userId && !n.isRead).length;
  },

  getUserNotifications: (userId) => {
    return get().notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Audit Logs
  logAction: (data) => {
    const log = {
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    set(state => {
      const auditLogs = [log, ...state.auditLogs];
      storage.set('auditLogs', auditLogs);
      return { auditLogs };
    });
    return log;
  },

  getAuditLogs: (filters = {}) => {
    let logs = get().auditLogs;
    if (filters.entityType) logs = logs.filter(l => l.entityType === filters.entityType);
    if (filters.entityId) logs = logs.filter(l => l.entityId === filters.entityId);
    if (filters.userId) logs = logs.filter(l => l.userId === filters.userId);
    if (filters.action) logs = logs.filter(l => l.action === filters.action);
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // Toasts
  addToast: (toast) => {
    const id = generateId();
    const t = { ...toast, id };
    set(state => ({ toasts: [...state.toasts, t] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t2 => t2.id !== id) }));
    }, toast.duration || 4000);
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  resetToSeed: () => {
    storage.set('notifications', SEED_NOTIFICATIONS);
    storage.set('auditLogs', SEED_AUDIT_LOGS);
    set({ notifications: SEED_NOTIFICATIONS, auditLogs: SEED_AUDIT_LOGS });
  },
}));

export default useNotificationStore;
