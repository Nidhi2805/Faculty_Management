import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { timetableAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-gray' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_leaves: 0, approved: 0, pending: 0, rejected: 0, total_days_taken: 0, weekly_lectures: 0, total_substitutions: 0 });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingSubs, setUpcomingSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = days[new Date().getDay()];

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ttRes] = await Promise.all([
          api.get('/faculty/dashboard-stats'),
          timetableAPI.getAll({ day: today }),
        ]);
        const data = statsRes.data.data;
        setStats(data.leave_stats || {});
        setRecentLeaves(data.recent_leaves || []);
        setUpcomingSubs(data.upcoming_substitutions || []);
        setTodayClasses(ttRes.data.data || []);
        // Patch weekly_lectures and total_substitutions into stats
        setStats(prev => ({
          ...prev,
          weekly_lectures: data.weekly_lectures,
          total_substitutions: data.total_substitutions,
        }));
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [today]);

  if (loading) return <Layout title="Faculty Dashboard"><div className="loading-spinner"><div className="spinner" /></div></Layout>;

  return (
    <Layout title="Faculty Dashboard">
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ').slice(0, 2).join(' ')}! 👋</h1>
        <p>Here's your academic schedule and leave summary for today ({today})</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Leaves', value: stats.total_leaves || 0, icon: '📋', bg: '#eef2ff', color: '#4f46e5' },
          { label: 'Approved', value: stats.approved || 0, icon: '✅', bg: '#d1fae5', color: '#065f46' },
          { label: 'Pending', value: stats.pending || 0, icon: '⏳', bg: '#fef3c7', color: '#92400e' },
          { label: 'Days Taken', value: stats.total_days_taken || 0, icon: '📆', bg: '#fee2e2', color: '#991b1b' },
          { label: "Today's Classes", value: todayClasses.length, icon: '🏫', bg: '#dbeafe', color: '#1e40af' },
          { label: 'Weekly Lectures', value: stats.weekly_lectures || 0, icon: '📅', bg: '#ede9fe', color: '#5b21b6' },
          { label: 'Sub Duties Done', value: stats.total_substitutions || 0, icon: '🔄', bg: '#fce7f3', color: '#9d174d' },
          { label: 'Rejected', value: stats.rejected || 0, icon: '❌', bg: '#f3f4f6', color: '#374151' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Today's Classes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📅 Today's Classes</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/faculty/timetable')}>Full Timetable →</button>
          </div>
          <div>
            {todayClasses.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div style={{ fontSize: 32 }}>🎉</div>
                <p>No classes scheduled today</p>
              </div>
            ) : (
              todayClasses
                .sort((a, b) => a.start_time > b.start_time ? 1 : -1)
                .map(cls => (
                  <div key={cls.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {cls.start_time?.slice(0, 5)}<br />{cls.end_time?.slice(0, 5)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{cls.subject_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        📍 Room {cls.room_number} &nbsp;•&nbsp; Sem {cls.semester} &nbsp;•&nbsp; {cls.subject_code}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-100)', textAlign: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/faculty/apply-leave')}>
              + Apply for Leave
            </button>
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📋 Recent Leave Requests</h3>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/faculty/apply-leave')}>+ Apply</button>
          </div>
          <div>
            {recentLeaves.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div style={{ fontSize: 32 }}>📋</div>
                <p>No leave requests yet</p>
              </div>
            ) : (
              recentLeaves.map(l => (
                <div key={l.id} style={{ padding: '13px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>{l.leave_type} Leave</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      {l.start_date} → {l.end_date} &nbsp;({l.total_days} day{l.total_days !== 1 ? 's' : ''})
                    </div>
                  </div>
                  {statusBadge(l.status)}
                </div>
              ))
            )}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-100)', textAlign: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/faculty/my-leaves')}>
              View All Leaves →
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Substitution Duties */}
      {upcomingSubs.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3 className="card-title">🔄 Upcoming Substitution Duties</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/faculty/substitutions')}>View All →</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Date</th><th>Subject</th><th>Time</th><th>Room</th><th>Covering For</th><th>Status</th></tr>
              </thead>
              <tbody>
                {upcomingSubs.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{s.reassignment_date}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.day_of_week}</div>
                    </td>
                    <td><strong>{s.subject_name}</strong></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</td>
                    <td>{s.room_number}</td>
                    <td>{s.original_faculty_name}</td>
                    <td><span className="badge badge-info">{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FacultyDashboard;
