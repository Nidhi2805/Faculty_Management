import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { leaveAPI } from '../services/api';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-gray' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

const AllLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const fetchLeaves = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filter) params.status = filter;
      const res = await leaveAPI.getAll(params);
      setLeaves(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  }, [filter, page]); // useCallback deps

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleViewDetail = async (id) => {
    try { const r = await leaveAPI.getById(id); setDetail(r.data.data); }
    catch { toast.error('Failed to load details'); }
  };

  return (
    <Layout title="All Leave Records">
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>All Leave Records</h1><p>System-wide leave request history ({total} total)</p></div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['', 'pending', 'approved', 'rejected', 'cancelled'].map(s => (
              <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setFilter(s); setPage(1); }}>{s || 'All'}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : leaves.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No records found</h3></div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>#</th><th>Faculty</th><th>Department</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Applied</th><th>HOD</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {leaves.map((l, i) => (
                    <tr key={l.id}>
                      <td>{(page - 1) * LIMIT + i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{l.faculty_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.employee_id}</div>
                      </td>
                      <td><span className="badge badge-purple">{l.department_name}</span></td>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{l.leave_type}</td>
                      <td>{l.start_date}</td>
                      <td>{l.end_date}</td>
                      <td><strong>{l.total_days}</strong></td>
                      <td>{statusBadge(l.status)}</td>
                      <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                      <td style={{ fontSize: 12 }}>{l.hod_name || '—'}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetail(l.id)}>Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--gray-100)' }}>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Leave Details — {detail.faculty_name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[['Type', detail.leave_type], ['Status', detail.status], ['From', detail.start_date], ['To', detail.end_date], ['Days', detail.total_days], ['Department', detail.department_name]].map(([k, v]) => (
                  <div key={k}><div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{k}</div><div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v}</div></div>
                ))}
              </div>
              <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, marginBottom: 4 }}>REASON</div><div style={{ background: 'var(--gray-50)', padding: 10, borderRadius: 8, fontSize: 13 }}>{detail.reason}</div></div>
              {detail.hod_remarks && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, marginBottom: 4 }}>HOD REMARKS</div><div style={{ background: 'var(--gray-50)', padding: 10, borderRadius: 8, fontSize: 13 }}>{detail.hod_remarks}</div></div>}
              {detail.reassignments?.length > 0 && (
                <div><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔄 Reassignments ({detail.reassignments.length})</div>
                  {detail.reassignments.map(r => (
                    <div key={r.id} style={{ background: r.substitute_faculty_name ? '#d1fae5' : '#fef3c7', padding: 10, borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                      <strong>{r.subject_name}</strong> — {r.reassignment_date} ({r.start_time?.slice(0,5)}–{r.end_time?.slice(0,5)})
                      <div style={{ marginTop: 3 }}>{r.substitute_faculty_name ? <span style={{ color: '#065f46' }}>✅ {r.substitute_faculty_name}</span> : <span style={{ color: '#92400e' }}>⚠️ Unassigned</span>}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button></div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AllLeaves;
