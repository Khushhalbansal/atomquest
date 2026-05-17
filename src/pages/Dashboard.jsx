import { useMemo, useState, useEffect } from 'react';
import {
  Target, TrendingUp, CheckCircle, Clock, Award, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Zap, Users, Shield, BarChart3, Send
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Legend
} from 'recharts';
import useAuthStore from '../stores/authStore';
import useGoalStore from '../stores/goalStore';
import useNotificationStore from '../stores/notificationStore';
import { GOAL_STATUS, STATUS_LABELS, CURRENT_QUARTER, CURRENT_YEAR, ROLES } from '../utils/constants';
import { formatDate, timeAgo, getScoreLabel, getScoreColor, getProgressColor, getInitials, getAvatarColor } from '../utils/helpers';
import './Dashboard.css';

const PIE_COLORS = {
  [GOAL_STATUS.DRAFT]: '#64748b',
  [GOAL_STATUS.PENDING_APPROVAL]: '#f59e0b',
  [GOAL_STATUS.APPROVED]: '#3b82f6',
  [GOAL_STATUS.IN_PROGRESS]: '#6366f1',
  [GOAL_STATUS.COMPLETED]: '#10b981',
  [GOAL_STATUS.REJECTED]: '#ef4444',
};

/* ─── Employee Dashboard ─── */
function EmployeeDashboard({ currentUser, goalStore, notifications, getUserById }) {
  const myGoals = useMemo(() =>
    goalStore.getGoalsByUser(currentUser?.id, CURRENT_QUARTER, CURRENT_YEAR),
    [goalStore.goals, currentUser?.id]
  );
  const avgProgress = goalStore.getAverageProgress(myGoals);
  const completionRate = goalStore.getCompletionRate(myGoals);
  const avgScore = goalStore.getAverageScore(myGoals);
  const pendingCount = myGoals.filter(g => g.status === GOAL_STATUS.DRAFT || g.status === GOAL_STATUS.REJECTED).length;
  const needsCheckIn = myGoals.filter(g => g.status === GOAL_STATUS.IN_PROGRESS || g.status === GOAL_STATUS.APPROVED);
  const statusDist = goalStore.getStatusDistribution(myGoals);
  const pieData = Object.entries(statusDist).map(([s, c]) => ({ name: STATUS_LABELS[s] || s, value: c, color: PIE_COLORS[s] || '#64748b' }));

  const kpis = [
    { label: 'My Goals', value: myGoals.length, icon: Target, color: 'var(--accent-primary)', trend: `${needsCheckIn.length} active`, trendUp: true },
    { label: 'Avg. Progress', value: `${avgProgress}%`, icon: TrendingUp, color: 'var(--accent-info)', trend: avgProgress >= 50 ? 'On Track' : 'Needs Attention', trendUp: avgProgress >= 50 },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle, color: 'var(--accent-success)', trend: completionRate >= 70 ? 'Excellent' : 'Keep Going', trendUp: completionRate >= 50 },
    { label: 'Action Needed', value: pendingCount, icon: Send, color: pendingCount > 0 ? 'var(--accent-warning)' : 'var(--text-muted)', trend: pendingCount > 0 ? 'Submit drafts' : 'All submitted', trendUp: pendingCount === 0 },
  ];

  return (
    <>
      <div className="welcome-banner glass-card-static animate-fade-in">
        <div className="welcome-content">
          <div className="welcome-text">
            <h2>Welcome back, {currentUser?.name?.split(' ')[0]} 👋</h2>
            <p>Here's your {CURRENT_QUARTER} {CURRENT_YEAR} goal performance snapshot.</p>
          </div>
          {avgScore && (
            <div className="welcome-stats">
              <div className="welcome-score">
                <div className="score-ring" style={{ '--score-color': getScoreColor(avgScore) }}>
                  <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-glass)" strokeWidth="8" /><circle cx="60" cy="60" r="52" fill="none" stroke="var(--score-color)" strokeWidth="8" strokeDasharray={`${(avgScore / 5) * 327} 327`} strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 1s ease' }} /></svg>
                  <div className="score-value"><span>{avgScore}</span><small>/5</small></div>
                </div>
                <div className="score-label">{getScoreLabel(avgScore)}</div>
              </div>
            </div>
          )}
        </div>
        <div className="welcome-particles"><div className="particle p1" /><div className="particle p2" /><div className="particle p3" /></div>
      </div>

      <div className="kpi-grid stagger-children">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card glass-card">
            <div className="kpi-header">
              <div className="kpi-icon" style={{ color: kpi.color, background: `${kpi.color}15` }}><kpi.icon size={20} /></div>
              <div className={`kpi-trend ${kpi.trendUp ? 'trend-up' : 'trend-down'}`}>{kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{kpi.trend}</div>
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-card-static animate-fade-in-up" style={{ gridColumn: 'span 2' }}>
          <div className="chart-header"><h3>My Goals</h3><span className="chart-subtitle">Pending check-ins highlighted</span></div>
          <div className="goal-list-compact">
            {myGoals.filter(g => g.status !== GOAL_STATUS.COMPLETED && g.status !== GOAL_STATUS.REJECTED).slice(0, 6).map(goal => (
              <div key={goal.id} className="goal-row">
                <div className="goal-row-info">
                  <div className="goal-row-title">{goal.title}</div>
                  <div className="goal-row-meta">{goal.category} · {goal.weightage}% weight</div>
                </div>
                <div className="goal-row-progress">
                  <div className="mini-progress-bar"><div className="mini-progress-fill" style={{ width: `${goal.progress}%`, background: getProgressColor(goal.progress) }} /></div>
                  <span className="goal-row-pct">{goal.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card glass-card-static animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="chart-header"><h3>Goal Status</h3></div>
          {pieData.length > 0 ? (
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">{pieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '13px' }} /></PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">{pieData.map((e, i) => <div key={i} className="legend-item"><span className="legend-dot" style={{ background: e.color }} /><span className="legend-label">{e.name}</span><span className="legend-value">{e.value}</span></div>)}</div>
            </div>
          ) : <div className="empty-state" style={{ padding: 'var(--space-8)' }}><p>No goals this quarter</p></div>}
        </div>
      </div>

      <div className="bottom-grid">
        <div className="recent-activity glass-card-static animate-fade-in-up">
          <div className="section-header"><h3>Recent Activity</h3></div>
          <div className="activity-list">
            {notifications.length === 0 ? <div className="empty-state" style={{ padding: 'var(--space-6)' }}><p>No recent activity</p></div> :
              notifications.map(n => <div key={n.id} className="activity-item"><div className={`activity-dot ${n.isRead ? '' : 'activity-dot-unread'}`} /><div className="activity-content"><div className="activity-text">{n.message}</div><div className="activity-time">{timeAgo(n.createdAt)}</div></div></div>)}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Manager Dashboard ─── */
function ManagerDashboard({ currentUser, goalStore, users, getUserById, notifications }) {
  const { addToast, logAction } = useNotificationStore();
  const teamMembers = useMemo(() => users.filter(u => u.managerId === currentUser?.id), [users, currentUser?.id]);
  const teamIds = useMemo(() => teamMembers.map(u => u.id), [teamMembers]);
  const teamGoals = useMemo(() => goalStore.goals.filter(g => teamIds.includes(g.ownerId) && g.quarter === CURRENT_QUARTER && g.year === CURRENT_YEAR), [goalStore.goals, teamIds]);
  const pendingApprovals = useMemo(() => teamGoals.filter(g => g.status === GOAL_STATUS.PENDING_APPROVAL), [teamGoals]);
  const avgProgress = goalStore.getAverageProgress(teamGoals);
  const completionRate = goalStore.getCompletionRate(teamGoals);
  const needsScoring = teamGoals.filter(g => g.status === GOAL_STATUS.COMPLETED && g.score == null);

  const memberPerformance = teamMembers.map(m => {
    const mGoals = teamGoals.filter(g => g.ownerId === m.id);
    return { name: m.name.split(' ')[0], goals: mGoals.length, avgProgress: goalStore.getAverageProgress(mGoals) };
  });

  // Push KPI modal state
  const [showPushKPI, setShowPushKPI] = useState(false);
  const [kpiForm, setKpiForm] = useState({ title: '', description: '', category: 'Performance', uom: 'percentage', targetValue: 100, weightage: 10 });
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const handlePushKPI = () => {
    if (!kpiForm.title.trim() || selectedEmployees.length === 0) {
      addToast({ type: 'error', title: 'Missing Info', message: 'Enter a title and select at least one employee.' });
      return;
    }
    goalStore.pushDepartmentalKPI(
      { ...kpiForm, ownerId: currentUser.id, pushedBy: currentUser.id, quarter: CURRENT_QUARTER, year: CURRENT_YEAR },
      selectedEmployees
    );
    logAction({
      entityType: 'goal', entityId: 'push_kpi', action: 'push_kpi',
      userId: currentUser.id,
      changes: { after: { title: kpiForm.title, employees: selectedEmployees.length } },
    });
    addToast({ type: 'success', title: 'KPI Pushed', message: `"${kpiForm.title}" pushed to ${selectedEmployees.length} employee(s).` });
    setShowPushKPI(false);
    setKpiForm({ title: '', description: '', category: 'Performance', uom: 'percentage', targetValue: 100, weightage: 10 });
    setSelectedEmployees([]);
  };

  const toggleEmployee = (empId) => {
    setSelectedEmployees(prev => prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]);
  };

  const kpis = [
    { label: 'Team Members', value: teamMembers.length, icon: Users, color: 'var(--accent-primary)', trend: `${teamGoals.length} goals`, trendUp: true },
    { label: 'Team Progress', value: `${avgProgress}%`, icon: TrendingUp, color: 'var(--accent-info)', trend: avgProgress >= 50 ? 'On Track' : 'Behind', trendUp: avgProgress >= 50 },
    { label: 'Pending Approvals', value: pendingApprovals.length, icon: Clock, color: pendingApprovals.length > 0 ? 'var(--accent-warning)' : 'var(--text-muted)', trend: pendingApprovals.length > 0 ? 'Action Required' : 'All Clear', trendUp: pendingApprovals.length === 0 },
    { label: 'Needs Scoring', value: needsScoring.length, icon: Award, color: needsScoring.length > 0 ? 'var(--accent-secondary)' : 'var(--text-muted)', trend: needsScoring.length > 0 ? 'Review needed' : 'All scored', trendUp: needsScoring.length === 0 },
  ];

  return (
    <>
      <div className="welcome-banner glass-card-static animate-fade-in" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))' }}>
        <div className="welcome-content">
          <div className="welcome-text">
            <h2>Team Overview — {currentUser?.name?.split(' ')[0]} 🎯</h2>
            <p>{CURRENT_QUARTER} {CURRENT_YEAR} · {teamMembers.length} team members · {teamGoals.length} active goals</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowPushKPI(true)} style={{ whiteSpace: 'nowrap' }}>
            <Send size={14} /> Push KPI
          </button>
        </div>
        <div className="welcome-particles"><div className="particle p1" /><div className="particle p2" /><div className="particle p3" /></div>
      </div>

      <div className="kpi-grid stagger-children">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card glass-card">
            <div className="kpi-header"><div className="kpi-icon" style={{ color: kpi.color, background: `${kpi.color}15` }}><kpi.icon size={20} /></div><div className={`kpi-trend ${kpi.trendUp ? 'trend-up' : 'trend-down'}`}>{kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{kpi.trend}</div></div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-card-static animate-fade-in-up" style={{ gridColumn: 'span 2' }}>
          <div className="chart-header"><h3>Team Performance</h3><span className="chart-subtitle">Individual member progress</span></div>
          {memberPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={memberPerformance}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" /><XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} /><YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} /><Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '13px' }} /><Bar dataKey="avgProgress" fill="#6366f1" name="Avg Progress %" radius={[4, 4, 0, 0]} barSize={28} /><Bar dataKey="goals" fill="#8b5cf6" name="Goal Count" radius={[4, 4, 0, 0]} barSize={28} /></BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No team data</p></div>}
        </div>
        <div className="chart-card glass-card-static animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="chart-header"><h3>Goal Approvals</h3></div>
          <div className="goal-list-compact">
            {pendingApprovals.length === 0 ? <div className="empty-state" style={{ padding: 'var(--space-6)' }}><CheckCircle size={24} style={{ color: 'var(--accent-success)', marginBottom: 'var(--space-2)' }} /><p>All caught up!</p></div> :
              pendingApprovals.slice(0, 5).map(g => { const owner = getUserById(g.ownerId); return (
                <div key={g.id} className="goal-row"><div className="goal-row-info"><div className="goal-row-title">{g.title}</div><div className="goal-row-meta">{owner?.name} · {g.weightage}%</div></div><span className="badge badge-warning" style={{ fontSize: '10px' }}>Pending</span></div>
              ); })}
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="recent-goals glass-card-static animate-fade-in-up">
          <div className="section-header"><h3>Team Check-Ins</h3><Zap size={16} style={{ color: 'var(--accent-warning)' }} /></div>
          <div className="goal-list-compact">
            {teamGoals.filter(g => g.status === GOAL_STATUS.IN_PROGRESS).slice(0, 5).map(g => { const owner = getUserById(g.ownerId); return (
              <div key={g.id} className="goal-row"><div className="goal-row-info"><div className="goal-row-title">{g.title}</div><div className="goal-row-meta">{owner?.name} · {g.checkIns?.length || 0} check-ins</div></div><div className="goal-row-progress"><div className="mini-progress-bar"><div className="mini-progress-fill" style={{ width: `${g.progress}%`, background: getProgressColor(g.progress) }} /></div><span className="goal-row-pct">{g.progress}%</span></div></div>
            ); })}
          </div>
        </div>
        <div className="recent-activity glass-card-static animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="section-header"><h3>Recent Activity</h3></div>
          <div className="activity-list">
            {notifications.length === 0 ? <div className="empty-state" style={{ padding: 'var(--space-6)' }}><p>No recent activity</p></div> :
              notifications.map(n => <div key={n.id} className="activity-item"><div className={`activity-dot ${n.isRead ? '' : 'activity-dot-unread'}`} /><div className="activity-content"><div className="activity-text">{n.message}</div><div className="activity-time">{timeAgo(n.createdAt)}</div></div></div>)}
          </div>
        </div>
      </div>

      {/* ─── Push Departmental KPI Modal ─── */}
      {showPushKPI && (
        <>
          <div className="modal-backdrop" onClick={() => setShowPushKPI(false)} />
          <div className="modal" role="dialog" aria-label="Push KPI" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Push Departmental KPI</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowPushKPI(false)} aria-label="Close"><span style={{ fontSize: '18px' }}>✕</span></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">KPI Title <span className="required">*</span></label>
                <input className="input-field" placeholder="e.g., Achieve 95% customer satisfaction" value={kpiForm.title} onChange={e => setKpiForm(p => ({ ...p, title: e.target.value }))} autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input-field" placeholder="Describe the KPI..." value={kpiForm.description} onChange={e => setKpiForm(p => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label">Target Value</label>
                  <input className="input-field" type="number" value={kpiForm.targetValue} onChange={e => setKpiForm(p => ({ ...p, targetValue: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Default Weightage</label>
                  <input className="input-field" type="number" min="10" max="100" value={kpiForm.weightage} onChange={e => setKpiForm(p => ({ ...p, weightage: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Select Employees <span className="required">*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', maxHeight: '140px', overflowY: 'auto', padding: 'var(--space-2)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  {teamMembers.filter(m => m.role === 'employee').map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleEmployee(emp.id)}
                      className={`badge ${selectedEmployees.includes(emp.id) ? 'badge-primary' : 'badge-ghost'}`}
                      style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                    >
                      {emp.name}
                    </button>
                  ))}
                </div>
                <span className="input-hint">{selectedEmployees.length} selected</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowPushKPI(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePushKPI} disabled={!kpiForm.title.trim() || selectedEmployees.length === 0}>
                <Send size={14} /> Push to {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ─── Admin Dashboard ─── */
function AdminDashboard({ currentUser, goalStore, users, getUserById, notifications }) {
  const { addToast, logAction } = useNotificationStore();
  const allGoals = useMemo(() => goalStore.goals.filter(g => g.quarter === CURRENT_QUARTER && g.year === CURRENT_YEAR), [goalStore.goals]);
  const avgProgress = goalStore.getAverageProgress(allGoals);
  const completionRate = goalStore.getCompletionRate(allGoals);
  const pendingAll = allGoals.filter(g => g.status === GOAL_STATUS.PENDING_APPROVAL);
  const statusDist = goalStore.getStatusDistribution(allGoals);
  const pieData = Object.entries(statusDist).map(([s, c]) => ({ name: STATUS_LABELS[s] || s, value: c, color: PIE_COLORS[s] || '#64748b' }));

  const escalations = useMemo(() => {
    const now = Date.now();
    return allGoals.filter(g => g.status === 'pending_approval' && now - new Date(g.updatedAt).getTime() > 7 * 86400000);
  }, [allGoals]);

  // Push KPI modal state for Admin
  const [showPushKPI, setShowPushKPI] = useState(false);
  const [kpiForm, setKpiForm] = useState({ title: '', description: '', category: 'Performance', uom: 'percentage', targetValue: 100, weightage: 10 });
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const handlePushKPI = () => {
    if (!kpiForm.title.trim() || selectedEmployees.length === 0) {
      addToast({ type: 'error', title: 'Missing Info', message: 'Enter a title and select at least one employee.' });
      return;
    }
    goalStore.pushDepartmentalKPI(
      { ...kpiForm, ownerId: currentUser.id, pushedBy: currentUser.id, quarter: CURRENT_QUARTER, year: CURRENT_YEAR },
      selectedEmployees
    );
    logAction({
      entityType: 'goal', entityId: 'push_kpi_admin', action: 'push_kpi',
      userId: currentUser.id,
      changes: { after: { title: kpiForm.title, employees: selectedEmployees.length } },
    });
    addToast({ type: 'success', title: 'KPI Pushed', message: `"${kpiForm.title}" pushed to ${selectedEmployees.length} employee(s).` });
    setShowPushKPI(false);
    setKpiForm({ title: '', description: '', category: 'Performance', uom: 'percentage', targetValue: 100, weightage: 10 });
    setSelectedEmployees([]);
  };

  const toggleEmployee = (empId) => {
    setSelectedEmployees(prev => prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]);
  };

  const kpis = [
    { label: 'Total Goals', value: allGoals.length, icon: Target, color: 'var(--accent-primary)', trend: `${users.length} users`, trendUp: true },
    { label: 'Org Progress', value: `${avgProgress}%`, icon: TrendingUp, color: 'var(--accent-info)', trend: avgProgress >= 50 ? 'Healthy' : 'Needs Review', trendUp: avgProgress >= 50 },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle, color: 'var(--accent-success)', trend: completionRate >= 50 ? 'Good' : 'Low', trendUp: completionRate >= 50 },
    { label: 'Escalations', value: escalations.length, icon: AlertTriangle, color: escalations.length > 0 ? 'var(--accent-danger)' : 'var(--text-muted)', trend: escalations.length > 0 ? 'Needs attention' : 'All clear', trendUp: escalations.length === 0 },
  ];

  const handleExportCSV = () => {
    const headers = ['Employee', 'Department', 'Goal', 'Category', 'Weightage', 'Status', 'Progress', 'Score', 'UoM', 'Target', 'Actual'];
    const rows = allGoals.map(g => {
      const u = getUserById(g.ownerId);
      return [u?.name || '', u?.department || '', `"${g.title}"`, g.category, g.weightage, g.status, g.progress, g.score ?? '', g.uom || '', g.targetValue || '', g.actualValue ?? ''];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `atomquest_${CURRENT_QUARTER}_${CURRENT_YEAR}_report.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="welcome-banner glass-card-static animate-fade-in" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(249,115,22,0.08))' }}>
        <div className="welcome-content">
          <div className="welcome-text">
            <h2><Shield size={20} style={{ display: 'inline', marginRight: '8px' }} />Admin Control Center</h2>
            <p>{CURRENT_QUARTER} {CURRENT_YEAR} · Organization-wide metrics · {users.length} users · {allGoals.length} goals</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary" onClick={() => setShowPushKPI(true)} style={{ whiteSpace: 'nowrap' }}>
              <Send size={14} /> Push KPI
            </button>
            <button className="btn btn-secondary" onClick={handleExportCSV} style={{ whiteSpace: 'nowrap' }}>
              <BarChart3 size={14} /> Export CSV
            </button>
          </div>
        </div>
        <div className="welcome-particles"><div className="particle p1" /><div className="particle p2" /><div className="particle p3" /></div>
      </div>

      <div className="kpi-grid stagger-children">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card glass-card">
            <div className="kpi-header"><div className="kpi-icon" style={{ color: kpi.color, background: `${kpi.color}15` }}><kpi.icon size={20} /></div><div className={`kpi-trend ${kpi.trendUp ? 'trend-up' : 'trend-down'}`}>{kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{kpi.trend}</div></div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-card-static animate-fade-in-up" style={{ gridColumn: 'span 2' }}>
          <div className="chart-header"><h3>Organization Goal Status</h3></div>
          {pieData.length > 0 ? (
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">{pieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '13px' }} /></PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">{pieData.map((e, i) => <div key={i} className="legend-item"><span className="legend-dot" style={{ background: e.color }} /><span className="legend-label">{e.name}</span><span className="legend-value">{e.value}</span></div>)}</div>
            </div>
          ) : <div className="empty-state"><p>No data</p></div>}
        </div>
        <div className="chart-card glass-card-static animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="chart-header"><h3>Escalations</h3><AlertTriangle size={14} style={{ color: 'var(--accent-danger)' }} /></div>
          <div className="goal-list-compact">
            {escalations.length === 0 ? <div className="empty-state" style={{ padding: 'var(--space-6)' }}><p>No escalations</p></div> :
              escalations.map(g => { const owner = getUserById(g.ownerId); const days = Math.floor((Date.now() - new Date(g.updatedAt).getTime()) / 86400000); return (
                <div key={g.id} className="goal-row"><div className="goal-row-info"><div className="goal-row-title">{g.title}</div><div className="goal-row-meta">{owner?.name} · {days}d pending</div></div><span className="badge badge-danger" style={{ fontSize: '10px' }}>Escalated</span></div>
              ); })}
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="recent-goals glass-card-static animate-fade-in-up">
          <div className="section-header"><h3>All Active Goals</h3></div>
          <div className="goal-list-compact">
            {allGoals.filter(g => g.status !== GOAL_STATUS.COMPLETED && g.status !== GOAL_STATUS.REJECTED).slice(0, 6).map(g => { const owner = getUserById(g.ownerId); return (
              <div key={g.id} className="goal-row"><div className="goal-row-info"><div className="goal-row-title">{g.title}</div><div className="goal-row-meta">{owner?.name} · {g.category}</div></div><div className="goal-row-progress"><div className="mini-progress-bar"><div className="mini-progress-fill" style={{ width: `${g.progress}%`, background: getProgressColor(g.progress) }} /></div><span className="goal-row-pct">{g.progress}%</span></div></div>
            ); })}
          </div>
        </div>
        <div className="recent-activity glass-card-static animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="section-header"><h3>System Activity</h3></div>
          <div className="activity-list">
            {notifications.length === 0 ? <div className="empty-state" style={{ padding: 'var(--space-6)' }}><p>No recent activity</p></div> :
              notifications.map(n => <div key={n.id} className="activity-item"><div className={`activity-dot ${n.isRead ? '' : 'activity-dot-unread'}`} /><div className="activity-content"><div className="activity-text">{n.message}</div><div className="activity-time">{timeAgo(n.createdAt)}</div></div></div>)}
          </div>
        </div>
      </div>

      {/* ─── Push Departmental KPI Modal (Admin) ─── */}
      {showPushKPI && (
        <>
          <div className="modal-backdrop" onClick={() => setShowPushKPI(false)} />
          <div className="modal" role="dialog" aria-label="Push KPI" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Push Departmental KPI (Admin)</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowPushKPI(false)} aria-label="Close"><span style={{ fontSize: '18px' }}>✕</span></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">KPI Title <span className="required">*</span></label>
                <input className="input-field" placeholder="e.g., Organization-wide training compliance" value={kpiForm.title} onChange={e => setKpiForm(p => ({ ...p, title: e.target.value }))} autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input-field" placeholder="Describe the KPI..." value={kpiForm.description} onChange={e => setKpiForm(p => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label">Target Value</label>
                  <input className="input-field" type="number" value={kpiForm.targetValue} onChange={e => setKpiForm(p => ({ ...p, targetValue: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Default Weightage</label>
                  <input className="input-field" type="number" min="10" max="100" value={kpiForm.weightage} onChange={e => setKpiForm(p => ({ ...p, weightage: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Select Employees <span className="required">*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', maxHeight: '140px', overflowY: 'auto', padding: 'var(--space-2)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  {users.filter(m => m.role !== 'admin').map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleEmployee(emp.id)}
                      className={`badge ${selectedEmployees.includes(emp.id) ? 'badge-primary' : 'badge-ghost'}`}
                      style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                    >
                      {emp.name} ({emp.department})
                    </button>
                  ))}
                </div>
                <span className="input-hint">{selectedEmployees.length} selected</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowPushKPI(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePushKPI} disabled={!kpiForm.title.trim() || selectedEmployees.length === 0}>
                <Send size={14} /> Push to {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ─── Main Dashboard Router ─── */
export default function Dashboard() {
  const { currentUser, getTeamMembers, getUserById, users } = useAuthStore();
  const goalStore = useGoalStore();
  const notificationStore = useNotificationStore();
  const notifications = notificationStore.getUserNotifications(currentUser?.id).slice(0, 5);

  // Wave 4: Automated Escalations check
  useEffect(() => {
    if (currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.MANAGER) {
      goalStore.checkEscalations(notificationStore.addNotification);
    }
  }, [goalStore, notificationStore, currentUser?.role]);

  const role = currentUser?.role;

  return (
    <div className="dashboard">
      {role === ROLES.ADMIN ? (
        <AdminDashboard currentUser={currentUser} goalStore={goalStore} users={users} getUserById={getUserById} notifications={notifications} />
      ) : role === ROLES.MANAGER ? (
        <ManagerDashboard currentUser={currentUser} goalStore={goalStore} users={users} getUserById={getUserById} notifications={notifications} />
      ) : (
        <EmployeeDashboard currentUser={currentUser} goalStore={goalStore} notifications={notifications} getUserById={getUserById} />
      )}
    </div>
  );
}
