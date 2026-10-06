import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { leaveAPI, reassignmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const HODDashboard = () => {
  const navigate = useNavigate();
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [recentReassignments, setRecentReassignments] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, reassignments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [leavesRes, allLeavesRes, reassignRes] = await Promise.all([
          leaveAPI.getAll({ status: 'pending', limit: 5 }),
          leaveAPI.getAll({ limit: 100 }),
          reassignmentAPI.getAll({ limit: 5 }),
        ]);
        const pending = leavesRes.data.data || [];
        const all = allLeavesRes.data.data || [];
        const reas = reassignRes.data.data || [];
        setPendingLeaves(pending);
        setRecentReassignments(reas.slice(0, 5));
        setStats({
          pending: all.filter(l => l.status === 'pending').length,
          approved: all.filter(l => l.status === 'approved').length,
          rejected: all.filter(l => l.status === 'rejected').length,
          reassignments: reas.length,
        });
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <Layout title="HOD Dashboard"><div className="loading-spinner"><div className="spinner" /></div></Layout>;

  return (
    <Layout title="HOD Dashboard">
      <div className="page-header">
        <h1>HOD Dashboard 📊</h1>
        <p>Manage leave approvals and lecture rescheduling</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Pending Approvals', value: stats.pending, icon: '⏳', bg: '#fef3c7', color: '#92400e', action: () => navigate('/hod/leave-approvals') },
          { label: 'Approved Leaves', value: stats.approved, icon: '✅', bg: '#d1fae5', color: '#065f46' },
          { label: 'Rejected Leaves', value: stats.rejected, icon: '❌', bg: '#fee2e2', color: '#991b1b' },
          { label: 'Reassignments', value: stats.reassignments, icon: '🔄', bg: '#dbeafe', color: '#1e40af' },
        ].map(s => (
          <div className="stat-card" key={s.label} onClick={s.action} style={{ cursor: s.action ? 'pointer' : 'default' }}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Pending Leaves */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⏳ Pending Approvals</h3>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/hod/leave-approvals')}>View All</button>
          </div>
          <div style={{ padding: 0 }}>
            {pendingLeaves.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>
                <div>🎉</div><p>No pending requests</p>
              </div>
            ) : pendingLeaves.map(l => (
              <div key={l.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{l.faculty_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{l.leave_type} • {l.start_date} → {l.end_date} ({l.total_days}d)</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/hod/leave-approvals')}>Review</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reassignments */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔄 Recent Reassignments</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/hod/reassignments')}>View All</button>
          </div>
          <div style={{ padding: 0 }}>
            {recentReassignments.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}><p>No reassignments yet</p></div>
            ) : recentReassignments.map(r => (
              <div key={r.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.subject_name}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                  {r.reassignment_date} • {r.start_time?.slice(0,5)}-{r.end_time?.slice(0,5)}
                </div>
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  <span style={{ color: 'var(--gray-400)' }}>{r.original_faculty_name}</span>
                  <span style={{ margin: '0 6px', color: 'var(--gray-300)' }}>→</span>
                  <span style={{ color: r.substitute_faculty_name ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {r.substitute_faculty_name || 'Unassigned'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HODDashboard;
