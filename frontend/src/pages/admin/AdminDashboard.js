import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { leaveAPI, adminAPI, reassignmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ faculty: 0, departments: 0, subjects: 0, pending: 0, approved: 0, reassignments: 0 });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [leavesRes, facultyRes, deptRes, subjectRes, reassignRes] = await Promise.all([
          leaveAPI.getAll({ limit: 6 }),
          adminAPI.getFaculty({}),
          adminAPI.getDepartments(),
          adminAPI.getSubjects({}),
          reassignmentAPI.getAll({ limit: 100 }),
        ]);
        const leaves = leavesRes.data.data || [];
        setRecentLeaves(leaves);
        setStats({
          faculty: (facultyRes.data.data || []).filter(f => f.role === 'faculty').length,
          departments: (deptRes.data.data || []).length,
          subjects: (subjectRes.data.data || []).length,
          pending: leaves.filter(l => l.status === 'pending').length,
          approved: leaves.filter(l => l.status === 'approved').length,
          reassignments: (reassignRes.data.data || []).length,
        });
      } catch { toast.error('Failed to load dashboard data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <Layout title="Admin Dashboard"><div className="loading-spinner"><div className="spinner" /></div></Layout>;

  const quickActions = [
    { label: 'Manage Faculty', icon: '👥', path: '/admin/faculty', color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Departments', icon: '🏛️', path: '/admin/departments', color: '#0ea5e9', bg: '#e0f2fe' },
    { label: 'Subjects', icon: '📚', path: '/admin/subjects', color: '#10b981', bg: '#d1fae5' },
    { label: 'Timetable', icon: '📅', path: '/admin/timetable', color: '#f59e0b', bg: '#fef3c7' },
    { label: 'All Leaves', icon: '📋', path: '/admin/leaves', color: '#8b5cf6', bg: '#ede9fe' },
    { label: 'Analytics', icon: '📊', path: '/admin/analytics', color: '#ec4899', bg: '#fce7f3' },
  ];

  return (
    <Layout title="Admin Dashboard">
      <div className="page-header">
        <h1>Admin Dashboard ⚙️</h1>
        <p>System-wide management and oversight</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Faculty Members', value: stats.faculty, icon: '👥', bg: '#eef2ff', color: '#4f46e5' },
          { label: 'Departments', value: stats.departments, icon: '🏛️', bg: '#e0f2fe', color: '#0369a1' },
          { label: 'Subjects', value: stats.subjects, icon: '📚', bg: '#d1fae5', color: '#065f46' },
          { label: 'Pending Leaves', value: stats.pending, icon: '⏳', bg: '#fef3c7', color: '#92400e' },
          { label: 'Approved Leaves', value: stats.approved, icon: '✅', bg: '#d1fae5', color: '#065f46' },
          { label: 'Reassignments', value: stats.reassignments, icon: '🔄', bg: '#dbeafe', color: '#1e40af' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3 className="card-title">⚡ Quick Actions</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {quickActions.map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                style={{ padding: '16px 12px', border: `1.5px solid ${a.bg}`, borderRadius: 10, background: a.bg, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: a.color }}>{a.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leaves Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📋 Recent Leave Requests</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/leaves')}>View All →</button>
        </div>
        {recentLeaves.length === 0 ? (
          <div className="empty-state"><p>No leave requests</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Faculty</th><th>Department</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th></tr></thead>
              <tbody>
                {recentLeaves.map(l => (
                  <tr key={l.id}>
                    <td><div style={{ fontWeight: 700 }}>{l.faculty_name}</div><div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.employee_id}</div></td>
                    <td><span className="badge badge-purple">{l.department_name}</span></td>
                    <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{l.leave_type}</td>
                    <td style={{ fontSize: 12 }}>{l.start_date} → {l.end_date}</td>
                    <td><strong>{l.total_days}</strong></td>
                    <td>
                      <span className={`badge ${{ pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-gray' }[l.status]}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
