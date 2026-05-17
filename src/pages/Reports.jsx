import { useMemo, useState } from 'react';
import { BarChart3, Download, Users, Target, TrendingUp, Award } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import useAuthStore from '../stores/authStore';
import useGoalStore from '../stores/goalStore';
import { DEPARTMENTS, CURRENT_QUARTER, CURRENT_YEAR, GOAL_STATUS, STATUS_LABELS, ROLES } from '../utils/constants';
import './Reports.css';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6'];

export default function Reports() {
  const { currentUser, users } = useAuthStore();
  const goalStore = useGoalStore();
  const [selectedDept, setSelectedDept] = useState('all');

  const allGoals = useMemo(() => {
    return goalStore.goals.filter(g => g.quarter === CURRENT_QUARTER && g.year === CURRENT_YEAR);
  }, [goalStore.goals]);

  const filteredGoals = useMemo(() => {
    if (selectedDept === 'all') return allGoals;
    const deptUserIds = users.filter(u => u.department === selectedDept).map(u => u.id);
    return allGoals.filter(g => deptUserIds.includes(g.ownerId));
  }, [allGoals, selectedDept]);

  // Department comparison
  const deptData = useMemo(() => {
    return DEPARTMENTS.map(dept => {
      const deptUserIds = users.filter(u => u.department === dept).map(u => u.id);
      const deptGoals = allGoals.filter(g => deptUserIds.includes(g.ownerId));
      if (!deptGoals.length) return null;
      return {
        name: dept.length > 10 ? dept.slice(0, 10) + '…' : dept,
        fullName: dept,
        goals: deptGoals.length,
        avgProgress: goalStore.getAverageProgress(deptGoals),
        completionRate: goalStore.getCompletionRate(deptGoals),
      };
    }).filter(Boolean);
  }, [allGoals]);

  // Status distribution
  const statusData = useMemo(() => {
    const dist = goalStore.getStatusDistribution(filteredGoals);
    return Object.entries(dist).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
    }));
  }, [filteredGoals]);

  // Quarterly trend (simulated historical)
  const trendData = [
    { quarter: 'Q1', completion: 78, avgProgress: 82, goals: 14 },
    { quarter: 'Q2', completion: goalStore.getCompletionRate(allGoals), avgProgress: goalStore.getAverageProgress(allGoals), goals: allGoals.length },
  ];

  // Summary stats
  const totalGoals = filteredGoals.length;
  const avgProgress = goalStore.getAverageProgress(filteredGoals);
  const completionRate = goalStore.getCompletionRate(filteredGoals);
  const avgScore = goalStore.getAverageScore(filteredGoals);

  const handleExportCSV = () => {
    const headers = ['Employee', 'Department', 'Goal', 'Category', 'Weightage%', 'Status', 'Progress%', 'Score', 'UoM', 'Target', 'Actual'];
    const rows = filteredGoals.map(g => {
      const u = users.find(usr => usr.id === g.ownerId);
      return [u?.name || '', u?.department || '', `"${g.title}"`, g.category, g.weightage, g.status, g.progress, g.score ?? '', g.uom || '', g.targetValue || '', g.actualValue ?? ''];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `atomquest_report_${CURRENT_QUARTER}_${CURRENT_YEAR}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-page">
      {/* Report Header */}
      <div className="report-header glass-card-static animate-fade-in">
        <div className="report-header-left">
          <BarChart3 size={20} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2>Reports & Analytics</h2>
            <p>{CURRENT_QUARTER} {CURRENT_YEAR} Performance Report</p>
          </div>
        </div>
        <div className="report-header-right">
          <select
            className="filter-select"
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            aria-label="Filter by department"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleExportCSV} aria-label="Export CSV">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="report-kpis stagger-children">
        <div className="report-kpi glass-card">
          <Target size={18} style={{ color: 'var(--accent-primary)' }} />
          <div className="report-kpi-value">{totalGoals}</div>
          <div className="report-kpi-label">Total Goals</div>
        </div>
        <div className="report-kpi glass-card">
          <TrendingUp size={18} style={{ color: 'var(--accent-info)' }} />
          <div className="report-kpi-value">{avgProgress}%</div>
          <div className="report-kpi-label">Avg Progress</div>
        </div>
        <div className="report-kpi glass-card">
          <Users size={18} style={{ color: 'var(--accent-success)' }} />
          <div className="report-kpi-value">{completionRate}%</div>
          <div className="report-kpi-label">Completion Rate</div>
        </div>
        <div className="report-kpi glass-card">
          <Award size={18} style={{ color: 'var(--accent-warning)' }} />
          <div className="report-kpi-value">{avgScore || '—'}</div>
          <div className="report-kpi-label">Avg Score</div>
        </div>
      </div>

      {/* Charts */}
      <div className="report-charts-grid">
        {/* Department Comparison */}
        <div className="report-chart glass-card-static animate-fade-in-up">
          <h3>Department Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '13px',
                }}
              />
              <Legend />
              <Bar dataKey="avgProgress" fill="#6366f1" name="Avg Progress %" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="goals" fill="#8b5cf6" name="Goal Count" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="report-chart glass-card-static animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '13px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend */}
      <div className="report-chart glass-card-static animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h3>Quarterly Trends</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="quarter" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '13px',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="completion" stroke="#10b981" strokeWidth={2} name="Completion %" dot={{ r: 5 }} />
            <Line type="monotone" dataKey="avgProgress" stroke="#6366f1" strokeWidth={2} name="Avg Progress %" dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
