import { create } from 'zustand';
import { SEED_GOALS } from '../data/seedData';
import { storage, generateId } from '../utils/helpers';
import { GOAL_STATUS, CURRENT_QUARTER, CURRENT_YEAR, UOM_TYPES } from '../utils/constants';

/**
 * Compute progress % from actual achievement vs target based on UoM type.
 * BRD formulas:
 *   Numeric (Min): (achievement / target) * 100
 *   Percentage (Max): (target / achievement) * 100  — capped at 100
 *   Timeline: date-based comparison
 *   Zero-based: 0 → 100%, anything else → 0%
 */
const computeProgress = (uom, targetValue, actualValue) => {
  if (targetValue == null || actualValue == null) return 0;
  const target = parseFloat(targetValue);
  const actual = parseFloat(actualValue);

  switch (uom) {
    case UOM_TYPES.MIN_NUMERIC:
    case UOM_TYPES.MIN_PERCENTAGE:
      // Min-type: higher achievement = better (Achievement ÷ Target)
      if (target === 0) return actual >= 0 ? 100 : 0;
      return Math.max(0, Math.min(Math.round((actual / target) * 100), 100));

    case UOM_TYPES.MAX_NUMERIC:
    case UOM_TYPES.MAX_PERCENTAGE:
      // Max-type: lower achievement = better (Target ÷ Achievement)
      if (actual === 0) return 100;
      if (target === 0) return actual === 0 ? 100 : 0;
      return Math.max(0, Math.min(Math.round((target / actual) * 100), 100));

    case UOM_TYPES.TIMELINE: {
      // If completed before or on deadline → 100%, otherwise proportional
      const deadline = new Date(targetValue).getTime();
      const completed = new Date(actualValue).getTime();
      if (completed <= deadline) return 100;
      // Overdue — degrade by days overdue
      const overdueDays = (completed - deadline) / (1000 * 60 * 60 * 24);
      return Math.max(0, Math.round(100 - overdueDays * 5));
    }

    case UOM_TYPES.ZERO_BASED:
      // Zero-based: if actual is 0, score is 100%, otherwise 0%
      return actual === 0 ? 100 : 0;

    default:
      return Math.max(0, Math.min(Math.round((actual / (target || 1)) * 100), 100));
  }
};

const useGoalStore = create((set, get) => ({
  goals: storage.get('goals', SEED_GOALS),

  _persist: () => storage.set('goals', get().goals),

  // CRUD
  createGoal: (goalData) => {
    const goal = {
      ...goalData,
      id: generateId(),
      status: GOAL_STATUS.DRAFT,
      progress: 0,
      score: null,
      isLocked: false,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      milestones: goalData.milestones || [],
      checkIns: [],
      uom: goalData.uom || UOM_TYPES.PERCENTAGE,
      targetValue: goalData.targetValue || 100,
      actualValue: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(state => {
      const goals = [...state.goals, goal];
      storage.set('goals', goals);
      return { goals };
    });
    return goal;
  },

  updateGoal: (goalId, updates) => {
    set(state => {
      const goals = state.goals.map(g =>
        g.id === goalId ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
      );
      storage.set('goals', goals);
      return { goals };
    });
  },

  deleteGoal: (goalId) => {
    set(state => {
      const goals = state.goals.filter(g => g.id !== goalId);
      storage.set('goals', goals);
      return { goals };
    });
  },

  // Workflow
  submitForApproval: (goalId) => {
    get().updateGoal(goalId, { status: GOAL_STATUS.PENDING_APPROVAL });
  },

  approveGoal: (goalId, managerId) => {
    get().updateGoal(goalId, {
      status: GOAL_STATUS.APPROVED,
      isLocked: true,
      approvedBy: managerId,
      approvedAt: new Date().toISOString(),
      rejectionReason: null,
    });
  },

  rejectGoal: (goalId, managerId, reason) => {
    get().updateGoal(goalId, {
      status: GOAL_STATUS.REJECTED,
      isLocked: false,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: reason,
    });
  },

  startProgress: (goalId) => {
    get().updateGoal(goalId, { status: GOAL_STATUS.IN_PROGRESS });
  },

  updateProgress: (goalId, progress) => {
    const goal = get().goals.find(g => g.id === goalId);
    const updates = { progress };
    if (progress >= 100) {
      updates.status = GOAL_STATUS.COMPLETED;
      updates.progress = 100;
    } else if (goal?.status === GOAL_STATUS.APPROVED) {
      updates.status = GOAL_STATUS.IN_PROGRESS;
    }
    get().updateGoal(goalId, updates);
  },

  // --- Check-In System ---
  addCheckIn: (goalId, checkInData) => {
    const goal = get().goals.find(g => g.id === goalId);
    if (!goal) return null;

    const checkIn = {
      id: generateId(),
      goalId,
      actualValue: checkInData.actualValue,
      status: checkInData.status || 'on_track', // not_started | on_track | at_risk | completed
      comments: checkInData.comments || '',
      managerComments: checkInData.managerComments || '',
      submittedBy: checkInData.submittedBy,
      submittedAt: new Date().toISOString(),
      quarter: checkInData.quarter || CURRENT_QUARTER,
    };

    // Auto-compute progress based on UoM formula
    const computedProgress = computeProgress(
      goal.uom || UOM_TYPES.PERCENTAGE,
      goal.targetValue,
      checkInData.actualValue
    );

    const updatedCheckIns = [...(goal.checkIns || []), checkIn];

    const updates = {
      checkIns: updatedCheckIns,
      actualValue: checkInData.actualValue,
      progress: computedProgress,
    };

    // Auto-transition status
    if (computedProgress >= 100 || checkInData.status === 'completed') {
      updates.status = GOAL_STATUS.COMPLETED;
      updates.progress = 100;
    } else if (goal.status === GOAL_STATUS.APPROVED && computedProgress > 0) {
      updates.status = GOAL_STATUS.IN_PROGRESS;
    }

    get().updateGoal(goalId, updates);

    // ─── Parent → Child sync: cascade progress to all linked child goals ───
    if (goal.childGoalIds?.length > 0) {
      goal.childGoalIds.forEach(childId => {
        get().updateGoal(childId, {
          actualValue: checkInData.actualValue,
          progress: computedProgress,
          status: updates.status || goal.status,
        });
      });
    }

    return checkIn;
  },

  getCheckIns: (goalId) => {
    const goal = get().goals.find(g => g.id === goalId);
    return goal?.checkIns || [];
  },

  scoreGoal: (goalId, score) => {
    get().updateGoal(goalId, { score });
  },

  // Queries
  getGoalById: (goalId) => get().goals.find(g => g.id === goalId),

  getGoalsByUser: (userId, quarter = null, year = null) => {
    return get().goals.filter(g => {
      const ownerMatch = g.ownerId === userId;
      const sharedMatch = g.sharedWith?.includes(userId);
      const quarterMatch = quarter ? g.quarter === quarter : true;
      const yearMatch = year ? g.year === year : true;
      return (ownerMatch || sharedMatch) && quarterMatch && yearMatch;
    });
  },

  getGoalsByDepartment: (department, users) => {
    const deptUserIds = users.filter(u => u.department === department).map(u => u.id);
    return get().goals.filter(g => deptUserIds.includes(g.ownerId));
  },

  getPendingApprovals: (managerId, users) => {
    const teamIds = users.filter(u => u.managerId === managerId).map(u => u.id);
    return get().goals.filter(g =>
      g.status === GOAL_STATUS.PENDING_APPROVAL && teamIds.includes(g.ownerId)
    );
  },

  getAllPendingApprovals: () => {
    return get().goals.filter(g => g.status === GOAL_STATUS.PENDING_APPROVAL);
  },

  getCurrentQuarterGoals: (userId) => {
    return get().getGoalsByUser(userId, CURRENT_QUARTER, CURRENT_YEAR);
  },

  // Analytics
  getCompletionRate: (goals) => {
    if (!goals.length) return 0;
    const completed = goals.filter(g => g.status === GOAL_STATUS.COMPLETED).length;
    return Math.round((completed / goals.length) * 100);
  },

  getAverageProgress: (goals) => {
    if (!goals.length) return 0;
    const total = goals.reduce((sum, g) => sum + (g.progress || 0), 0);
    return Math.round(total / goals.length);
  },

  getAverageScore: (goals) => {
    const scored = goals.filter(g => g.score != null);
    if (!scored.length) return null;
    const total = scored.reduce((sum, g) => sum + g.score, 0);
    return +(total / scored.length).toFixed(1);
  },

  getStatusDistribution: (goals) => {
    const dist = {};
    goals.forEach(g => {
      dist[g.status] = (dist[g.status] || 0) + 1;
    });
    return dist;
  },

  getCategoryDistribution: (goals) => {
    const dist = {};
    goals.forEach(g => {
      dist[g.category] = (dist[g.category] || 0) + 1;
    });
    return dist;
  },

  // ─── Shared Goals: Push a departmental KPI to multiple employees ───
  pushDepartmentalKPI: (kpiData, employeeIds) => {
    const parentGoal = {
      ...kpiData,
      id: generateId(),
      status: GOAL_STATUS.APPROVED,
      isLocked: true,
      progress: 0,
      score: null,
      approvedBy: kpiData.pushedBy || null,
      approvedAt: new Date().toISOString(),
      rejectionReason: null,
      milestones: [],
      checkIns: [],
      managerComments: [],
      uom: kpiData.uom || UOM_TYPES.PERCENTAGE,
      targetValue: kpiData.targetValue || 100,
      actualValue: null,
      type: 'departmental',
      childGoalIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const childGoals = employeeIds.map(empId => {
      const childId = generateId();
      parentGoal.childGoalIds.push(childId);
      return {
        ...parentGoal,
        id: childId,
        ownerId: empId,
        parentGoalId: parentGoal.id,
        type: 'shared',
        childGoalIds: undefined,
        // Children start as approved so employees can check-in immediately
        weightage: kpiData.weightage || 10,
      };
    });

    set(state => {
      const goals = [...state.goals, parentGoal, ...childGoals];
      storage.set('goals', goals);
      return { goals };
    });

    return { parentGoal, childGoals };
  },

  // ─── Manager structured check-in comment ───
  addManagerComment: (goalId, comment, managerId) => {
    const goal = get().goals.find(g => g.id === goalId);
    if (!goal) return;
    const entry = {
      comment,
      managerId,
      timestamp: new Date().toISOString(),
    };
    const comments = [...(goal.managerComments || []), entry];
    get().updateGoal(goalId, { managerComments: comments });
  },

  // ─── Escalation Module ───
  checkEscalations: (addNotification) => {
    const now = Date.now();
    // HR configured buffer: 7 days
    const ESCALATION_BUFFER_MS = 7 * 24 * 60 * 60 * 1000;
    
    let updatedCount = 0;
    const newGoals = get().goals.map(g => {
      if (g.status === GOAL_STATUS.PENDING_APPROVAL && !g.isEscalated) {
        if (now - new Date(g.updatedAt).getTime() > ESCALATION_BUFFER_MS) {
          updatedCount++;
          // Notify the admin or the user's manager if addNotification is provided
          if (addNotification) {
            addNotification({
              userId: g.ownerId, // For demo purposes, just log to the owner
              type: 'escalation',
              title: 'Goal Escalated',
              message: `Your goal "${g.title}" has been escalated due to pending approval > 7 days.`,
              relatedEntityId: g.id,
            });
          }
          return { ...g, isEscalated: true, escalatedAt: new Date().toISOString() };
        }
      }
      return g;
    });

    if (updatedCount > 0) {
      set({ goals: newGoals });
      storage.set('goals', newGoals);
    }
    return updatedCount;
  },

  resetToSeed: () => {
    storage.set('goals', SEED_GOALS);
    set({ goals: SEED_GOALS });
  },
}));

export default useGoalStore;
