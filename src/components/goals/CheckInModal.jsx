import { useState } from 'react';
import { X, TrendingUp, CheckCircle, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { UOM_TYPES, UOM_LABELS } from '../../utils/constants';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', icon: Clock, color: 'var(--text-muted)' },
  { value: 'on_track', label: 'On Track', icon: TrendingUp, color: 'var(--accent-success)' },
  { value: 'at_risk', label: 'At Risk', icon: AlertTriangle, color: 'var(--accent-warning)' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'var(--accent-info)' },
];

export default function CheckInModal({ goal, onSubmit, onClose }) {
  const [form, setForm] = useState({
    actualValue: goal?.actualValue || '',
    status: 'on_track',
    comments: '',
    managerComments: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.actualValue === '' && goal?.uom !== UOM_TYPES.TIMELINE) return;
    onSubmit({
      ...form,
      actualValue: goal?.uom === UOM_TYPES.TIMELINE ? form.actualValue : parseFloat(form.actualValue),
    });
  };

  const getTargetLabel = () => {
    switch (goal?.uom) {
      case UOM_TYPES.MIN_NUMERIC: return `Target: ${goal?.targetValue} (higher is better)`;
      case UOM_TYPES.MIN_PERCENTAGE: return `Target: ${goal?.targetValue}% (higher is better)`;
      case UOM_TYPES.MAX_NUMERIC: return `Target: ${goal?.targetValue} (lower is better)`;
      case UOM_TYPES.MAX_PERCENTAGE: return `Target: ${goal?.targetValue}% (lower is better)`;
      case UOM_TYPES.TIMELINE: return `Deadline: ${goal?.targetValue}`;
      case UOM_TYPES.ZERO_BASED: return 'Target: Zero incidents';
      default: return `Target: ${goal?.targetValue}`;
    }
  };

  const getInputConfig = () => {
    switch (goal?.uom) {
      case UOM_TYPES.TIMELINE:
        return { type: 'date', placeholder: 'Completion date', step: undefined };
      case UOM_TYPES.ZERO_BASED:
        return { type: 'number', placeholder: 'Enter count (0 = success)', step: '1' };
      case UOM_TYPES.MIN_PERCENTAGE:
      case UOM_TYPES.MAX_PERCENTAGE:
        return { type: 'number', placeholder: 'Enter actual %', step: '0.1' };
      default:
        return { type: 'number', placeholder: 'Enter actual value achieved', step: 'any' };
    }
  };

  const inputConfig = getInputConfig();

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-label="Log Check-In" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <BarChart3 size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="modal-title">Quarterly Check-In</h2>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Goal Context */}
          <div className="checkin-context" style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-glass)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-glass)',
            marginBottom: 'var(--space-4)',
          }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
              {goal?.title}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span>📊 {UOM_LABELS[goal?.uom] || 'Percentage'}</span>
              <span>🎯 {getTargetLabel()}</span>
              <span>⚡ Current: {goal?.progress || 0}%</span>
            </div>
          </div>

          {/* Actual Achievement */}
          <div className="input-group">
            <label className="input-label" htmlFor="checkin-actual">
              Actual Achievement <span className="required">*</span>
            </label>
            <input
              id="checkin-actual"
              type={inputConfig.type}
              className="input-field"
              placeholder={inputConfig.placeholder}
              value={form.actualValue}
              onChange={e => setForm(prev => ({ ...prev, actualValue: e.target.value }))}
              step={inputConfig.step}
              autoFocus
              required
            />
            <span className="input-hint">{getTargetLabel()}</span>
          </div>

          {/* Status Selection */}
          <div className="input-group">
            <label className="input-label">Status</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-2)',
            }}>
              {STATUS_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = form.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, status: opt.value }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-glass)',
                      background: isSelected ? `${opt.color}12` : 'transparent',
                      color: isSelected ? opt.color : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-sm)',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comments */}
          <div className="input-group">
            <label className="input-label" htmlFor="checkin-comments">
              Comments / Notes
            </label>
            <textarea
              id="checkin-comments"
              className="input-field"
              placeholder="What progress have you made? Any blockers or achievements to highlight..."
              value={form.comments}
              onChange={e => setForm(prev => ({ ...prev, comments: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="modal-footer" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <TrendingUp size={14} /> Submit Check-In
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
