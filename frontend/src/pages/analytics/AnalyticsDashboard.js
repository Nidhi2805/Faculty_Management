import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { analyticsAPI } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#4f46e5','#10b981','#f59e0b','#ef4444','#0ea5e9','#8b5cf6','#ec4899'];

const AnalyticsDashboard = () => {
  const [overview, setOverview] = useState({});
  const [leaveTrends, setLeaveTrends] = useState({ monthly: [], byType: [] });
  const [workload, setWorkload] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [substitutionData, setSubstitutionData] = useState({ mostSubstituted: [], bySubject: [], coverageRate: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, ltRes, wlRes, dsRes, spRes] = await Promise.all([
          analyticsAPI.getOverview(),
          analyticsAPI.getLeaveTrends(),
          analyticsAPI.getFacultyWorkload(),
          analyticsAPI.getDepartmentStats(),
          analyticsAPI.getSubstitutionPatterns(),
        ]);
        setOverview(ovRes.data.data || {});
        setLeaveTrends(ltRes.data.data || { monthly: [], byType: [] });
        setWorkload(wlRes.data.data || []);
        setDeptStats(dsRes.data.data || []);
        setSubstitutionData(spRes.data.data || { mostSubstituted: [], bySubject: [], coverageRate: {} });
      } catch { toast.error('Failed to load analytics'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <Layout title="Analytics"><div className="loading-spinner"><div className="spinner" /></div></Layout>;

  const coveragePct = substitutionData.coverageRate?.coverage_percent || 0;

  return (
    <Layout title="Analytics Dashboard">
      <div className="page-header">
        <h1>📊 Analytics Dashboard</h1>
        <p>Institutional scheduling insights and leave management statistics</p>
      </div>

      {/* Overview KPIs */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {[
          { label: 'Total Leave Requests', value: overview.total_leaves || 0, icon: '📋', bg: '#eef2ff', color: '#4f46e5' },
          { label: 'Approved Leaves', value: overview.approved || 0, icon: '✅', bg: '#d1fae5', color: '#065f46' },
          { label: 'Rejected Leaves', value: overview.rejected || 0, icon: '❌', bg: '#fee2e2', color: '#991b1b' },
          { label: 'Pending Approvals', value: overview.pending || 0, icon: '⏳', bg: '#fef3c7', color: '#92400e' },
          { label: 'Total Reassignments', value: overview.total_reassignments || 0, icon: '🔄', bg: '#dbeafe', color: '#1e40af' },
          { label: 'Coverage Rate', value: `${coveragePct}%`, icon: '📈', bg: '#ede9fe', color: '#5b21b6' },
          { label: 'Active Faculty', value: overview.total_faculty || 0, icon: '👥', bg: '#fce7f3', color: '#9d174d' },
          { label: 'Manual Overrides', value: overview.manual_assignments || 0, icon: '✋', bg: '#d1fae5', color: '#065f46' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color, fontSize: 18 }}>{s.icon}</div>
            <div><div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3 className="card-title">📈 Monthly Leave Trends (Last 12 Months)</h3></div>
        <div className="card-body">
          {leaveTrends.monthly.length === 0
            ? <div className="empty-state"><p>No trend data available</p></div>
            : <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={leaveTrends.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month_name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="total" stackId="1" stroke="#4f46e5" fill="#eef2ff" name="Total Leaves" />
                  <Area type="monotone" dataKey="approved" stackId="2" stroke="#10b981" fill="#d1fae5" name="Approved" />
                  <Area type="monotone" dataKey="rejected" stackId="3" stroke="#ef4444" fill="#fee2e2" name="Rejected" />
                </AreaChart>
              </ResponsiveContainer>}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Leave by Type */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">🗂️ Leave by Type</h3></div>
          <div className="card-body">
            {leaveTrends.byType.length === 0
              ? <div className="empty-state"><p>No data</p></div>
              : <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={leaveTrends.byType} dataKey="count" nameKey="leave_type" cx="50%" cy="50%"
                      outerRadius={90} label={({ leave_type, percent }) => `${leave_type} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {leaveTrends.byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>}
          </div>
        </div>

        {/* Department Stats */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">🏛️ Department-wise Leave Stats</h3></div>
          <div className="card-body">
            {deptStats.length === 0
              ? <div className="empty-state"><p>No data</p></div>
              : <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={deptStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="code" tick={{ fontSize: 12 }} width={40} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="approved_leaves" name="Approved" fill="#10b981" radius={[0,4,4,0]} />
                    <Bar dataKey="pending_leaves" name="Pending" fill="#f59e0b" radius={[0,4,4,0]} />
                    <Bar dataKey="total_reassignments" name="Reassignments" fill="#4f46e5" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>}
          </div>
        </div>
      </div>

      {/* Faculty Workload */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3 className="card-title">👥 Faculty Workload Distribution</h3></div>
        <div className="card-body">
          {workload.length === 0
            ? <div className="empty-state"><p>No workload data</p></div>
            : <ResponsiveContainer width="100%" height={260}>
                <BarChart data={workload.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="regular_lectures_per_week" name="Weekly Lectures" fill="#4f46e5" radius={[4,4,0,0]} />
                  <Bar dataKey="total_substitutions" name="Total Substitutions" fill="#f59e0b" radius={[4,4,0,0]} />
                  <Bar dataKey="total_leaves_taken" name="Leaves Taken" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>}
        </div>
      </div>

      <div className="grid-2">
        {/* Most Substituted Faculty */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">🏆 Top Substitute Faculty</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            {substitutionData.mostSubstituted.length === 0
              ? <div className="empty-state" style={{ padding: 30 }}><p>No data</p></div>
              : substitutionData.mostSubstituted.slice(0, 6).map((f, i) => (
                  <div key={f.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? '#fef3c7' : 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: i < 3 ? '#92400e' : 'var(--gray-600)', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{f.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{f.department_name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>{f.times_substituted}</div>
                      <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>subs</div>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Reassignments by Subject */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">📚 Most Reassigned Subjects</h3></div>
          <div className="card-body">
            {substitutionData.bySubject.length === 0
              ? <div className="empty-state"><p>No data</p></div>
              : <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={substitutionData.bySubject.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="subject_name" tick={{ fontSize: 11 }} width={130} />
                    <Tooltip />
                    <Bar dataKey="reassignment_count" name="Reassignments" fill="#8b5cf6" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsDashboard;
