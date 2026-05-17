import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, RefreshCw, LogOut } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import useNotificationStore from '../../stores/notificationStore';
import useGoalStore from '../../stores/goalStore';
import NotificationPanel from '../notifications/NotificationPanel';
import { capitalize } from '../../utils/helpers';
import './Header.css';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/goals': 'My Goals',
  '/goals/new': 'Create Goal',
  '/approvals': 'Approvals',
  '/team': 'Team View',
  '/reports': 'Reports & Analytics',
  '/admin': 'Admin Panel',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const { resetToSeed: resetGoals } = useGoalStore();
  const { resetToSeed: resetNotifs } = useNotificationStore();

  const unreadCount = getUnreadCount(currentUser?.id);
  const pageTitle = PAGE_TITLES[location.pathname] || 'AtomQuest';

  const handleReset = () => {
    resetGoals();
    resetNotifs();
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header" role="banner">
      <div className="header-left">
        <h1 className="page-title">{pageTitle}</h1>
        <span className="header-breadcrumb">
          {currentUser?.department} · {capitalize(currentUser?.role || '')}
        </span>
      </div>

      <div className="header-right">
        <button
          className="header-btn"
          onClick={handleReset}
          title="Reset demo data"
          aria-label="Reset demo data"
        >
          <RefreshCw size={18} />
        </button>

        <div className="notification-wrapper">
          <button
            className="header-btn notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-count" aria-hidden="true">{unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>

        <button
          className="header-btn logout-btn"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={18} />
          <span className="logout-text">LOGOUT</span>
        </button>
      </div>
    </header>
  );
}
