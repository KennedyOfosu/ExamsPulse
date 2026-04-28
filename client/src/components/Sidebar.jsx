import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import logo from '../assets/logo.png';

/* ── Icon components ── */
const IconNew       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSession   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconSun       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IconMoon      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const IconSignOut   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

/* Panel-toggle icon — same style as Arena AI's sidebar toggle */
const IconPanel = ({ collapsed }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    {collapsed
      ? <line x1="9" y1="3" x2="9" y2="21"/>
      : <line x1="9" y1="3" x2="9" y2="21"/>
    }
    {collapsed
      ? <polyline points="13 9 16 12 13 15"/>
      : <polyline points="13 15 10 12 13 9"/>
    }
  </svg>
);

export default function Sidebar({ user, sessions = [], collapsed, onCollapse, theme, onThemeToggle }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const letter    = user?.email?.[0]?.toUpperCase() || '?';
  const name      = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const signOut   = async () => { await supabase.auth.signOut(); navigate('/login'); };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>

      {/* ── Top: logo + panel toggle ── */}
      <div className={`sidebar-top ${collapsed ? 'sidebar-top--collapsed' : 'sidebar-top--expanded'}`}>
        {!collapsed && (
          <div className="sidebar-logo">
            <img src={logo} alt="Cerebra" className="sidebar-logo-img" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          </div>
        )}
        <button
          className="sidebar-panel-btn"
          onClick={onCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <IconPanel collapsed={collapsed} />
        </button>
      </div>

      {/* ── New Session ── */}
      <div className="sidebar-nav">
        <a
          className="sidebar-nav-item"
          href="/"
          title="New Session"
        >
          <span className="sb-icon"><IconNew /></span>
          {!collapsed && <span className="sb-label">New Session</span>}
        </a>

        {/* ── Recent Sessions ── */}
        {sessions.length > 0 && (
          <>
            {!collapsed && <div className="sidebar-section-title">Recent</div>}
            {sessions.slice(0, 8).map(s => (
              <a
                key={s.id}
                href={`/session/${s.id}`}
                className={`sidebar-nav-item ${location.pathname === `/session/${s.id}` ? 'active' : ''}`}
                title={s.course_name}
              >
                <span className="sb-icon"><IconSession /></span>
                {!collapsed && (
                  <>
                    <span className="sb-label">{s.course_name}</span>
                    <span className="sb-meta">
                      {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </>
                )}
              </a>
            ))}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <button
          className="sidebar-footer-btn"
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          <span className="sb-icon">{theme === 'dark' ? <IconSun /> : <IconMoon />}</span>
          {!collapsed && <span className="sb-label">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        <div className="sidebar-user" title={`${name} · ${user?.email}`}>
          <div className="sidebar-avatar">{letter}</div>
          {!collapsed && (
            <>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{name}</div>
                <div className="sidebar-user-email">{user?.email}</div>
              </div>
              <button className="sidebar-signout-btn" onClick={signOut} title="Sign out">
                <IconSignOut />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
