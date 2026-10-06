import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navConfig = {
  faculty: [
    { label: 'Dashboard', icon: '⊞', path: '/faculty/dashboard' },
    { label: 'Apply Leave', icon: '📤', path: '/faculty/apply-leave' },
    { label: 'My Leaves', icon: '📋', path: '/faculty/my-leaves' },
    { label: 'My Timetable', icon: '📅', path: '/faculty/timetable' },
    { label: 'Substitution Duties', icon: '🔄', path: '/faculty/substitutions' },
    { label: 'Notifications', icon: '🔔', path: '/notifications', badge: true },
  ],
  hod: [
    { label: 'Dashboard', icon: '⊞', path: '/hod/dashboard' },
    { label: 'Leave Approvals', icon: '✅', path: '/hod/leave-approvals', badge: true },
    { label: 'Reassignments', icon: '🔄', path: '/hod/reassignments' },
    { label: 'Department Timetable', icon: '📅', path: '/hod/timetable' },
    { label: 'Analytics', icon: '📊', path: '/hod/analytics' },
    { label: 'Notifications', icon: '🔔', path: '/notifications', badge: true },
  ],
  admin: [
    { label: 'Dashboard', icon: '⊞', path: '/admin/dashboard' },
    { section: 'Management' },
    { label: 'Faculty', icon: '👥', path: '/admin/faculty' },
    { label: 'Departments', icon: '🏛️', path: '/admin/departments' },
    { label: 'Subjects', icon: '📚', path: '/admin/subjects' },
    { label: 'Timetable', icon: '📅', path: '/admin/timetable' },
    { section: 'Operations' },
    { label: 'All Leaves', icon: '📋', path: '/admin/leaves' },
    { label: 'Reassignments', icon: '🔄', path: '/admin/reassignments' },
    { label: 'Analytics', icon: '📊', path: '/admin/analytics' },
    { label: 'Notifications', icon: '🔔', path: '/notifications', badge: true },
  ],
};

const Sidebar = ({ unreadCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const navItems = navConfig[user.role] || [];
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const deptLabel = user.department?.name || user.department_name || '';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🎓</div>
        <div>
          <h1>FacultyLeave</h1>
          <span>Management System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} className="nav-section-title" style={{ marginTop: 8 }}>
                {item.section}
              </div>
            );
          }

          const isActive = location.pathname === item.path;
          const showBadge = item.badge && item.path === '/notifications' && unreadCount > 0;
          const showApprovalBadge = item.badge && item.path === '/hod/leave-approvals' && unreadCount > 0;

          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {(showBadge || showApprovalBadge) && (
                <span className="badge" style={{ marginLeft: 'auto' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        {/* Profile link */}
        <button
          className="nav-item"
          style={{ borderRadius: 8, marginBottom: 8, width: '100%' }}
          onClick={() => navigate('/profile')}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
            color: 'white', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'var(--gray-900)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'capitalize' }}>
              {user.role}{deptLabel ? ` • ${deptLabel.split(' ')[0]}` : ''}
            </div>
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm btn-full"
          style={{ justifyContent: 'center', gap: 6 }}
        >
          <span>↪</span> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
