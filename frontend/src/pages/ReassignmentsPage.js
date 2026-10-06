import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { reassignmentAPI } from '../services/api';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const map = { assigned: 'badge-success', pending: 'badge-warning', completed: 'badge-info', cancelled: 'badge-gray' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

const ReassignmentsPage = () => {
  const [reassignments, setReassignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overrideModal, setOverrideModal] = useState(null);
  const [availableSubs, setAvailableSubs] = useState([]);
  const [overrideForm, setOverrideForm] = useState({ substitute_faculty_id: '', reason: '' });
  const [overriding, setOverriding] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchReassignments = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const res = await reassignmentAPI.getAll(params);
      setReassignments(res.data.data || []);
    } catch { toast.error('Failed to load reassignments'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchReassignments(); }, [filterStatus]);

  const openOverride = async (r) => {
    setOverrideModal(r);
    setOverrideForm({ substitute_faculty_id: '', reason: '' });
    try {
      const res = await reassignmentAPI.getAvailableSubstitutes(r.id);
      setAvailableSubs(res.data.data || []);
    } catch { toast.error('Failed to load available substitutes'); }
  };

  const handleOverride = async () => {
    if (!overrideForm.substitute_faculty_id) { toast.error('Select a substitute faculty'); return; }
    setOverriding(true);
    try {
      await reassignmentAPI.override(overrideModal.id, overrideForm);
      toast.success('Reassignment override successful!');
      setOverrideModal(null);
      fetchReassignments();
    } catch (err) {
      toast.error(err.message || 'Override failed');
    } finally { setOverriding(false); }
  };

  return (
    <Layout title="Lecture Reassignments">
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>Lecture Reassignments</h1><p>Track and manage all lecture reassignments</p></div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total', value: reassignments.length, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Assigned', value: reassignments.filter(r => r.status === 'assigned' || r.status === 'completed').length, color: '#065f46', bg: '#d1fae5' },
          { label: 'Pending', value: reassignments.filter(r => r.status === 'pending').length, color: '#92400e', bg: '#fef3c7' },
          { label: 'Auto-Assigned', value: reassignments.filter(r => r.assignment_method === 'auto').length, color: '#1e40af', bg: '#dbeafe' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color, fontSize: 18 }}>
              {s.label === 'Total' ? '📊' : s.label === 'Assigned' ? '✅' : s.label === 'Pending' ? '⏳' : '🤖'}
            </div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Reassignments</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {['', 'pending', 'assigned', 'completed'].map(s => (
              <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus(s)}>{s || 'All'}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : reassignments.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🔄</div><h3>No reassignments found</h3></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Date</th><th>Subject</th><th>Time</th><th>Room</th><th>Original Faculty</th><th>Substitute</th><th>Method</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {reassignments.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.reassignment_date}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{r.day_of_week}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{r.subject_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{r.subject_code}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.start_time?.slice(0,5)} – {r.end_time?.slice(0,5)}</td>
                    <td>{r.room_number}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.original_faculty_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{r.orig_emp_id}</div>
                    </td>
                    <td>
                      {r.substitute_faculty_name
                        ? <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--success)' }}>{r.substitute_faculty_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{r.sub_emp_id}</div>
                          </div>
                        : <span className="badge badge-warning">Unassigned</span>}
                    </td>
                    <td>
                      <span className={`badge ${r.assignment_method === 'auto' ? 'badge-info' : 'badge-purple'}`}>
                        {r.assignment_method === 'auto' ? '🤖 Auto' : '✋ Manual'}
                      </span>
                    </td>
                    <td>{statusBadge(r.status)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openOverride(r)}>
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <div className="modal-overlay" onClick={() => setOverrideModal(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✋ Manual Override Assignment</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setOverrideModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700 }}>{overrideModal.subject_name}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                  {overrideModal.reassignment_date} • {overrideModal.start_time?.slice(0,5)}–{overrideModal.end_time?.slice(0,5)} • Room {overrideModal.room_number}
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Original: <strong>{overrideModal.original_faculty_name}</strong>
                  {overrideModal.substitute_faculty_name && <span style={{ marginLeft: 8, color: 'var(--gray-500)' }}>Current: {overrideModal.substitute_faculty_name}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Substitute Faculty *</label>
                {availableSubs.length === 0
                  ? <div className="alert alert-warning">⚠️ No available faculty found who can teach this subject at this time.</div>
                  : (
                    <select className="form-control" value={overrideForm.substitute_faculty_id}
                      onChange={e => setOverrideForm({ ...overrideForm, substitute_faculty_id: e.target.value })}>
                      <option value="">-- Select Faculty --</option>
                      {availableSubs.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.employee_id}) — {f.department_name} — {f.substitution_count} subs this month {f.is_primary ? '⭐ Primary' : ''}
                        </option>
                      ))}
                    </select>
                  )}
              </div>

              <div className="form-group">
                <label className="form-label">Override Reason</label>
                <textarea className="form-control" rows={2} placeholder="Reason for manual override..."
                  value={overrideForm.reason} onChange={e => setOverrideForm({ ...overrideForm, reason: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOverrideModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleOverride} disabled={overriding || !overrideForm.substitute_faculty_id}>
                {overriding ? '⏳ Assigning...' : '✅ Assign Substitute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ReassignmentsPage;
