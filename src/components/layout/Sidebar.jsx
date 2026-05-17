import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Target, CheckSquare, Users, BarChart3,
  Shield, Bell, Settings, LogOut, ChevronLeft, ChevronRight, Atom
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import useNotificationStore from '../../stores/notificationStore';
import { ROLES } from '../../utils/constants';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: 'all' },
  { path: '/goals', icon: Target, label: 'My Goals', roles: 'all' },
  { path: '/approvals', icon: CheckSquare, label: 'Approvals', roles: [ROLES.MANAGER, ROLES.ADMIN] },
  { path: '/team', icon: Users, label: 'Team View', roles: [ROLES.MANAGER, ROLES.ADMIN] },
  { path: '/reports', icon: BarChart3, label: 'Reports', roles: 'all' },
  { path: '/admin', icon: Shield, label: 'Admin Panel', roles: [ROLES.ADMIN] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, switchUser } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const { users } = useAuthStore();
  const unreadCount = getUnreadCount(currentUser?.id);
  const location = useLocation();

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.roles === 'all') return true;
    return item.roles.includes(currentUser?.role);
  });

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`} role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Atom size={24} />
        </div>
        {!collapsed && <span className="logo-text">AtomQuest</span>}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {visibleNavItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            title={collapsed ? item.label : undefined}
            end={item.path === '/'}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
            {item.path === '/approvals' && !collapsed && (
              <span className="nav-badge" style={{ display: 'none' }}></span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Role Switcher (Demo) */}
      {!collapsed && (
        <div className="sidebar-demo">
          <div className="demo-label">Demo — Switch User</div>
          <div className="demo-users">
            {users.map(user => (
              <button
                key={user.id}
                className={`demo-user-btn ${currentUser?.id === user.id ? 'active' : ''}`}
                onClick={() => switchUser(user.id)}
                title={`${user.name} (${user.role})`}
              >
                <div
                  className="demo-avatar"
                  style={{ background: getAvatarColor(user.name) }}
                >
                  {getInitials(user.name)}
                </div>
                <div className="demo-user-info">
                  <span className="demo-user-name">{user.name.split(' ')[0]}</span>
                  <span className="demo-user-role">{user.role}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current User */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div
            className="user-avatar"
            style={{ background: getAvatarColor(currentUser?.name || '') }}
          >
            {getInitials(currentUser?.name || '')}
          </div>
          {!collapsed && (
            <div className="user-info">
              <span className="user-name">{currentUser?.name}</span>
              <span className="user-role">{currentUser?.role}</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
