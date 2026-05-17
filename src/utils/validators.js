import { VALIDATION, GOAL_STATUS } from './constants';

export const validateGoal = (goal, existingGoals = []) => {
  const errors = {};

  // Title
  if (!goal.title || goal.title.trim().length < VALIDATION.MIN_TITLE_LENGTH) {
    errors.title = `Title must be at least ${VALIDATION.MIN_TITLE_LENGTH} characters`;
  } else if (goal.title.length > VALIDATION.MAX_TITLE_LENGTH) {
    errors.title = `Title must be under ${VALIDATION.MAX_TITLE_LENGTH} characters`;
  }

  // Description
  if (!goal.description || goal.description.trim().length < VALIDATION.MIN_DESCRIPTION_LENGTH) {
    errors.description = `Description must be at least ${VALIDATION.MIN_DESCRIPTION_LENGTH} characters`;
  } else if (goal.description.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be under ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`;
  }

  // Weightage
  if (!goal.weightage || goal.weightage < VALIDATION.MIN_WEIGHTAGE) {
    errors.weightage = `Minimum weightage is ${VALIDATION.MIN_WEIGHTAGE}%`;
  } else if (goal.weightage > VALIDATION.MAX_WEIGHTAGE) {
    errors.weightage = `Maximum weightage is ${VALIDATION.MAX_WEIGHTAGE}%`;
  }

  // Total weightage check
  const otherGoals = existingGoals.filter(g => g.id !== goal.id);
  const currentTotal = otherGoals.reduce((sum, g) => sum + (g.weightage || 0), 0);
  if (currentTotal + (goal.weightage || 0) > VALIDATION.TOTAL_WEIGHTAGE) {
    errors.weightage = `Total weightage would exceed ${VALIDATION.TOTAL_WEIGHTAGE}%. Available: ${VALIDATION.TOTAL_WEIGHTAGE - currentTotal}%`;
  }

  // Max goals check
  if (!goal.id && existingGoals.length >= VALIDATION.MAX_GOALS) {
    errors.maxGoals = `Maximum of ${VALIDATION.MAX_GOALS} goals allowed`;
  }

  // Due date
  if (!goal.dueDate) {
    errors.dueDate = 'Due date is required';
  }

  // Category
  if (!goal.category) {
    errors.category = 'Category is required';
  }

  // Quarter
  if (!goal.quarter) {
    errors.quarter = 'Quarter is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const canEditGoal = (goal, userId, userRole) => {
  if (VALIDATION.LOCKED_STATUSES.includes(goal.status)) {
    if (userRole !== 'admin') return false;
  }
  if (goal.ownerId !== userId && userRole === 'employee') return false;
  return true;
};

export const canDeleteGoal = (goal, userId, userRole) => {
  if (goal.status !== GOAL_STATUS.DRAFT && goal.status !== GOAL_STATUS.REJECTED) {
    return userRole === 'admin';
  }
  return goal.ownerId === userId || userRole === 'admin';
};

export const canSubmitForApproval = (goal) => {
  return goal.status === GOAL_STATUS.DRAFT || goal.status === GOAL_STATUS.REJECTED;
};

/**
 * BRD 2.1 — Total weightage across ALL goals must equal exactly 100% before
 * any individual goal can be submitted for approval.
 * Returns { canSubmit: boolean, reason: string | null }
 */
export const canSubmitGoalSheet = (allUserGoals) => {
  const total = allUserGoals.reduce((sum, g) => sum + (g.weightage || 0), 0);
  if (total < VALIDATION.TOTAL_WEIGHTAGE) {
    return {
      canSubmit: false,
      reason: `Total weightage is ${total}%. It must equal exactly ${VALIDATION.TOTAL_WEIGHTAGE}% before submission. Add ${VALIDATION.TOTAL_WEIGHTAGE - total}% more.`,
    };
  }
  if (total > VALIDATION.TOTAL_WEIGHTAGE) {
    return {
      canSubmit: false,
      reason: `Total weightage is ${total}% which exceeds ${VALIDATION.TOTAL_WEIGHTAGE}%. Please adjust your goals.`,
    };
  }
  return { canSubmit: true, reason: null };
};

export const canApproveGoal = (userRole) => {
  return userRole === 'manager' || userRole === 'admin';
};

export const getRemainingWeightage = (goals, excludeGoalId = null, ownerId = null) => {
  const total = goals
    .filter(g => g.id !== excludeGoalId && (!ownerId || g.ownerId === ownerId))
    .reduce((sum, g) => sum + (g.weightage || 0), 0);
  return VALIDATION.TOTAL_WEIGHTAGE - total;
};

export const getWeightageUsed = (goals, ownerId = null) => {
  return goals
    .filter(g => !ownerId || g.ownerId === ownerId)
    .reduce((sum, g) => sum + (g.weightage || 0), 0);
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};
