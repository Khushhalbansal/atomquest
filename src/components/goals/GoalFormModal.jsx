import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { GOAL_CATEGORIES, GOAL_TYPES, VALIDATION, CURRENT_QUARTER, UOM_TYPES, UOM_LABELS } from '../../utils/constants';
import { validateGoal, getRemainingWeightage } from '../../utils/validators';
import AISuggestions from './AISuggestions';

export default function GoalFormModal({ goal, existingGoals, onSave, onClose }) {
  const isEditing = !!goal;
  // BRD: Pushed/shared KPI recipients can only adjust weightage
  const isPushedGoal = !!(goal?.parentGoalId);

  const [form, setForm] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    weightage: goal?.weightage || VALIDATION.MIN_WEIGHTAGE,
    category: goal?.category || '',
    type: goal?.type || GOAL_TYPES.INDIVIDUAL,
    uom: goal?.uom || UOM_TYPES.MIN_PERCENTAGE,
    targetValue: goal?.targetValue || 100,
    dueDate: goal?.dueDate ? goal.dueDate.split('T')[0] : '',
  });

  const [errors, setErrors] = useState({});
  const remaining = getRemainingWeightage(existingGoals, goal?.id);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const goalData = {
      ...form,
      weightage: parseInt(form.weightage),
      targetValue: parseFloat(form.targetValue),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    };

    const validation = validateGoal(goalData, existingGoals);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(goalData);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-label={isEditing ? 'Edit Goal' : 'Create Goal'} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? 'Edit Goal' : 'Create New Goal'}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Pushed KPI notice */}
          {isPushedGoal && (
            <div style={{
              padding: 'var(--space-3)',
              background: 'var(--accent-info-dim, rgba(59,130,246,0.1))',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-info)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-info)',
              marginBottom: 'var(--space-3)',
            }}>
              🔗 This is a shared departmental KPI. Only <strong>Weightage</strong> and <strong>Due Date</strong> can be edited.
            </div>
          )}
          {/* Title */}
          <div className="input-group">
            <label className="input-label" htmlFor="goal-title">
              Title <span className="required">*</span>
            </label>
            <input
              id="goal-title"
              type="text"
              className={`input-field ${errors.title ? 'error' : ''}`}
              placeholder="e.g., Improve API response time by 40%"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              maxLength={VALIDATION.MAX_TITLE_LENGTH}
              autoFocus
              disabled={isPushedGoal}
              style={isPushedGoal ? { opacity: 0.6 } : {}}
            />
            {errors.title && <span className="input-error">{errors.title}</span>}
            <span className="input-hint">{form.title.length}/{VALIDATION.MAX_TITLE_LENGTH}</span>
          </div>

          {/* Description */}
          <div className="input-group">
            <label className="input-label" htmlFor="goal-desc">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="goal-desc"
              className={`input-field ${errors.description ? 'error' : ''}`}
              placeholder="Describe the goal, expected outcomes, and success criteria..."
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              maxLength={VALIDATION.MAX_DESCRIPTION_LENGTH}
              rows={4}
              disabled={isPushedGoal}
              style={isPushedGoal ? { opacity: 0.6 } : {}}
            />
            {errors.description && <span className="input-error">{errors.description}</span>}
            <span className="input-hint">{form.description.length}/{VALIDATION.MAX_DESCRIPTION_LENGTH}</span>
          </div>

          {/* Weightage & Category Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="goal-weight">
                Weightage (%) <span className="required">*</span>
              </label>
              <input
                id="goal-weight"
                type="number"
                className={`input-field ${errors.weightage ? 'error' : ''}`}
                value={form.weightage}
                onChange={e => handleChange('weightage', e.target.value)}
                min={VALIDATION.MIN_WEIGHTAGE}
                max={Math.max(VALIDATION.MIN_WEIGHTAGE, remaining + (goal?.weightage || 0))}
              />
              {errors.weightage && <span className="input-error">{errors.weightage}</span>}
              <span className="input-hint">Min {VALIDATION.MIN_WEIGHTAGE}% · {Math.max(0, remaining)}% available</span>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="goal-category">
                Category <span className="required">*</span>
              </label>
              <select
                id="goal-category"
                className={`input-field ${errors.category ? 'error' : ''}`}
                value={form.category}
                onChange={e => handleChange('category', e.target.value)}
              >
                <option value="">Select category</option>
                {GOAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="input-error">{errors.category}</span>}
            </div>
          </div>

          {/* Type & Due Date Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="goal-type">Type</label>
              <select
                id="goal-type"
                className="input-field"
                value={form.type}
                onChange={e => handleChange('type', e.target.value)}
                disabled={isPushedGoal}
                style={isPushedGoal ? { opacity: 0.6 } : {}}
              >
                <option value="individual">Individual</option>
                <option value="shared">Shared</option>
                <option value="departmental">Departmental</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="goal-uom">Unit of Measurement <span className="required">*</span></label>
              <select
                id="goal-uom"
                className="input-field"
                value={form.uom}
                onChange={e => handleChange('uom', e.target.value)}
                disabled={isPushedGoal}
                style={isPushedGoal ? { opacity: 0.6 } : {}}
              >
                {Object.values(UOM_TYPES).map(uom => (
                  <option key={uom} value={uom}>{UOM_LABELS[uom]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Target & Due Date Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="goal-target">
                Target Value <span className="required">*</span>
              </label>
              <input
                id="goal-target"
                type={form.uom === UOM_TYPES.TIMELINE ? 'date' : 'number'}
                className="input-field"
                value={form.targetValue}
                onChange={e => handleChange('targetValue', e.target.value)}
                min={form.uom === UOM_TYPES.ZERO_BASED ? 0 : undefined}
                max={form.uom === UOM_TYPES.ZERO_BASED ? 1 : undefined}
                step="any"
                disabled={isPushedGoal}
                style={isPushedGoal ? { opacity: 0.6 } : {}}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="goal-due">
                Due Date <span className="required">*</span>
              </label>
              <input
                id="goal-due"
                type="date"
                className={`input-field ${errors.dueDate ? 'error' : ''}`}
                value={form.dueDate}
                onChange={e => handleChange('dueDate', e.target.value)}
              />
              {errors.dueDate && <span className="input-error">{errors.dueDate}</span>}
            </div>
          </div>

          {/* AI Suggestions */}
          {!isEditing && (
            <AISuggestions
              category={form.category}
              onApply={(suggestion) => {
                setForm(prev => ({
                  ...prev,
                  title: suggestion.title,
                  description: suggestion.description,
                  weightage: Math.min(suggestion.weightage, remaining + (goal?.weightage || 0)),
                }));
              }}
            />
          )}

          {errors.maxGoals && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--accent-danger-dim)', borderRadius: 'var(--radius-md)', color: 'var(--accent-danger)', fontSize: 'var(--text-sm)' }}>
              {errors.maxGoals}
            </div>
          )}

          <div className="modal-footer" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
