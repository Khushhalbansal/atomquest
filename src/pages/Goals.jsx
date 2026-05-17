import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, Target, Edit2, Trash2, Send, Clock,
  CheckCircle, XCircle, ChevronDown, MoreVertical, Calendar, Award,
  BarChart3, TrendingUp, AlertTriangle
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useGoalStore from '../stores/goalStore';
import useNotificationStore from '../stores/notificationStore';
import {
  GOAL_STATUS, STATUS_LABELS, STATUS_COLORS, GOAL_CATEGORIES,
  QUARTERS, CURRENT_QUARTER, CURRENT_YEAR, VALIDATION, NOTIFICATION_TYPES,
  UOM_LABELS
} from '../utils/constants';
import { formatDate, getProgressColor, truncate, getInitials, getAvatarColor } from '../utils/helpers';
import {
  canEditGoal, canDeleteGoal, canSubmitForApproval, canSubmitGoalSheet,
  getRemainingWeightage, getWeightageUsed
} from '../utils/validators';
import GoalFormModal from '../components/goals/GoalFormModal';
import CheckInModal from '../components/goals/CheckInModal';
import './Goals.css';

export default function Goals() {
  const navigate = useNavigate();
  const { currentUser, getUserById } = useAuthStore();
  const goalStore = useGoalStore();
  const { addToast, addNotification, logAction } = useNotificationStore();

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterQuarter, setFilterQuarter] = useState(CURRENT_QUARTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [checkInGoal, setCheckInGoal] = useState(null);

  const userGoals = useMemo(() => {
    let goals = goalStore.getGoalsByUser(currentUser?.id, filterQuarter, CURRENT_YEAR);
    if (filterStatus !== 'all') {
      goals = goals.filter(g => g.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      goals = goals.filter(g =>
        g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
      );
    }
    return goals;
  }, [goalStore.goals, currentUser?.id, filterStatus, filterQuarter, searchQuery]);

  const currentQuarterGoals = goalStore.getGoalsByUser(currentUser?.id, CURRENT_QUARTER, CURRENT_YEAR);
  const ownedGoals = currentQuarterGoals.filter(g => g.ownerId === currentUser?.id);
  const weightageUsed = getWeightageUsed(ownedGoals);
  const remainingWeightage = getRemainingWeightage(ownedGoals);
  const sheetCheck = canSubmitGoalSheet(ownedGoals);

  const handleCreateGoal = (goalData) => {
    const goal = goalStore.createGoal({
      ...goalData,
      ownerId: currentUser.id,
      quarter: CURRENT_QUARTER,
      year: CURRENT_YEAR,
    });
    logAction({
      entityType: 'goal',
      entityId: goal.id,
      action: 'create',
      userId: currentUser.id,
      changes: { after: { title: goal.title } },
    });
    addToast({ type: 'success', title: 'Goal Created', message: `"${goal.title}" saved as draft.` });
    setShowForm(false);
  };

  const handleUpdateGoal = (goalData) => {
    goalStore.updateGoal(editingGoal.id, goalData);
    logAction({
      entityType: 'goal',
      entityId: editingGoal.id,
      action: 'update',
      userId: currentUser.id,
      changes: { before: { title: editingGoal.title }, after: { title: goalData.title } },
    });
    addToast({ type: 'success', title: 'Goal Updated', message: `"${goalData.title}" has been updated.` });
    setEditingGoal(null);
    setShowForm(false);
  };

  const handleDelete = (goalId) => {
    const goal = goalStore.getGoalById(goalId);
    goalStore.deleteGoal(goalId);
    logAction({
      entityType: 'goal',
      entityId: goalId,
      action: 'delete',
      userId: currentUser.id,
      changes: { before: { title: goal?.title } },
    });
    addToast({ type: 'info', title: 'Goal Deleted', message: `"${goal?.title}" has been removed.` });
    setDeleteConfirm(null);
  };

  const handleSubmitForApproval = (goalId) => {
    // BRD 2.1: total weightage must equal exactly 100% before submission
    if (!sheetCheck.canSubmit) {
      addToast({ type: 'error', title: 'Cannot Submit', message: sheetCheck.reason });
      return;
    }
    goalStore.submitForApproval(goalId);
    const goal = goalStore.getGoalById(goalId);
    const manager = getUserById(currentUser?.managerId);

    logAction({
      entityType: 'goal',
      entityId: goalId,
      action: 'submit',
      userId: currentUser.id,
      changes: { before: { status: 'draft' }, after: { status: 'pending_approval' } },
    });

    if (manager) {
      addNotification({
        userId: manager.id,
        type: NOTIFICATION_TYPES.APPROVAL_REQUESTED,
        title: 'New goal pending approval',
        message: `${currentUser.name} submitted "${goal?.title}" for your approval.`,
        relatedEntityId: goalId,
      });
    }

    addToast({ type: 'info', title: 'Submitted', message: `"${goal?.title}" sent for approval.` });
  };

  const handleProgressUpdate = (goalId, progress) => {
    goalStore.updateProgress(goalId, progress);
  };

  const handleCheckIn = (checkInData) => {
    const checkIn = goalStore.addCheckIn(checkInGoal.id, {
      ...checkInData,
      submittedBy: currentUser.id,
      quarter: CURRENT_QUARTER,
    });
    logAction({
      entityType: 'goal',
      entityId: checkInGoal.id,
      action: 'check_in',
      userId: currentUser.id,
      changes: { after: { actualValue: checkInData.actualValue, status: checkInData.status } },
    });
    addToast({
      type: 'success',
      title: 'Check-In Logged',
      message: `Progress for "${checkInGoal.title}" has been updated automatically.`,
    });
    setCheckInGoal(null);
  };

  const openEditForm = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  // Check if a goal can receive check-ins (approved or in-progress)
  const canCheckIn = (goal) => {
    return (goal.status === GOAL_STATUS.APPROVED || goal.status === GOAL_STATUS.IN_PROGRESS) &&
           goal.ownerId === currentUser?.id;
  };

  return (
    <div className="goals-page">
      {/* Weightage Bar */}
      <div className="weightage-bar glass-card-static animate-fade-in">
        <div className="weightage-info">
          <div className="weightage-label">
            <Target size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>Q{CURRENT_QUARTER.slice(1)} Weightage Allocation</span>
          </div>
          <div className="weightage-stats">
            <span className="weightage-used">{weightageUsed}% used</span>
            <span className="weightage-divider">·</span>
            <span className="weightage-remaining">{remainingWeightage}% remaining</span>
            <span className="weightage-divider">·</span>
            <span className="weightage-count">{currentQuarterGoals.length}/{VALIDATION.MAX_GOALS} goals</span>
          </div>
        </div>
        <div className="weightage-progress">
          <div className="weightage-track">
            <div
              className="weightage-fill"
              style={{
                width: `${weightageUsed}%`,
                background: weightageUsed > 100
                  ? 'var(--accent-danger)'
                  : weightageUsed >= 80
                  ? 'var(--accent-success)'
                  : 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
              }}
            />
          </div>
        </div>
      </div>

      {/* BRD Weightage Warning */}
      {ownedGoals.length > 0 && !sheetCheck.canSubmit && (
        <div className="glass-card-static animate-fade-in" style={{
          padding: 'var(--space-3) var(--space-4)',
          borderLeft: '3px solid var(--accent-warning)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          fontSize: 'var(--text-sm)', color: 'var(--accent-warning)',
          marginBottom: 'var(--space-4)',
        }}>
          <AlertTriangle size={16} />
          <span>{sheetCheck.reason}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="goals-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search goals"
            />
          </div>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterQuarter}
            onChange={e => setFilterQuarter(e.target.value)}
            aria-label="Filter by quarter"
          >
            {QUARTERS.map(q => (
              <option key={q} value={q}>{q} {CURRENT_YEAR}</option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditingGoal(null); setShowForm(true); }}
          disabled={currentQuarterGoals.length >= VALIDATION.MAX_GOALS}
          aria-label="Create new goal"
        >
          <Plus size={16} />
          New Goal
        </button>
      </div>

      {/* Goals List */}
      <div className="goals-list stagger-children">
        {userGoals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Target size={32} />
            </div>
            <h3>No goals found</h3>
            <p>Create your first goal to start tracking progress towards your objectives.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Create Goal
            </button>
          </div>
        ) : (
          userGoals.map(goal => {
            const canEdit = canEditGoal(goal, currentUser?.id, currentUser?.role);
            const canDel = canDeleteGoal(goal, currentUser?.id, currentUser?.role);
            const canSubmit = canSubmitForApproval(goal);
            const approver = goal.approvedBy ? getUserById(goal.approvedBy) : null;

            return (
              <div key={goal.id} className="goal-card glass-card">
                <div className="goal-card-header">
                  <div className="goal-card-left">
                    <span className={`badge badge-${STATUS_COLORS[goal.status]}`}>
                      {STATUS_LABELS[goal.status]}
                    </span>
                    {goal.type !== 'individual' && (
                      <span className="badge badge-info">{goal.type}</span>
                    )}
                    {goal.uom && (
                      <span className="badge badge-ghost" style={{ fontSize: 'var(--text-xs)' }}>
                        {UOM_LABELS[goal.uom] || goal.uom}
                      </span>
                    )}
                  </div>
                  <div className="goal-card-actions">
                    {canCheckIn(goal) && (
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => setCheckInGoal(goal)}
                        title="Log check-in"
                        style={{ background: 'var(--accent-info)', color: '#fff' }}
                      >
                        <BarChart3 size={12} /> Check-In
                      </button>
                    )}
                    {canSubmit && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleSubmitForApproval(goal.id)}
                        title={sheetCheck.canSubmit ? 'Submit for approval' : sheetCheck.reason}
                        disabled={!sheetCheck.canSubmit}
                        style={!sheetCheck.canSubmit ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        <Send size={12} /> Submit
                      </button>
                    )}
                    {canEdit && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => openEditForm(goal)}
                        aria-label={`Edit ${goal.title}`}
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    {canDel && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setDeleteConfirm(goal.id)}
                        aria-label={`Delete ${goal.title}`}
                        style={{ color: 'var(--accent-danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="goal-card-title">{goal.title}</h3>
                <p className="goal-card-desc">{truncate(goal.description, 120)}</p>

                <div className="goal-card-meta">
                  <div className="meta-item">
                    <Calendar size={13} />
                    <span>Due {formatDate(goal.dueDate)}</span>
                  </div>
                  <div className="meta-item">
                    <Award size={13} />
                    <span>{goal.weightage}% weight</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-category">{goal.category}</span>
                  </div>
                  {goal.targetValue && (
                    <div className="meta-item">
                      <Target size={13} />
                      <span>Target: {goal.targetValue}</span>
                    </div>
                  )}
                  {goal.actualValue != null && (
                    <div className="meta-item" style={{ color: 'var(--accent-info)' }}>
                      <TrendingUp size={13} />
                      <span>Actual: {goal.actualValue}</span>
                    </div>
                  )}
                  {approver && (
                    <div className="meta-item meta-approver">
                      <CheckCircle size={13} style={{ color: 'var(--accent-success)' }} />
                      <span>Approved by {approver.name}</span>
                    </div>
                  )}
                  {goal.rejectionReason && (
                    <div className="meta-item meta-rejection">
                      <XCircle size={13} style={{ color: 'var(--accent-danger)' }} />
                      <span>{goal.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="goal-card-progress">
                  <div className="progress-header">
                    <span className="progress-label">
                      Progress
                      {goal.checkIns?.length > 0 && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>
                          (Auto-computed · {goal.checkIns.length} check-in{goal.checkIns.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                    <span className="progress-value" style={{ color: getProgressColor(goal.progress) }}>
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${goal.progress}%`,
                        background: `linear-gradient(90deg, ${getProgressColor(goal.progress)}, ${getProgressColor(goal.progress)}cc)`,
                      }}
                    />
                  </div>
                  {/* Only show manual slider for goals without check-ins */}
                  {!goal.checkIns?.length && (goal.status === GOAL_STATUS.IN_PROGRESS || goal.status === GOAL_STATUS.APPROVED) && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goal.progress}
                      onChange={e => handleProgressUpdate(goal.id, parseInt(e.target.value))}
                      className="progress-slider"
                      aria-label={`Update progress for ${goal.title}`}
                    />
                  )}
                </div>

                {/* Check-In History (latest) */}
                {goal.checkIns?.length > 0 && (
                  <div className="checkin-history" style={{
                    marginTop: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    background: 'var(--bg-glass)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                      Latest Check-In
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                      <span>Value: {goal.checkIns[goal.checkIns.length - 1].actualValue}</span>
                      <span>Status: {goal.checkIns[goal.checkIns.length - 1].status?.replace('_', ' ')}</span>
                      {goal.checkIns[goal.checkIns.length - 1].comments && (
                        <span>Note: {truncate(goal.checkIns[goal.checkIns.length - 1].comments, 60)}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Milestones */}
                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="goal-milestones">
                    <div className="milestone-label">Milestones</div>
                    <div className="milestone-list">
                      {goal.milestones.map(ms => (
                        <div key={ms.id} className={`milestone-item milestone-${ms.status}`}>
                          <div className={`milestone-dot ms-${ms.status}`} />
                          <span className="milestone-title">{ms.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score */}
                {goal.score != null && (
                  <div className="goal-score">
                    <span className="score-label-text">Score:</span>
                    <div className="score-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          className={`star ${star <= Math.round(goal.score) ? 'star-filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="score-num">{goal.score}/5</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)} />
          <div className="modal" role="dialog" aria-label="Delete confirmation">
            <div className="modal-header">
              <h2 className="modal-title">Delete Goal?</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
              This action cannot be undone. The goal and all associated data will be permanently removed.
            </p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <GoalFormModal
          goal={editingGoal}
          existingGoals={currentQuarterGoals}
          onSave={editingGoal ? handleUpdateGoal : handleCreateGoal}
          onClose={() => { setShowForm(false); setEditingGoal(null); }}
        />
      )}

      {/* Check-In Modal */}
      {checkInGoal && (
        <CheckInModal
          goal={checkInGoal}
          onSubmit={handleCheckIn}
          onClose={() => setCheckInGoal(null)}
        />
      )}
    </div>
  );
}
