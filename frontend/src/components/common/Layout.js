import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children, title }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationAPI.getAll({ limit: 1 });
        setUnreadCount(res.data.meta?.unread || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar unreadCount={unreadCount} />
      <div className="main-content">
        <header className="topbar">
          <h2 className="topbar-title">{title || 'Dashboard'}</h2>
          <div className="topbar-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/notifications')}
              style={{ position: 'relative' }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: '#ef4444', color: 'white', borderRadius: '50%',
                  width: '16px', height: '16px', fontSize: '9px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
              <strong>{user?.name}</strong>
              <span style={{ marginLeft: 6, background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
