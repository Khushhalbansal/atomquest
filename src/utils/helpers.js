import { v4 as uuidv4 } from 'uuid';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';

export const generateId = () => uuidv4();

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM d, yyyy');
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
};

export const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  return isBefore(new Date(dateStr), new Date());
};

export const isDueSoon = (dateStr, days = 7) => {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  const now = new Date();
  return isAfter(target, now) && isBefore(target, addDays(now, days));
};

export const getScoreLabel = (score) => {
  if (score >= 4.5) return 'Exceptional';
  if (score >= 3.5) return 'Exceeds Expectations';
  if (score >= 2.5) return 'Meets Expectations';
  if (score >= 1.5) return 'Needs Improvement';
  return 'Below Expectations';
};

export const getScoreColor = (score) => {
  if (score >= 4.5) return 'var(--accent-success)';
  if (score >= 3.5) return 'var(--accent-info)';
  if (score >= 2.5) return 'var(--accent-primary)';
  if (score >= 1.5) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
};

export const getProgressColor = (progress) => {
  if (progress >= 80) return 'var(--accent-success)';
  if (progress >= 50) return 'var(--accent-primary)';
  if (progress >= 25) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');

export const truncate = (str, len = 80) => {
  if (!str || str.length <= len) return str;
  return str.slice(0, len) + '…';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
};

export const getAvatarColor = (name) => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const storage = {
  get: (key, fallback = null) => {
    try {
      const item = localStorage.getItem(`atomquest_${key}`);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(`atomquest_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  },
  remove: (key) => {
    localStorage.removeItem(`atomquest_${key}`);
  },
};
