import { useEffect, useState } from 'react';
import './AdminPanel.css';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  created_at: number;
  last_login: number;
}

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

function formatDate(ts: number): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}

export default function AdminPanel({ open, onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch('/admin/users')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load users');
        return r.json();
      })
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>
        <div className="admin-header">
          <span className="admin-title">Connected users</span>
          <button type="button" className="admin-close" onClick={onClose}>×</button>
        </div>

        <div className="admin-body">
          {loading && <div className="admin-empty">Loading…</div>}
          {error && <div className="admin-empty admin-error">{error}</div>}
          {!loading && !error && users.length === 0 && (
            <div className="admin-empty">No connected users yet.</div>
          )}
          {!loading && !error && users.map(u => (
            <div key={u.id} className="admin-row">
              <div className="admin-avatar-wrap">
                {u.picture ? (
                  <img src={u.picture} alt={u.name} className="admin-avatar-img" referrerPolicy="no-referrer" />
                ) : (
                  <span className="admin-avatar-initials">{(u.name || u.email)[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="admin-row-info">
                <span className="admin-row-name">{u.name || 'Unnamed'}</span>
                <span className="admin-row-email">{u.email}</span>
              </div>
              <div className="admin-row-meta">
                <span>Joined {formatDate(u.created_at)}</span>
                <span>Last login {formatDate(u.last_login)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
