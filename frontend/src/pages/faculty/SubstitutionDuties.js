import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { reassignmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SubstitutionDuties = () => {
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reassignmentAPI.getSubstitutionDuties()
      .then(r => setDuties(r.data.data || []))
      .catch(() => toast.error('Failed to load duties'))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = duties.filter(d => new Date(d.reassignment_date) >= new Date());
  const past = duties.filter(d => new Date(d.reassignment_date) < new Date());

  const DutyCard = ({ d }) => (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ background: new Date(d.reassignment_date) >= new Date() ? 'var(--primary-light)' : 'var(--gray-100)', color: new Date(d.reassignment_date) >= new Date() ? 'var(--primary)' : 'var(--gray-500)', borderRadius: 8, padding: '8px 12px', textAlign: 'center', flexShrink: 0, minWidth: 60 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{new Date(d.reassignment_date).getDate()}</div>
        <div style={{ fontSize: 11, fontWeight: 600 }}>{new Date(d.reassignment_date).toLocaleString('default', { month: 'short' })}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{d.subject_name}</div>
        <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          ⏰ {d.start_time?.slice(0,5)} – {d.end_time?.slice(0,5)} &nbsp;•&nbsp; 📍 Room {d.room_number}
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
          Covering for: <strong>{d.original_faculty_name}</strong>
        </div>
      </div>
      <span className={`badge ${d.status === 'completed' ? 'badge-success' : d.status === 'assigned' ? 'badge-info' : 'badge-warning'}`}>{d.status}</span>
    </div>
  );

  if (loading) return <Layout title="Substitution Duties"><div className="loading-spinner"><div className="spinner" /></div></Layout>;

  return (
    <Layout title="Substitution Duties">
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>Substitution Duties</h1><p>Lectures assigned to you as substitute</p></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="stat-card" style={{ padding: '10px 16px' }}>
              <div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{upcoming.length}</div><div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Upcoming</div></div>
            </div>
            <div className="stat-card" style={{ padding: '10px 16px' }}>
              <div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-500)' }}>{past.length}</div><div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Completed</div></div>
            </div>
          </div>
        </div>
      </div>

      {duties.length === 0 ? (
        <div className="card"><div className="empty-state" style={{ padding: 60 }}><div className="empty-state-icon">✅</div><h3>No substitution duties</h3><p>You have not been assigned any substitution duties yet.</p></div></div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3 className="card-title">📅 Upcoming Duties ({upcoming.length})</h3></div>
              {upcoming.map(d => <DutyCard key={d.id} d={d} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="card">
              <div className="card-header"><h3 className="card-title">✅ Past Duties ({past.length})</h3></div>
              {past.map(d => <DutyCard key={d.id} d={d} />)}
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default SubstitutionDuties;
