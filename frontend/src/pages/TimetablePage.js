import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { timetableAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TIME_COLORS = ['#4f46e5','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const TimetablePage = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('Monday');
  const [faculty, setFaculty] = useState([]);
  const [filterFaculty, setFilterFaculty] = useState('');

  const isAdmin = user?.role === 'admin';
  const isHOD = user?.role === 'hod';

  useEffect(() => {
    loadTimetable();
    if (isAdmin || isHOD) {
      adminAPI.getFaculty({}).then(r => setFaculty(r.data.data || [])).catch(() => {});
    }
  }, [filterFaculty]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterFaculty) params.faculty_id = filterFaculty;
      const res = await timetableAPI.getAll(params);
      setTimetable(res.data.grouped || {});
    } catch { toast.error('Failed to load timetable'); }
    finally { setLoading(false); }
  };

  if (loading) return <Layout title="Timetable"><div className="loading-spinner"><div className="spinner" /></div></Layout>;

  const title = user?.role === 'faculty' ? 'My Timetable' : 'Department Timetable';

  return (
    <Layout title={title}>
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>{title}</h1><p>Academic Year 2024-25</p></div>
          {(isAdmin || isHOD) && (
            <select className="form-control" style={{ width: 220 }} value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}>
              <option value="">All Faculty</option>
              {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {DAYS.map(day => {
          const count = (timetable[day] || []).length;
          return (
            <button key={day} onClick={() => setActiveDay(day)}
              className={`btn ${activeDay === day ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
              {day} {count > 0 && <span style={{ marginLeft: 4, background: activeDay === day ? 'rgba(255,255,255,0.3)' : 'var(--gray-200)', borderRadius: 10, padding: '0 6px', fontSize: 11 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📅 {activeDay} Schedule</h3>
          <span className="badge badge-info">{(timetable[activeDay] || []).length} classes</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {(timetable[activeDay] || []).length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">🎉</div>
              <h3>No classes on {activeDay}</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, padding: 20 }}>
              {(timetable[activeDay] || []).sort((a,b) => a.start_time > b.start_time ? 1 : -1).map((cls, idx) => (
                <div key={cls.id} style={{ border: `2px solid ${TIME_COLORS[idx % TIME_COLORS.length]}20`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ background: TIME_COLORS[idx % TIME_COLORS.length], padding: '10px 14px', color: 'white' }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{cls.start_time?.slice(0,5)} – {cls.end_time?.slice(0,5)}</div>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{cls.subject_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 2 }}>Code: {cls.subject_code}</div>
                    {(isAdmin || isHOD) && <div style={{ fontSize: 12, color: 'var(--gray-600)', fontWeight: 600 }}>👤 {cls.faculty_name}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <span className="badge badge-info">Room {cls.room_number}</span>
                      <span className="badge badge-gray">Sem {cls.semester}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly summary table */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h3 className="card-title">📊 Weekly Overview</h3></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Day</th><th>Classes</th><th>First Class</th><th>Last Class</th></tr></thead>
            <tbody>
              {DAYS.map(day => {
                const cls = timetable[day] || [];
                const sorted = [...cls].sort((a,b) => a.start_time > b.start_time ? 1 : -1);
                return (
                  <tr key={day} style={{ cursor: 'pointer' }} onClick={() => setActiveDay(day)}>
                    <td><strong>{day}</strong></td>
                    <td><span className="badge badge-info">{cls.length}</span></td>
                    <td>{sorted[0] ? `${sorted[0].start_time?.slice(0,5)} – ${sorted[0].subject_name}` : '—'}</td>
                    <td>{sorted.at(-1) ? `${sorted.at(-1).end_time?.slice(0,5)} – ${sorted.at(-1).subject_name}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default TimetablePage;
