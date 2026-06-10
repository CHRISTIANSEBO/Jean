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
  onClose: () => void;
}

function formatDate(ts: number): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/admin/users')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load users');
        return r.json();
      })
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-view">
      <div className="admin-view-hdr">
        <span className="inbox-view-label">Admin · Connected users</span>
        {!loading && !error && (
          <span className="inbox-view-count">
            {users.length > 0 ? `${users.length} users` : 'None yet'}
          </span>
        )}
        <button type="button" className="admin-back-btn" onClick={onClose}>
          Back to inbox
        </button>
      </div>

      {loading && <div className="inbox-view-empty">Loading…</div>}
      {error && <div className="inbox-view-empty admin-error">{error}</div>}
      {!loading && !error && users.length === 0 && (
        <div className="inbox-view-empty">No connected users yet.</div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="admin-list">
          {users.map(u => (
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
      )}
    </div>
  );
}
