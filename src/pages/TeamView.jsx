import { useMemo, useState } from 'react';
import { Users, Target, TrendingUp, Award, MessageSquare, ChevronDown, ChevronUp, Send } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import useAuthStore from '../stores/authStore';
import useGoalStore from '../stores/goalStore';
import useNotificationStore from '../stores/notificationStore';
import { CURRENT_QUARTER, CURRENT_YEAR, GOAL_STATUS, ROLES, UOM_LABELS, STATUS_LABELS } from '../utils/constants';
import { getInitials, getAvatarColor, getProgressColor, formatDate, truncate } from '../utils/helpers';
import './TeamView.css';

export default function TeamView() {
  const { currentUser, getTeamMembers, getUserById, users } = useAuthStore();
  const goalStore = useGoalStore();
  const { addToast, logAction } = useNotificationStore();

  const [expandedMember, setExpandedMember] = useState(null);
  const [managerComment, setManagerComment] = useState('');
  const [commentGoalId, setCommentGoalId] = useState(null);

  const teamMembers = getTeamMembers().filter(u => u.id !== currentUser?.id || currentUser?.role === ROLES.ADMIN);

  const teamData = useMemo(() => {
    return teamMembers.map(member => {
      const goals = goalStore.getGoalsByUser(member.id, CURRENT_QUARTER, CURRENT_YEAR);
      const avgProgress = goalStore.getAverageProgress(goals);
      const completionRate = goalStore.getCompletionRate(goals);
      const avgScore = goalStore.getAverageScore(goals);
      return {
        ...member,
        goals,
        goalCount: goals.length,
        avgProgress,
        completionRate,
        avgScore,
      };
    });
  }, [teamMembers, goalStore.goals]);

  const barData = teamData.map(m => ({
    name: m.name.split(' ')[0],
    progress: m.avgProgress,
    goals: m.goalCount,
  }));

  const handleAddManagerComment = (goalId) => {
    if (!managerComment.trim()) return;
    goalStore.addManagerComment(goalId, managerComment.trim(), currentUser.id);
    logAction({
      entityType: 'goal', entityId: goalId, action: 'manager_comment',
      userId: currentUser.id,
      changes: { after: { managerComment: managerComment.trim() } },
    });
    addToast({ type: 'success', title: 'Feedback Saved', message: 'Check-in comment added.' });
    setManagerComment('');
    setCommentGoalId(null);
  };

  return (
    <div className="team-page">
      <div className="team-header-section glass-card-static animate-fade-in">
        <div className="team-header-text">
          <h2>Team Performance</h2>
          <p>{CURRENT_QUARTER} {CURRENT_YEAR} · {teamMembers.length} members</p>
        </div>
      </div>

      {/* Team Progress Chart */}
      <div className="team-chart glass-card-static animate-fade-in-up">
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-4)', padding: '0 var(--space-2)' }}>
          Team Progress Overview
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '13px',
              }}
            />
            <Bar dataKey="progress" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} name="Avg Progress %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Team Members Grid */}
      <div className="team-grid stagger-children">
        {teamData.map(member => {
          const isExpanded = expandedMember === member.id;
          return (
            <div key={member.id} className="team-member-card glass-card">
              <div className="member-header" style={{ cursor: 'pointer' }} onClick={() => setExpandedMember(isExpanded ? null : member.id)}>
                <div
                  className="member-avatar"
                  style={{ background: getAvatarColor(member.name) }}
                >
                  {getInitials(member.name)}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-role">{member.department} · {member.role}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              <div className="member-stats">
                <div className="member-stat">
                  <Target size={14} />
                  <span>{member.goalCount} goals</span>
                </div>
                <div className="member-stat">
                  <TrendingUp size={14} />
                  <span style={{ color: getProgressColor(member.avgProgress) }}>
                    {member.avgProgress}% avg
                  </span>
                </div>
                {member.avgScore && (
                  <div className="member-stat">
                    <Award size={14} />
                    <span>{member.avgScore}/5</span>
                  </div>
                )}
              </div>

              <div className="member-goals-progress">
                <div className="progress-bar-container" style={{ height: '6px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${member.avgProgress}%`,
                      background: `linear-gradient(90deg, ${getProgressColor(member.avgProgress)}, ${getProgressColor(member.avgProgress)}cc)`,
                    }}
                  />
                </div>
              </div>

              {/* Collapsed goal list */}
              {!isExpanded && (
                <div className="member-goals-list">
                  {member.goals.slice(0, 3).map(goal => (
                    <div key={goal.id} className="member-goal-item">
                      <div className="member-goal-dot" style={{ background: getProgressColor(goal.progress) }} />
                      <span className="member-goal-title">{goal.title}</span>
                      <span className="member-goal-pct">{goal.progress}%</span>
                    </div>
                  ))}
                  {member.goalCount > 3 && (
                    <div className="member-goal-more">+{member.goalCount - 3} more</div>
                  )}
                </div>
              )}

              {/* ─── Expanded: Detailed Goal View with Check-in + Manager Comments ─── */}
              {isExpanded && (
                <div className="member-expanded-goals" style={{ marginTop: 'var(--space-3)' }}>
                  {member.goals.map(goal => (
                    <div key={goal.id} style={{
                      padding: 'var(--space-3)',
                      marginBottom: 'var(--space-2)',
                      background: 'var(--bg-glass)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-glass)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-2)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{goal.title}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span>{STATUS_LABELS[goal.status] || goal.status}</span>
                            <span>·</span>
                            <span>{goal.weightage}% weight</span>
                            <span>·</span>
                            <span>{UOM_LABELS[goal.uom] || 'N/A'}</span>
                            {goal.targetValue && <><span>·</span><span>Target: {goal.targetValue}</span></>}
                            {goal.actualValue != null && <><span>·</span><span style={{ color: 'var(--accent-info)' }}>Actual: {goal.actualValue}</span></>}
                          </div>
                        </div>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: getProgressColor(goal.progress) }}>
                          {goal.progress}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="progress-bar-container" style={{ height: '4px', marginBottom: 'var(--space-2)' }}>
                        <div className="progress-bar-fill" style={{ width: `${goal.progress}%`, background: getProgressColor(goal.progress) }} />
                      </div>

                      {/* Check-in History */}
                      {goal.checkIns?.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-2)' }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Check-in History ({goal.checkIns.length})
                          </div>
                          {goal.checkIns.slice(-3).map((ci, i) => (
                            <div key={ci.id || i} style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-muted)',
                              padding: '4px 0',
                              borderTop: i > 0 ? '1px solid var(--border-glass)' : 'none',
                              display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap',
                            }}>
                              <span>Actual: {ci.actualValue}</span>
                              <span>Status: {ci.status?.replace('_', ' ')}</span>
                              {ci.comments && <span>Note: {truncate(ci.comments, 40)}</span>}
                              {ci.submittedAt && <span>{formatDate(ci.submittedAt)}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Manager Comments on this goal */}
                      {goal.managerComments?.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-2)' }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                            <MessageSquare size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            Manager Feedback
                          </div>
                          {goal.managerComments.map((mc, i) => (
                            <div key={i} style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-secondary)',
                              padding: '4px 0 4px var(--space-3)',
                              borderLeft: '2px solid var(--accent-primary)',
                              marginBottom: '4px',
                            }}>
                              "{mc.comment}" — <span style={{ color: 'var(--text-muted)' }}>{formatDate(mc.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Manager Comment */}
                      {(currentUser?.role === ROLES.MANAGER || currentUser?.role === ROLES.ADMIN) && (
                        <div>
                          {commentGoalId === goal.id ? (
                            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
                              <textarea
                                className="input-field"
                                placeholder="Add structured check-in comment..."
                                value={managerComment}
                                onChange={e => setManagerComment(e.target.value)}
                                rows={2}
                                style={{ flex: 1, fontSize: 'var(--text-xs)', padding: 'var(--space-2)' }}
                                autoFocus
                              />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleAddManagerComment(goal.id)}
                                  disabled={!managerComment.trim()}
                                  style={{ fontSize: 'var(--text-xs)' }}
                                >
                                  <Send size={10} /> Save
                                </button>
                                <button
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => { setCommentGoalId(null); setManagerComment(''); }}
                                  style={{ fontSize: 'var(--text-xs)' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => setCommentGoalId(goal.id)}
                              style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)' }}
                            >
                              <MessageSquare size={12} /> Add Feedback
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
