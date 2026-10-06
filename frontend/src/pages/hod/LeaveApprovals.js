import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { leaveAPI } from '../../services/api';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-gray' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

const LeaveApprovals = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: 'approved', hod_remarks: '' });
  const [reviewing, setReviewing] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await leaveAPI.getAll(params);
      setLeaves(res.data.data || []);
    } catch { toast.error('Failed to load leave requests'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLeaves(); }, [filter]);

  const handleReview = async () => {
    if (!selected) return;
    if (!reviewForm.hod_remarks.trim()) {
      toast.error('Please provide remarks before submitting');
      return;
    }
    setReviewing(true);
    try {
      const res = await leaveAPI.review(selected.id, reviewForm);
      const data = res.data;
      toast.success(`Leave ${reviewForm.status} successfully!`);
      if (reviewForm.status === 'approved' && data.data?.reassignments_created > 0) {
        toast.success(`✅ ${data.data.reassignments_created} lecture(s) automatically rescheduled!`, { duration: 5000 });
      }
      setSelected(null);
      setReviewForm({ status: 'approved', hod_remarks: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.message || 'Failed to review leave');
    } finally { setReviewing(false); }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await leaveAPI.getById(id);
      setDetailModal(res.data.data);
    } catch { toast.error('Failed to load details'); }
  };

  return (
    <Layout title="Leave Approvals">
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>Leave Approvals</h1><p>Review and process faculty leave requests</p></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Leave Requests</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {['pending', 'approved', 'rejected', ''].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : leaves.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No leave requests</h3></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Faculty</th><th>Department</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Applied</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{l.faculty_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{l.employee_id}</div>
                    </td>
                    <td><span className="badge badge-purple">{l.department_name}</span></td>
                    <td><span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{l.leave_type}</span></td>
                    <td>{l.start_date}</td>
                    <td>{l.end_date}</td>
                    <td><strong>{l.total_days}</strong></td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--gray-600)' }} title={l.reason}>{l.reason}</div>
                    </td>
                    <td>{statusBadge(l.status)}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetails(l.id)}>Details</button>
                        {l.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" onClick={() => { setSelected(l); setReviewForm({ status: 'approved', hod_remarks: '' }); }}>Review</button>
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

      {/* Review Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Review Leave Request</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{selected.faculty_name}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                  {selected.leave_type} Leave • {selected.start_date} to {selected.end_date} ({selected.total_days} days)
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 6 }}>{selected.reason}</div>
              </div>

              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                🔄 If approved, the system will <strong>automatically detect affected lectures</strong> and assign substitute faculty based on subject expertise, availability, and workload balance.
              </div>

              <div className="form-group">
                <label className="form-label">Decision *</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['approved', 'rejected'].map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, padding: '10px 14px', border: `2px solid ${reviewForm.status === s ? (s === 'approved' ? 'var(--success)' : 'var(--danger)') : 'var(--gray-200)'}`, borderRadius: 8, background: reviewForm.status === s ? (s === 'approved' ? '#d1fae5' : '#fee2e2') : 'white' }}>
                      <input type="radio" name="status" value={s} checked={reviewForm.status === s} onChange={e => setReviewForm({ ...reviewForm, status: e.target.value })} />
                      <span style={{ fontWeight: 600, textTransform: 'capitalize', color: s === 'approved' ? '#065f46' : '#991b1b' }}>{s === 'approved' ? '✅ Approve' : '❌ Reject'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks *</label>
                <textarea className="form-control" rows={3} placeholder="Provide remarks for your decision..."
                  value={reviewForm.hod_remarks} onChange={e => setReviewForm({ ...reviewForm, hod_remarks: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
              <button className={`btn ${reviewForm.status === 'approved' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleReview} disabled={reviewing}>
                {reviewing ? '⏳ Processing...' : reviewForm.status === 'approved' ? '✅ Approve & Reschedule' : '❌ Reject Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Leave Details — {detailModal.faculty_name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetailModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[['Type', detailModal.leave_type], ['Status', detailModal.status], ['From', detailModal.start_date], ['To', detailModal.end_date], ['Days', detailModal.total_days], ['Applied On', new Date(detailModal.created_at).toLocaleDateString()]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Reason</div>
                <div style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 8, fontSize: 13 }}>{detailModal.reason}</div>
              </div>
              {detailModal.hod_remarks && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>HOD Remarks</div>
                  <div style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 8, fontSize: 13 }}>{detailModal.hod_remarks}</div>
                </div>
              )}
              {detailModal.reassignments?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🔄 Lecture Reassignments ({detailModal.reassignments.length})</div>
                  {detailModal.reassignments.map(r => (
                    <div key={r.id} style={{ background: r.substitute_faculty_name ? '#d1fae5' : '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                      <div style={{ fontWeight: 700 }}>{r.subject_name}</div>
                      <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>{r.reassignment_date} • {r.start_time?.slice(0,5)}–{r.end_time?.slice(0,5)} • Room {r.room_number}</div>
                      {r.substitute_faculty_name
                        ? <div style={{ color: '#065f46', fontWeight: 600, marginTop: 4 }}>✅ Substitute: {r.substitute_faculty_name} ({r.sub_emp_id})</div>
                        : <div style={{ color: '#92400e', fontWeight: 600, marginTop: 4 }}>⚠️ No substitute assigned yet</div>}
                      <span className="badge badge-gray" style={{ marginTop: 4 }}>{r.assignment_method}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LeaveApprovals;
