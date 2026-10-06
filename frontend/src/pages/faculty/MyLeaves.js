import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { leaveAPI } from '../../services/api';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-gray' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

const MyLeaves = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchLeaves = async () => {
    try {
      const res = await leaveAPI.getAll({});
      setLeaves(res.data.data || []);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await leaveAPI.cancel(id);
      toast.success('Leave cancelled');
      fetchLeaves();
    } catch (err) { toast.error(err.message); }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await leaveAPI.getById(id);
      setSelected(res.data.data);
    } catch { toast.error('Failed to load details'); }
  };

  const filtered = filter ? leaves.filter(l => l.status === filter) : leaves;

  if (loading) return <Layout title="My Leaves"><div className="loading-spinner"><div className="spinner" /></div></Layout>;

  return (
    <Layout title="My Leaves">
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>My Leave Requests</h1><p>Track all your leave applications</p></div>
          <button className="btn btn-primary" onClick={() => navigate('/faculty/apply-leave')}>+ Apply Leave</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Leave History ({filtered.length})</h3>
          <select className="form-control" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Status</option>
            {['pending','approved','rejected','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No leave requests</h3><p>Apply for your first leave</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>#</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Applied On</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={l.id}>
                    <td>{i + 1}</td>
                    <td><span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{l.leave_type}</span></td>
                    <td>{l.start_date}</td>
                    <td>{l.end_date}</td>
                    <td><strong>{l.total_days}</strong></td>
                    <td>{statusBadge(l.status)}</td>
                    <td>{new Date(l.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetails(l.id)}>Details</button>
                        {l.status === 'pending' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancel(l.id)}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Leave Request Details</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[['Type', selected.leave_type], ['Status', selected.status], ['From', selected.start_date], ['To', selected.end_date], ['Total Days', selected.total_days], ['Applied', new Date(selected.created_at).toLocaleDateString()]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Reason</div>
                <div style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 8, fontSize: 13 }}>{selected.reason}</div>
              </div>
              {selected.hod_remarks && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>HOD Remarks</div>
                  <div style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 8, fontSize: 13 }}>{selected.hod_remarks}</div>
                </div>
              )}
              {selected.reassignments?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🔄 Lecture Reassignments ({selected.reassignments.length})</div>
                  {selected.reassignments.map(r => (
                    <div key={r.id} style={{ background: r.substitute_faculty_name ? '#d1fae5' : '#fef3c7', padding: 10, borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                      <strong>{r.subject_name}</strong> on {r.reassignment_date} ({r.start_time?.slice(0,5)}-{r.end_time?.slice(0,5)})
                      {r.substitute_faculty_name ? <span style={{ color: '#065f46' }}> → Assigned to: <strong>{r.substitute_faculty_name}</strong></span>
                        : <span style={{ color: '#92400e' }}> → No substitute found</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyLeaves;
