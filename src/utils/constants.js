export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

export const GOAL_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
};

export const GOAL_TYPES = {
  INDIVIDUAL: 'individual',
  SHARED: 'shared',
  DEPARTMENTAL: 'departmental',
};

export const UOM_TYPES = {
  MIN_NUMERIC: 'min_numeric',
  MIN_PERCENTAGE: 'min_percentage',
  MAX_NUMERIC: 'max_numeric',
  MAX_PERCENTAGE: 'max_percentage',
  TIMELINE: 'timeline',
  ZERO_BASED: 'zero_based',
};

export const UOM_LABELS = {
  [UOM_TYPES.MIN_NUMERIC]: 'Min (Numeric) — Higher is better',
  [UOM_TYPES.MIN_PERCENTAGE]: 'Min (%) — Higher is better',
  [UOM_TYPES.MAX_NUMERIC]: 'Max (Numeric) — Lower is better',
  [UOM_TYPES.MAX_PERCENTAGE]: 'Max (%) — Lower is better',
  [UOM_TYPES.TIMELINE]: 'Timeline (Date)',
  [UOM_TYPES.ZERO_BASED]: 'Zero-based (Yes/No)',
};

export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
export const CURRENT_YEAR = 2026;
export const CURRENT_QUARTER = 'Q2';

export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
];

export const GOAL_CATEGORIES = [
  'Performance',
  'Learning & Development',
  'Innovation',
  'Collaboration',
  'Leadership',
  'Customer Success',
  'Revenue',
  'Process Improvement',
];

export const VALIDATION = {
  TOTAL_WEIGHTAGE: 100,
  MIN_WEIGHTAGE: 10,
  MAX_WEIGHTAGE: 100,
  MAX_GOALS: 8,
  MIN_TITLE_LENGTH: 5,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 500,
  SCORE_MIN: 0,
  SCORE_MAX: 5,
  PROGRESS_MIN: 0,
  PROGRESS_MAX: 100,
  LOCKED_STATUSES: [GOAL_STATUS.APPROVED, GOAL_STATUS.IN_PROGRESS, GOAL_STATUS.COMPLETED],
};

export const STATUS_LABELS = {
  [GOAL_STATUS.DRAFT]: 'Draft',
  [GOAL_STATUS.PENDING_APPROVAL]: 'Pending Approval',
  [GOAL_STATUS.APPROVED]: 'Approved',
  [GOAL_STATUS.IN_PROGRESS]: 'In Progress',
  [GOAL_STATUS.COMPLETED]: 'Completed',
  [GOAL_STATUS.REJECTED]: 'Rejected',
};

export const STATUS_COLORS = {
  [GOAL_STATUS.DRAFT]: 'ghost',
  [GOAL_STATUS.PENDING_APPROVAL]: 'warning',
  [GOAL_STATUS.APPROVED]: 'info',
  [GOAL_STATUS.IN_PROGRESS]: 'primary',
  [GOAL_STATUS.COMPLETED]: 'success',
  [GOAL_STATUS.REJECTED]: 'danger',
};

export const NOTIFICATION_TYPES = {
  APPROVAL_REQUESTED: 'approval_requested',
  GOAL_APPROVED: 'goal_approved',
  GOAL_REJECTED: 'goal_rejected',
  DEADLINE_WARNING: 'deadline_warning',
  ESCALATION: 'escalation',
  PROGRESS_REMINDER: 'progress_reminder',
};
