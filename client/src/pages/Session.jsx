import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import api from '../lib/api.js';

const MODE_LABEL = { mcq: 'MCQ', essay: 'Essay', short_answer: 'Short Answer', mixed: 'Mixed' };

export default function Session({ user, theme, onThemeToggle, collapsed, onCollapse }) {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [session, setSession]   = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/sessions/${id}`),
      api.get('/sessions'),
    ]).then(([res, allRes]) => {
      setSession(res.data);
      setSessions(allRes.data);
    }).catch(err => {
      setError(err.response?.data?.error || 'Failed to load session.');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this session and all its questions?')) return;
    setDeleting(true);
    await api.delete(`/sessions/${id}`);
    navigate('/');
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });

  const sidebarProps = { user, sessions, theme, onThemeToggle, collapsed, onCollapse };

  if (loading) return (
    <div className="app-shell">
      <Sidebar {...sidebarProps} sessions={[]} />
      <main className="main-content" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <span className="spinner" style={{ width:36, height:36, borderWidth:3, margin:'0 auto 12px' }} />
          <p style={{ color:'var(--text-secondary)', fontSize:15 }}>Loading session…</p>
        </div>
      </main>
    </div>
  );

  if (error) return (
    <div className="app-shell">
      <Sidebar {...sidebarProps} />
      <main className="main-content">
        <div style={{ padding: 40 }}>
          <div className="error-msg">⚠️ {error}</div>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>← Dashboard</button>
        </div>
      </main>
    </div>
  );

  const questions = session?.questions || [];
  const mcqCount  = questions.filter(q => q.type === 'mcq').length;
  const openCount = questions.length - mcqCount;

  return (
    <div className="app-shell">
      <Sidebar {...sidebarProps} />

      <main className="main-content">
        <div className="session-shell">

          {/* ════ LEFT: scrollable question list ════ */}
          <div className="session-left">

            {/* Top nav */}
            <div className="session-topbar">
              <button className="session-back-btn" onClick={() => navigate('/')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Dashboard
              </button>
              <button className="session-delete-btn" onClick={handleDelete} disabled={deleting}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>

            {/* Question list */}
            {questions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No questions found</h3>
                <p>Something may have gone wrong during generation.</p>
              </div>
            ) : (
              <div className="qc-list">
                {questions.map((q, i) => (
                  <QuestionCard key={q.id} question={q} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* ════ RIGHT: sticky info panel ════ */}
          <aside className="session-right">
            <div className="session-info-panel">

              <span className="session-mode-pill">{MODE_LABEL[session.mode] || session.mode}</span>
              <h2 className="session-panel-title">{session.course_name}</h2>
              <p className="session-panel-date">{fmtDate(session.created_at)}</p>

              <div className="session-divider" />

              {/* Stats */}
              <div className="session-stats-grid">
                <div className="session-stat">
                  <span className="session-stat-num">{questions.length}</span>
                  <span className="session-stat-label">Total</span>
                </div>
                {mcqCount > 0 && (
                  <div className="session-stat">
                    <span className="session-stat-num">{mcqCount}</span>
                    <span className="session-stat-label">MCQ</span>
                  </div>
                )}
                {openCount > 0 && (
                  <div className="session-stat">
                    <span className="session-stat-num">{openCount}</span>
                    <span className="session-stat-label">Open</span>
                  </div>
                )}
              </div>

              <div className="session-divider" />

              {/* How to use */}
              <div className="session-how">
                <div className="session-how-title">How to use</div>
                {(session.mode === 'mcq' || session.mode === 'mixed') ? (
                  <ul className="session-how-list">
                    <li>Select an answer to check your knowledge</li>
                    <li><span className="tip-green">Green</span> = correct answer</li>
                    <li><span className="tip-red">Red</span> = wrong — correct is revealed</li>
                    <li>Explanation shown after each attempt</li>
                  </ul>
                ) : (
                  <ul className="session-how-list">
                    <li>Read each question carefully</li>
                    <li>Formulate your own answer first</li>
                    <li>Click <em>"Show model answer"</em> to compare</li>
                  </ul>
                )}
              </div>

              <div className="session-divider" />

              {/* Legend for MCQ */}
              {(session.mode === 'mcq' || session.mode === 'mixed') && (
                <div className="session-legend">
                  <div className="session-legend-row">
                    <span className="legend-dot legend-dot--green" />
                    <span>Correct answer</span>
                  </div>
                  <div className="session-legend-row">
                    <span className="legend-dot legend-dot--red" />
                    <span>Wrong selection</span>
                  </div>
                  <div className="session-legend-row">
                    <span className="legend-dot legend-dot--dim" />
                    <span>Unselected option</span>
                  </div>
                </div>
              )}

            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
