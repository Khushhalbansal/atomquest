import { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar, Award, AlertTriangle, Edit2 } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useGoalStore from '../stores/goalStore';
import useNotificationStore from '../stores/notificationStore';
import { GOAL_STATUS, STATUS_LABELS, NOTIFICATION_TYPES, ROLES, UOM_LABELS } from '../utils/constants';
import { formatDate, timeAgo, getInitials, getAvatarColor, truncate } from '../utils/helpers';
import './Approvals.css';

export default function Approvals() {
  const { currentUser, getUserById, users } = useAuthStore();
  const goalStore = useGoalStore();
  const { addToast, addNotification, logAction } = useNotificationStore();

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [scoreModal, setScoreModal] = useState(null);
  const [scoreValue, setScoreValue] = useState(3);

  // Inline edit state — tracks edits per goal id
  const [inlineEdits, setInlineEdits] = useState({});

  const pendingGoals = useMemo(() => {
    if (currentUser?.role === ROLES.ADMIN) return goalStore.getAllPendingApprovals();
    return goalStore.getPendingApprovals(currentUser?.id, users);
  }, [goalStore.goals, currentUser?.id]);

  // Goals that are completed and need scoring
  const needsScoring = useMemo(() => {
    const teamIds = currentUser?.role === ROLES.ADMIN
      ? users.map(u => u.id)
      : users.filter(u => u.managerId === currentUser?.id).map(u => u.id);
    return goalStore.goals.filter(g =>
      g.status === GOAL_STATUS.COMPLETED && g.score == null && teamIds.includes(g.ownerId)
    );
  }, [goalStore.goals, currentUser?.id]);

  // ─── Inline Edit helpers ───
  const startEditing = (goal) => {
    setInlineEdits(prev => ({
      ...prev,
      [goal.id]: { weightage: goal.weightage, targetValue: goal.targetValue },
    }));
  };

  const cancelEditing = (goalId) => {
    setInlineEdits(prev => {
      const next = { ...prev };
      delete next[goalId];
      return next;
    });
  };

  const saveInlineEdits = (goalId) => {
    const edits = inlineEdits[goalId];
    if (!edits) return;
    const w = parseInt(edits.weightage);
    const t = parseFloat(edits.targetValue);
    if (isNaN(w) || w < 10) {
      addToast({ type: 'error', title: 'Invalid', message: 'Weightage must be at least 10%.' });
      return;
    }
    goalStore.updateGoal(goalId, { weightage: w, targetValue: t });
    logAction({
      entityType: 'goal', entityId: goalId, action: 'manager_edit',
      userId: currentUser.id,
      changes: { after: { weightage: w, targetValue: t } },
    });
    addToast({ type: 'success', title: 'Updated', message: 'Weightage & Target updated before approval.' });
    cancelEditing(goalId);
  };

  const handleApprove = (goalId) => {
    goalStore.approveGoal(goalId, currentUser.id);
    const goal = goalStore.getGoalById(goalId);
    logAction({
      entityType: 'goal', entityId: goalId, action: 'approve',
      userId: currentUser.id,
      changes: { before: { status: 'pending_approval' }, after: { status: 'approved' } },
    });
    addNotification({
      userId: goal?.ownerId,
      type: NOTIFICATION_TYPES.GOAL_APPROVED,
      title: 'Goal approved!',
      message: `Your goal "${goal?.title}" has been approved by ${currentUser.name}.`,
      relatedEntityId: goalId,
    });
    addToast({ type: 'success', title: 'Approved', message: `"${goal?.title}" has been approved.` });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    goalStore.rejectGoal(rejectModal, currentUser.id, rejectReason);
    const goal = goalStore.getGoalById(rejectModal);
    logAction({
      entityType: 'goal', entityId: rejectModal, action: 'reject',
      userId: currentUser.id,
      changes: { before: { status: 'pending_approval' }, after: { status: 'rejected', rejectionReason: rejectReason } },
    });
    addNotification({
      userId: goal?.ownerId,
      type: NOTIFICATION_TYPES.GOAL_REJECTED,
      title: 'Goal needs revision',
      message: `Your goal "${goal?.title}" was returned by ${currentUser.name}: "${rejectReason}"`,
      relatedEntityId: rejectModal,
    });
    addToast({ type: 'warning', title: 'Returned', message: `"${goal?.title}" sent back for revision.` });
    setRejectModal(null);
    setRejectReason('');
  };

  const handleScore = () => {
    goalStore.scoreGoal(scoreModal, scoreValue);
    const goal = goalStore.getGoalById(scoreModal);
    logAction({
      entityType: 'goal', entityId: scoreModal, action: 'update',
      userId: currentUser.id,
      changes: { before: { score: null }, after: { score: scoreValue } },
    });
    addToast({ type: 'success', title: 'Scored', message: `"${goal?.title}" scored ${scoreValue}/5.` });
    setScoreModal(null);
    setScoreValue(3);
  };

  return (
    <div className="approvals-page">
      {/* Pending Approvals */}
      <section className="approval-section">
        <div className="section-title">
          <Clock size={18} style={{ color: 'var(--accent-warning)' }} />
          <h2>Pending Approvals</h2>
          <span className="section-count">{pendingGoals.length}</span>
        </div>

        {pendingGoals.length === 0 ? (
          <div className="empty-state glass-card-static">
            <div className="empty-state-icon">
              <CheckCircle size={32} />
            </div>
            <h3>All caught up!</h3>
            <p>No goals awaiting your approval.</p>
          </div>
        ) : (
          <div className="approval-list stagger-children">
            {pendingGoals.map(goal => {
              const owner = getUserById(goal.ownerId);
              const isEditing = !!inlineEdits[goal.id];
              const edits = inlineEdits[goal.id] || {};
              return (
                <div key={goal.id} className="approval-card glass-card">
                  <div className="approval-card-top">
                    <div className="approval-user">
                      <div className="approval-avatar" style={{ background: getAvatarColor(owner?.name || '') }}>
                        {getInitials(owner?.name || '')}
                      </div>
                      <div>
                        <div className="approval-user-name">{owner?.name}</div>
                        <div className="approval-user-dept">{owner?.department} · Submitted {timeAgo(goal.updatedAt)}</div>
                      </div>
                    </div>
                  </div>

                  <h3 className="approval-title">{goal.title}</h3>
                  <p className="approval-desc">{truncate(goal.description, 160)}</p>

                  <div className="approval-meta">
                    {/* Inline-editable Weightage */}
                    {isEditing ? (
                      <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Award size={13} />
                        <input
                          type="number"
                          className="input-field"
                          value={edits.weightage}
                          onChange={e => setInlineEdits(prev => ({
                            ...prev,
                            [goal.id]: { ...prev[goal.id], weightage: e.target.value },
                          }))}
                          min={10} max={100}
                          style={{ width: '70px', padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                          aria-label="Edit weightage"
                        />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>% weight</span>
                      </div>
                    ) : (
                      <div className="meta-item">
                        <Award size={13} /> {goal.weightage}% weight
                      </div>
                    )}

                    <div className="meta-item">
                      <Calendar size={13} /> Due {formatDate(goal.dueDate)}
                    </div>

                    {/* Inline-editable Target */}
                    {isEditing ? (
                      <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--text-xs)' }}>Target:</span>
                        <input
                          type="number"
                          className="input-field"
                          value={edits.targetValue}
                          onChange={e => setInlineEdits(prev => ({
                            ...prev,
                            [goal.id]: { ...prev[goal.id], targetValue: e.target.value },
                          }))}
                          style={{ width: '80px', padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                          aria-label="Edit target value"
                        />
                      </div>
                    ) : (
                      goal.targetValue && (
                        <div className="meta-item" style={{ fontSize: 'var(--text-xs)' }}>
                          Target: {goal.targetValue}
                        </div>
                      )
                    )}

                    <div className="meta-item">
                      <span className="meta-category">{goal.category}</span>
                    </div>

                    {goal.uom && (
                      <div className="meta-item" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {UOM_LABELS[goal.uom] || goal.uom}
                      </div>
                    )}
                  </div>

                  <div className="approval-actions">
                    {/* Inline Edit Toggle */}
                    {!isEditing ? (
                      <button
                        className="btn btn-ghost"
                        onClick={() => startEditing(goal)}
                        title="Edit target & weightage inline"
                        style={{ fontSize: 'var(--text-xs)' }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn btn-primary"
                          onClick={() => saveInlineEdits(goal.id)}
                          style={{ fontSize: 'var(--text-xs)' }}
                        >
                          <CheckCircle size={14} /> Save
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => cancelEditing(goal.id)}
                          style={{ fontSize: 'var(--text-xs)' }}
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(goal.id)}
                      aria-label={`Approve ${goal.title}`}
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setRejectModal(goal.id)}
                      style={{ color: 'var(--accent-danger)' }}
                      aria-label={`Reject ${goal.title}`}
                    >
                      <XCircle size={16} /> Return
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Needs Scoring */}
      {needsScoring.length > 0 && (
        <section className="approval-section">
          <div className="section-title">
            <Award size={18} style={{ color: 'var(--accent-secondary)' }} />
            <h2>Needs Scoring</h2>
            <span className="section-count">{needsScoring.length}</span>
          </div>

          <div className="approval-list stagger-children">
            {needsScoring.map(goal => {
              const owner = getUserById(goal.ownerId);
              return (
                <div key={goal.id} className="approval-card glass-card">
                  <div className="approval-card-top">
                    <div className="approval-user">
                      <div className="approval-avatar" style={{ background: getAvatarColor(owner?.name || '') }}>
                        {getInitials(owner?.name || '')}
                      </div>
                      <div>
                        <div className="approval-user-name">{owner?.name}</div>
                        <div className="approval-user-dept">{owner?.department}</div>
                      </div>
                    </div>
                    <span className="badge badge-success">Completed</span>
                  </div>
                  <h3 className="approval-title">{goal.title}</h3>
                  <div className="approval-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => { setScoreModal(goal.id); setScoreValue(3); }}
                    >
                      <Award size={16} /> Score Goal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <>
          <div className="modal-backdrop" onClick={() => setRejectModal(null)} />
          <div className="modal" role="dialog" aria-label="Rejection reason">
            <div className="modal-header">
              <h2 className="modal-title">Return Goal</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setRejectModal(null)} aria-label="Close">
                <XCircle size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label" htmlFor="reject-reason">
                  Reason for returning <span className="required">*</span>
                </label>
                <textarea
                  id="reject-reason"
                  className="input-field"
                  placeholder="Provide feedback to help the employee improve their goal..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={4}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                <XCircle size={14} /> Return with Feedback
              </button>
            </div>
          </div>
        </>
      )}

      {/* Score Modal */}
      {scoreModal && (
        <>
          <div className="modal-backdrop" onClick={() => setScoreModal(null)} />
          <div className="modal" role="dialog" aria-label="Score goal">
            <div className="modal-header">
              <h2 className="modal-title">Score Goal</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setScoreModal(null)} aria-label="Close">
                <XCircle size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ alignItems: 'center' }}>
              <div className="score-input-display">
                <span className="score-big">{scoreValue}</span>
                <span className="score-max">/5</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={scoreValue}
                onChange={e => setScoreValue(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                aria-label="Score value"
              />
              <div className="score-labels">
                <span>Below Expectations</span>
                <span>Exceptional</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setScoreModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleScore}>
                <Award size={14} /> Submit Score
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
