import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';

const typeIcon = (type) => ({
  leave_applied: '📤', leave_approved: '✅', leave_rejected: '❌',
  lecture_reassigned: '🔄', substitution_assigned: '👨‍🏫', general: '📢'
}[type] || '🔔');

const typeBadge = (type) => {
  const map = {
    leave_applied: 'badge-info', leave_approved: 'badge-success',
    leave_rejected: 'badge-danger', lecture_reassigned: 'badge-purple',
    substitution_assigned: 'badge-warning', general: 'badge-gray'
  };
  return map[type] || 'badge-gray';
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [meta, setMeta] = useState({ total: 0, unread: 0 });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ unread_only: unreadOnly, limit: 50 });
      setNotifications(res.data.data || []);
      setMeta(res.data.meta || { total: 0, unread: 0 });
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchNotifications(); }, [unreadOnly]);

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch { toast.error('Failed to mark notifications as read'); }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      fetchNotifications();
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id);
      toast.success('Notification deleted');
      fetchNotifications();
    } catch { toast.error('Failed to delete notification'); }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Layout title="Notifications">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Notifications</h1>
            <p>{meta.unread > 0 ? `${meta.unread} unread notification${meta.unread !== 1 ? 's' : ''}` : 'All caught up!'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>
              <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} />
              Unread only
            </label>
            {meta.unread > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>✓ Mark all read</button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <div className="empty-state-icon">🔔</div>
            <h3>No notifications</h3>
            <p>{unreadOnly ? 'No unread notifications' : 'You have no notifications yet'}</p>
          </div>
        ) : (
          <div>
            {notifications.map(n => (
              <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)}
                style={{
                  padding: '16px 20px', borderBottom: '1px solid var(--gray-100)',
                  background: n.is_read ? 'white' : '#f0f4ff',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  cursor: n.is_read ? 'default' : 'pointer',
                  transition: 'background 0.15s'
                }}>
                <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{typeIcon(n.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: n.is_read ? 600 : 800, fontSize: 14, color: 'var(--gray-900)' }}>{n.title}</span>
                    <span className={`badge ${typeBadge(n.type)}`} style={{ fontSize: 10 }}>{n.type.replace(/_/g, ' ')}</span>
                    {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--gray-600)', margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                  <span style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>{timeAgo(n.created_at)}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                  title="Delete" style={{ padding: '4px 8px', color: 'var(--gray-400)' }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
