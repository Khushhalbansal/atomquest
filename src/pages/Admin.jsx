import { useMemo, useState } from 'react';
import {
  Shield, Users, FileText, Clock, AlertTriangle, Search,
  Unlock, Calendar, CheckCircle, XCircle, Settings,
  Mail, Bot, Network, Send, ChevronRight, Globe, Zap
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useNotificationStore from '../stores/notificationStore';
import useGoalStore from '../stores/goalStore';
import {
  GOAL_STATUS, STATUS_LABELS, CURRENT_QUARTER, CURRENT_YEAR,
  QUARTERS, DEPARTMENTS
} from '../utils/constants';
import { formatDateTime, getInitials, getAvatarColor, capitalize } from '../utils/helpers';
import './Admin.css';

export default function Admin() {
  const { users, currentUser } = useAuthStore();
  const { getAuditLogs, addToast, logAction } = useNotificationStore();
  const goalStore = useGoalStore();
  const { getUserById } = useAuthStore();

  const [activeTab, setActiveTab] = useState('users');
  const [auditFilter, setAuditFilter] = useState('');
  const [unlockConfirm, setUnlockConfirm] = useState(null);

  // --- Escalation Config States ---
  const [escalationSubmissionDays, setEscalationSubmissionDays] = useState(7);
  const [escalationApprovalDays, setEscalationApprovalDays] = useState(7);
  const [escalationCheckInDays, setEscalationCheckInDays] = useState(10);
  const [activeEscalationSubTab, setActiveEscalationSubTab] = useState('logs');

  // --- Integration Config States ---
  const [ssoEnabled, setSsoEnabled] = useState(true);
  const [syncReportingLines, setSyncReportingLines] = useState(true);
  const [teamsNotificationsEnabled, setTeamsNotificationsEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://atomberg.webhook.office.com/webhookb2/3d8383a12a-3b5c-4d8e-9f0a-b2c3d4e5f6g7');
  const [activeIntegrationTab, setActiveIntegrationTab] = useState('sso');
  const [teamsMockInput, setTeamsMockInput] = useState('');

  const auditLogs = useMemo(() => {
    let logs = getAuditLogs();
    if (auditFilter) {
      const q = auditFilter.toLowerCase();
      logs = logs.filter(l =>
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q) ||
        getUserById(l.userId)?.name.toLowerCase().includes(q)
      );
    }
    return logs.slice(0, 50);
  }, [auditFilter, getAuditLogs]);

  // Escalations: goals pending > configured approval days
  const escalations = useMemo(() => {
    const now = Date.now();
    return goalStore.goals.filter(g => {
      if (g.status !== 'pending_approval') return false;
      const submitted = new Date(g.updatedAt).getTime();
      return now - submitted > escalationApprovalDays * 24 * 60 * 60 * 1000;
    });
  }, [goalStore.goals, escalationApprovalDays]);

  // Check-in completion status per user for current quarter
  const completionData = useMemo(() => {
    const employees = users.filter(u => u.role === 'employee');
    return employees.map(emp => {
      const empGoals = goalStore.goals.filter(
        g => g.ownerId === emp.id && g.quarter === CURRENT_QUARTER && g.year === CURRENT_YEAR
      );
      const activeGoals = empGoals.filter(
        g => g.status === GOAL_STATUS.APPROVED || g.status === GOAL_STATUS.IN_PROGRESS || g.status === GOAL_STATUS.COMPLETED
      );
      const checkedInGoals = activeGoals.filter(g => g.checkIns?.length > 0);
      const manager = getUserById(emp.managerId);
      return {
        ...emp,
        managerName: manager?.name || 'N/A',
        totalGoals: empGoals.length,
        activeGoals: activeGoals.length,
        checkedIn: checkedInGoals.length,
        allCheckedIn: activeGoals.length > 0 && checkedInGoals.length === activeGoals.length,
        noGoals: empGoals.length === 0,
      };
    });
  }, [users, goalStore.goals]);

  // Locked goals for unlock capability
  const lockedGoals = useMemo(() => {
    return goalStore.goals.filter(g =>
      g.status === GOAL_STATUS.APPROVED || g.status === GOAL_STATUS.IN_PROGRESS || g.status === GOAL_STATUS.COMPLETED
    );
  }, [goalStore.goals]);

  const handleUnlockGoal = (goalId) => {
    goalStore.updateGoal(goalId, {
      status: GOAL_STATUS.DRAFT,
      isLocked: false,
      approvedBy: null,
      approvedAt: null,
    });
    logAction({
      entityType: 'goal', entityId: goalId, action: 'unlock',
      userId: currentUser.id,
      changes: { after: { status: 'draft', unlocked: true } },
    });
    addToast({ type: 'success', title: 'Goal Unlocked', message: 'Goal has been reverted to Draft for editing.' });
    setUnlockConfirm(null);
  };

  const checkedInCount = completionData.filter(d => d.allCheckedIn).length;
  const pendingCount = completionData.filter(d => !d.allCheckedIn && !d.noGoals).length;

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'audit', label: 'Audit Logs', icon: FileText, count: auditLogs.length },
    { id: 'escalations', label: 'Escalations', icon: AlertTriangle, count: escalations.length },
    { id: 'completion', label: 'Check-in Status', icon: CheckCircle, count: pendingCount },
    { id: 'unlock', label: 'Goal Unlock', icon: Unlock, count: lockedGoals.length },
    { id: 'sso_teams', label: 'SSO & Teams Config', icon: Settings, count: null },
    { id: 'cycles', label: 'Cycle Management', icon: Settings, count: null },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header glass-card-static animate-fade-in">
        <Shield size={20} style={{ color: 'var(--accent-primary)' }} />
        <div>
          <h2>Admin Panel</h2>
          <p>Manage users, audit logs, escalations, cycles, and unlock goals.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count != null && <span className="admin-tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="admin-content animate-fade-in" role="tabpanel">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-table-wrapper glass-card-static">
            <table className="admin-table" role="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Goals</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const userGoals = goalStore.goals.filter(g => g.ownerId === user.id);
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="table-user">
                          <div className="table-avatar" style={{ background: getAvatarColor(user.name) }}>
                            {getInitials(user.name)}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td className="td-muted">{user.email}</td>
                      <td>
                        <span className={`badge badge-${user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'warning' : 'primary'}`}>
                          {capitalize(user.role)}
                        </span>
                      </td>
                      <td className="td-muted">{user.department}</td>
                      <td>{userGoals.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div>
            <div className="audit-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Filter logs by action, entity, or user..."
                value={auditFilter}
                onChange={e => setAuditFilter(e.target.value)}
                className="search-input"
                aria-label="Filter audit logs"
              />
            </div>
            <div className="admin-table-wrapper glass-card-static">
              <table className="admin-table" role="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => {
                    const user = getUserById(log.userId);
                    return (
                      <tr key={log.id}>
                        <td className="td-muted td-mono">{formatDateTime(log.timestamp)}</td>
                        <td>
                          <div className="table-user">
                            <div className="table-avatar-sm" style={{ background: getAvatarColor(user?.name || '') }}>
                              {getInitials(user?.name || '')}
                            </div>
                            <span>{user?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${log.action === 'delete' ? 'danger' : log.action === 'approve' ? 'success' : log.action === 'reject' ? 'warning' : 'ghost'}`}>
                            {capitalize(log.action)}
                          </span>
                        </td>
                        <td className="td-muted">{capitalize(log.entityType)}</td>
                        <td className="td-muted td-mono" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {JSON.stringify(log.changes?.after || log.changes).slice(0, 50)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Escalations Tab */}
        {activeTab === 'escalations' && (
          <div>
            <div className="sub-tab-header glass-card-static" style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-2)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass-dim)' }}>
              <button
                className={`btn btn-sm ${activeEscalationSubTab === 'logs' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveEscalationSubTab('logs')}
              >
                <FileText size={14} style={{ marginRight: '6px' }} />
                Active Escalations ({escalations.length})
              </button>
              <button
                className={`btn btn-sm ${activeEscalationSubTab === 'rules' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveEscalationSubTab('rules')}
              >
                <Settings size={14} style={{ marginRight: '6px' }} />
                Escalation Rules & Chain Configuration
              </button>
            </div>

            {activeEscalationSubTab === 'logs' ? (
              <div>
                {escalations.length === 0 ? (
                  <div className="empty-state glass-card-static">
                    <div className="empty-state-icon">
                      <CheckCircle size={32} style={{ color: 'var(--accent-success)' }} />
                    </div>
                    <h3>No Active Escalations</h3>
                    <p>All workflows are running within the configured deadlines ({escalationApprovalDays} days approval grace period).</p>
                  </div>
                ) : (
                  <div className="escalation-list stagger-children">
                    {escalations.map(goal => {
                      const owner = getUserById(goal.ownerId);
                      const manager = getUserById(owner?.managerId);
                      const daysPending = Math.floor((Date.now() - new Date(goal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={goal.id} className="escalation-card glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
                          <div style={{ flex: 1 }}>
                            <div className="escalation-header">
                              <AlertTriangle size={16} style={{ color: 'var(--accent-danger)' }} />
                              <span className="escalation-days" style={{ color: 'var(--accent-danger)' }}>{daysPending} days pending approval</span>
                            </div>
                            <h4 className="escalation-title">{goal.title}</h4>
                            <div className="escalation-meta">
                              <span>By: {owner?.name}</span>
                              <span>Approver: {manager?.name || 'N/A'}</span>
                              <span>Submitted: {formatDateTime(goal.updatedAt)}</span>
                            </div>
                          </div>
                          <div>
                            <button
                              className="btn btn-sm"
                              style={{ color: 'var(--accent-danger)', border: '1px solid var(--accent-danger-dim)', background: 'var(--accent-danger-dim)' }}
                              onClick={() => {
                                addToast({
                                  type: 'success',
                                  title: 'Escalation Alert Sent!',
                                  message: `Notification chain triggered: Alerted ${owner?.name}, ${manager?.name}, and HR via MS Teams webhook.`
                                });
                                logAction({
                                  entityType: 'goal',
                                  entityId: goal.id,
                                  action: 'escalate_alert',
                                  userId: currentUser.id,
                                  changes: { after: { alerted: true } }
                                });
                              }}
                            >
                              <Send size={12} style={{ marginRight: '6px' }} />
                              Trigger Alert Chain
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} style={{ color: 'var(--accent-warning)' }} />
                  Escalation Conditions Configuration
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '600px' }}>
                  <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Employee Goal Submission Grace Period</label>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Trigger alert chain if goals aren't submitted within N days of cycle open.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: '80px', textAlign: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '6px', borderRadius: '4px' }}
                        value={escalationSubmissionDays}
                        onChange={e => setEscalationSubmissionDays(Math.max(1, parseInt(e.target.value) || 7))}
                      />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Days</span>
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', borderTop: '1px solid var(--border-glass)', paddingTop: 'var(--space-4)' }}>
                    <div>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Manager Goal Approval Grace Period</label>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Escalate goal sheet if it remains pending approval for more than N days.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: '80px', textAlign: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '6px', borderRadius: '4px' }}
                        value={escalationApprovalDays}
                        onChange={e => setEscalationApprovalDays(Math.max(0, parseInt(e.target.value) || 0))}
                      />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Days</span>
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', borderTop: '1px solid var(--border-glass)', paddingTop: 'var(--space-4)' }}>
                    <div>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Quarterly Check-In Completion Grace Period</label>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Trigger auto-reminders if active check-ins are not completed within N days.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: '80px', textAlign: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '6px', borderRadius: '4px' }}
                        value={escalationCheckInDays}
                        onChange={e => setEscalationCheckInDays(Math.max(1, parseInt(e.target.value) || 10))}
                      />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Days</span>
                    </div>
                  </div>
                </div>

                {/* Visual Escalation Chain */}
                <h4 style={{ fontFamily: 'var(--font-display)', marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)', borderTop: '1px solid var(--border-glass)', paddingTop: 'var(--space-5)' }}>
                  Visual Escalation Chain Pathway
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', background: 'var(--bg-glass)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '150px', textAlign: 'center', padding: 'var(--space-3)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ background: 'var(--accent-primary-dim)', color: 'var(--accent-primary)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '8px' }}>1</div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Stage 1: Alert Employee</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>Day N Limit. Teams webhook ping sent to the employee.</div>
                  </div>
                  <ChevronRight size={20} className="td-muted" />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '150px', textAlign: 'center', padding: 'var(--space-3)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ background: 'rgba(235, 163, 0, 0.1)', color: 'var(--accent-warning)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '8px' }}>2</div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Stage 2: Alert Manager</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>Day N + 3. Automated alert copied to direct L1 Manager.</div>
                  </div>
                  <ChevronRight size={20} className="td-muted" />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '150px', textAlign: 'center', padding: 'var(--space-3)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ background: 'var(--accent-danger-dim)', color: 'var(--accent-danger)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '8px' }}>3</div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Stage 3: Escalate to HR</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>Day N + 7. Escalated to Skip-level Manager and HR Partners.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ Check-in Completion Status Tab ═══════ */}
        {activeTab === 'completion' && (
          <div>
            <div className="glass-card-static" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <CheckCircle size={16} style={{ color: 'var(--accent-success)' }} />
                <span style={{ fontSize: 'var(--text-sm)' }}><strong>{checkedInCount}</strong> employees completed all check-ins</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <XCircle size={16} style={{ color: 'var(--accent-danger)' }} />
                <span style={{ fontSize: 'var(--text-sm)' }}><strong>{pendingCount}</strong> employees with pending check-ins</span>
              </div>
            </div>
            <div className="admin-table-wrapper glass-card-static">
              <table className="admin-table" role="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Manager</th>
                    <th>Goals</th>
                    <th>Checked-In</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completionData.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div className="table-user">
                          <div className="table-avatar-sm" style={{ background: getAvatarColor(emp.name) }}>
                            {getInitials(emp.name)}
                          </div>
                          <span>{emp.name}</span>
                        </div>
                      </td>
                      <td className="td-muted">{emp.department}</td>
                      <td className="td-muted">{emp.managerName}</td>
                      <td>{emp.activeGoals} / {emp.totalGoals}</td>
                      <td>{emp.checkedIn} / {emp.activeGoals}</td>
                      <td>
                        {emp.noGoals ? (
                          <span className="badge badge-ghost">No Goals</span>
                        ) : emp.allCheckedIn ? (
                          <span className="badge badge-success">✅ Complete</span>
                        ) : (
                          <span className="badge badge-danger">❌ Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════ Goal Unlock Tab ═══════ */}
        {activeTab === 'unlock' && (
          <div>
            {lockedGoals.length === 0 ? (
              <div className="empty-state glass-card-static">
                <div className="empty-state-icon"><Unlock size={32} /></div>
                <h3>No Locked Goals</h3>
                <p>There are no approved or in-progress goals to unlock.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper glass-card-static">
                <table className="admin-table" role="table">
                  <thead>
                    <tr>
                      <th>Goal</th>
                      <th>Owner</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lockedGoals.map(goal => {
                      const owner = getUserById(goal.ownerId);
                      return (
                        <tr key={goal.id}>
                          <td style={{ maxWidth: '250px' }}>{goal.title}</td>
                          <td>
                            <div className="table-user">
                              <div className="table-avatar-sm" style={{ background: getAvatarColor(owner?.name || '') }}>
                                {getInitials(owner?.name || '')}
                              </div>
                              <span>{owner?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${goal.status === 'completed' ? 'success' : goal.status === 'in_progress' ? 'primary' : 'info'}`}>
                              {STATUS_LABELS[goal.status]}
                            </span>
                          </td>
                          <td>{goal.progress}%</td>
                          <td>
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => setUnlockConfirm(goal.id)}
                              style={{ color: 'var(--accent-warning)' }}
                            >
                              <Unlock size={14} /> Unlock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════ SSO & Teams Integration Tab ═══════ */}
        {activeTab === 'sso_teams' && (
          <div>
            <div className="sub-tab-header glass-card-static" style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-2)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass-dim)' }}>
              <button
                className={`btn btn-sm ${activeIntegrationTab === 'sso' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveIntegrationTab('sso')}
              >
                <Network size={14} style={{ marginRight: '6px' }} />
                Microsoft Entra ID (Azure AD) Sync
              </button>
              <button
                className={`btn btn-sm ${activeIntegrationTab === 'teams' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveIntegrationTab('teams')}
              >
                <Bot size={14} style={{ marginRight: '6px' }} />
                Email & Microsoft Teams Integration
              </button>
            </div>

            {/* Microsoft Entra ID Sub-Tab */}
            {activeIntegrationTab === 'sso' ? (
              <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Network size={20} style={{ color: 'var(--accent-primary)' }} />
                    Microsoft Entra ID Single Sign-On Config
                  </h3>
                  <button
                    className={`btn btn-sm ${ssoEnabled ? 'btn-success' : 'btn-ghost'}`}
                    onClick={() => {
                      setSsoEnabled(!ssoEnabled);
                      addToast({
                        type: 'info',
                        title: ssoEnabled ? 'SSO Disabled' : 'SSO Enabled',
                        message: ssoEnabled ? 'Fallback to email/password authentication.' : 'Enforced SSO log in for @goalportal.com and @atomquest.io accounts.'
                      });
                    }}
                  >
                    {ssoEnabled ? '🟢 SSO Enforced' : '🔴 SSO Disabled'}
                  </button>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
                  Derived directly from Microsoft Entra ID metadata tenant attributes. Reporting hierarchy synchronizes automatically.
                </p>

                {/* AD Group Role Mappings */}
                <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-3)' }}>Entra AD Group Role Mappings</h4>
                <div className="admin-table-wrapper" style={{ marginBottom: 'var(--space-6)' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>AD Security Group</th>
                        <th>Directory ID (Azure Object GUID)</th>
                        <th>Mapped System Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { group: 'SG_GoalPortal_Admins', guid: '4d8a1e2f-3b5c-4d8e-9f0a-b2c3d4e5f6g7', role: 'Admin' },
                        { group: 'SG_GoalPortal_Managers', guid: '8f0a2b3c-4d8e-9f0a-b2c3-d4e5f6g7h8i9', role: 'Manager' },
                        { group: 'SG_GoalPortal_Employees', guid: '2c3d4e5f-6g7h-8i9j-a1b2-c3d4e5f6g7h8', role: 'Employee' },
                      ].map((row, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}><Globe size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> {row.group}</td>
                          <td className="td-muted td-mono">{row.guid}</td>
                          <td><span className={`badge badge-${row.role === 'Admin' ? 'danger' : row.role === 'Manager' ? 'warning' : 'primary'}`}>{row.role}</span></td>
                          <td><span className="badge badge-success">✅ Synchronized</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Visual Reporting Line Synced Tree */}
                <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-4)' }}>Synced Organization Reporting Hierarchy</h4>
                <div style={{ padding: 'var(--space-5)', background: 'var(--bg-glass-dim)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                  
                  {/* Root Admin */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
                    <div style={{ padding: 'var(--space-3) var(--space-5)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--accent-danger)', fontWeight: 'bold' }}>HR DIRECTOR (ADMIN)</div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>Maya Johnson</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>admin@goalportal.com</div>
                    </div>
                  </div>

                  {/* Connectors to Managers */}
                  <div style={{ display: 'flex', justifyContent: 'space-around', position: 'relative', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
                    
                    {/* Manager 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ padding: 'var(--space-3) var(--space-5)', background: 'rgba(235, 163, 0, 0.08)', border: '1px solid rgba(235, 163, 0, 0.2)', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--accent-warning)', fontWeight: 'bold' }}>L1 MANAGER (ENG)</div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Priya Sharma</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>manager@goalportal.com</div>
                      </div>
                      
                      {/* Manager 1 Direct Reports */}
                      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        <div style={{ padding: 'var(--space-2) var(--space-4)', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>Sam Patel</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>employee@goalportal.com</div>
                        </div>
                        <div style={{ padding: 'var(--space-2) var(--space-4)', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>Alex Morgan</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>alex@goalportal.com</div>
                        </div>
                      </div>
                    </div>

                    {/* Manager 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ padding: 'var(--space-3) var(--space-5)', background: 'rgba(235, 163, 0, 0.08)', border: '1px solid rgba(235, 163, 0, 0.2)', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--accent-warning)', fontWeight: 'bold' }}>L1 MANAGER (MKT)</div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>David Kim</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>david@goalportal.com</div>
                      </div>
                      
                      {/* Manager 2 Direct Reports */}
                      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        <div style={{ padding: 'var(--space-2) var(--space-4)', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>Jordan Lee</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>jordan@goalportal.com</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              // Email & Teams Sub-Tab
              <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={20} style={{ color: 'var(--accent-primary)' }} />
                  Microsoft Teams Bot & Email Notification Configs
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                  
                  {/* Triggers and webhook */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <h4 style={{ fontFamily: 'var(--font-display)' }}>Trigger Options</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                        <input
                          type="checkbox"
                          checked={emailNotificationsEnabled}
                          onChange={e => setEmailNotificationsEnabled(e.target.checked)}
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        Enable Automated Email Alerts & Window Warnings
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                        <input
                          type="checkbox"
                          checked={teamsNotificationsEnabled}
                          onChange={e => setTeamsNotificationsEnabled(e.target.checked)}
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        Enable Microsoft Teams Adaptive Card Bot Pings
                      </label>
                    </div>

                    <div style={{ marginTop: 'var(--space-3)' }}>
                      <label style={{ fontWeight: 600, fontSize: 'var(--text-xs)', display: 'block', marginBottom: '6px' }}>TEAMS INCOMING WEBHOOK URL</label>
                      <input
                        type="text"
                        className="form-input text-mono"
                        style={{ width: '100%', fontSize: '11px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '8px', borderRadius: '4px' }}
                        value={webhookUrl}
                        onChange={e => setWebhookUrl(e.target.value)}
                      />
                    </div>

                    <button
                      className="btn btn-sm btn-ghost"
                      style={{ border: '1px solid var(--border-glass)', marginTop: '6px', width: 'fit-content' }}
                      onClick={() => {
                        addToast({
                          type: 'info',
                          title: 'Simulated Webhook Ping',
                          message: 'Active webhook payload tested: Microsoft Teams channel notified successfully!'
                        });
                      }}
                    >
                      <Send size={12} style={{ marginRight: '6px' }} />
                      Dispatch Webhook Test Payload
                    </button>
                  </div>

                  {/* Interactive Adaptive Card Mock Sandbox */}
                  <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                      <Bot size={14} style={{ color: '#5B5FC7' }} />
                      <strong>Microsoft Teams Chat Box (Live Sandbox Mock)</strong>
                    </div>

                    <div style={{ background: 'var(--bg-glass-dim)', borderLeft: '3px solid #5B5FC7', padding: 'var(--space-3)', borderRadius: '0 var(--radius-md) var(--radius-md) 0', fontSize: 'var(--text-xs)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#5B5FC7', marginBottom: '6px' }}>
                        <span>📋 AtomQuest Goal submission</span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Just Now</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        <div><strong>Employee:</strong> Sam Patel</div>
                        <div><strong>Cycle:</strong> Q2 2026 Appraisal</div>
                        <div><strong>Total Goals weightage:</strong> 100% (Compliant)</div>
                        <div><strong>System Action:</strong> Submitted for Approval</div>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '3px' }}>REWORK FEEDBACK NOTES (OPTIONAL)</label>
                        <input
                          type="text"
                          placeholder="e.g. Please align Goal 2 with new AWS modules..."
                          className="form-input"
                          style={{ width: '100%', fontSize: '10px', padding: '4px 6px', height: '24px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '3px' }}
                          value={teamsMockInput}
                          onChange={e => setTeamsMockInput(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '10px', height: '24px', padding: '0 8px', background: '#5B5FC7', border: 'none' }}
                          onClick={() => {
                            addToast({
                              type: 'success',
                              title: 'Approved via MS Teams Sandbox!',
                              message: 'Goal sheet was approved dynamically from MS Teams.'
                            });
                          }}
                        >
                          Approve Inline
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          style={{ fontSize: '10px', height: '24px', padding: '0 8px', border: '1px solid var(--border-glass)' }}
                          onClick={() => {
                            addToast({
                              type: 'warning',
                              title: 'Rejection Sent via Teams',
                              message: teamsMockInput ? `Rework requested with notes: "${teamsMockInput}"` : 'Goal sheet was sent back to Draft for reworking.'
                            });
                            setTeamsMockInput('');
                          }}
                        >
                          Request Rework
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ Cycle Management Tab ═══════ */}
        {activeTab === 'cycles' && (
          <div>
            <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-4)' }}>
                <Calendar size={18} style={{ marginRight: 'var(--space-2)', verticalAlign: 'middle' }} />
                Appraisal Cycle Configuration
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div style={{ padding: 'var(--space-4)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Current Quarter</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--accent-primary)' }}>{CURRENT_QUARTER} {CURRENT_YEAR}</div>
                </div>
                <div style={{ padding: 'var(--space-4)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Active Window</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--accent-success)' }}>Goal Setting</div>
                </div>
                <div style={{ padding: 'var(--space-4)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Total Employees</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{users.filter(u => u.role === 'employee').length}</div>
                </div>
              </div>

              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-3)' }}>Annual Check-in Schedule</h4>
              <div className="admin-table-wrapper" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <table className="admin-table" role="table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Window Opens</th>
                      <th>Action</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { period: 'Phase 1 — Goal Setting', window: '1st May', action: 'Goal Creation, Submission & Approval', active: true },
                      { period: 'Q1 Check-in', window: 'July', action: 'Progress Update — Planned vs. Actual', active: false },
                      { period: 'Q2 Check-in', window: 'October', action: 'Progress Update — Planned vs. Actual', active: false },
                      { period: 'Q3 Check-in', window: 'January', action: 'Progress Update — Planned vs. Actual', active: false },
                      { period: 'Q4 / Annual', window: 'March / April', action: 'Final Achievement Capture', active: false },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.period}</td>
                        <td className="td-muted">{row.window}</td>
                        <td className="td-muted">{row.action}</td>
                        <td>
                          {row.active ? (
                            <span className="badge badge-success">🟢 Active</span>
                          ) : (
                            <span className="badge badge-ghost">Upcoming</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unlock Confirmation Modal */}
      {unlockConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setUnlockConfirm(null)} />
          <div className="modal" role="dialog" aria-label="Unlock goal">
            <div className="modal-header">
              <h2 className="modal-title">Unlock Goal?</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setUnlockConfirm(null)} aria-label="Close">
                <XCircle size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                This will revert the goal to <strong>Draft</strong> status, allowing the employee to make edits.
                All progress data and check-ins will be preserved. This action is logged in the audit trail.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setUnlockConfirm(null)}>Cancel</button>
              <button className="btn btn-warning" onClick={() => handleUnlockGoal(unlockConfirm)}>
                <Unlock size={14} /> Confirm Unlock
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
