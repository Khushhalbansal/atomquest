import useNotificationStore from '../../stores/notificationStore';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className="toast-container" role="alert" aria-live="polite">
      {toasts.map(toast => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <Icon size={18} />
            <div style={{ flex: 1 }}>
              {toast.title && <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{toast.title}</div>}
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ color: 'var(--text-muted)', padding: '4px' }}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
