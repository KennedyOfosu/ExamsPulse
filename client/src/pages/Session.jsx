import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { MCQCard, OpenCard } from '../components/QuestionCard.jsx';
import api from '../lib/api.js';

const MODE_LABEL = { mcq: 'MCQ', essay: 'Essay', short_answer: 'Short Answer', mixed: 'Mixed' };

/* ─────────────────────────────────────
   MCQ Quiz — show all, submit at end
───────────────────────────────────── */
function MCQQuiz({ questions }) {
  const mcqs = questions.filter(q => q.type === 'mcq');
  const [answers, setAnswers]   = useState({});   // { [id]: key }
  const [revealed, setRevealed] = useState(false);

  const allAnswered = mcqs.every(q => answers[q.id] !== undefined);

  const score = revealed
    ? mcqs.filter(q => answers[q.id] === q.answer).length
    : null;

  return (
    <div className="quiz-shell">
      <div className="qc-list">
        {mcqs.map((q, i) => (
          <MCQCard
            key={q.id}
            question={q.question}
            index={i}
            selected={answers[q.id] ?? null}
            revealed={revealed}
            onSelect={(key) => !revealed && setAnswers(prev => ({ ...prev, [q.id]: key }))}
            answer={q.answer}
            options={q.options}
            explanation={q.explanation}
          />
        ))}
      </div>

      {/* Submit / Results bar */}
      {!revealed ? (
        <div className="quiz-submit-bar">
          <span className="quiz-progress-text">
            {Object.keys(answers).length} / {mcqs.length} answered
          </span>
          <button
            className="quiz-submit-btn"
            onClick={() => setRevealed(true)}
            disabled={!allAnswered}
          >
            Submit All &amp; See Results
          </button>
        </div>
      ) : (
        <div className="quiz-results-bar">
          <span className="quiz-score">
            🎯 Score: <strong>{score}</strong> / {mcqs.length}
          </span>
          <span className="quiz-score-pct">
            ({Math.round((score / mcqs.length) * 100)}%)
          </span>
          <button
            className="quiz-retry-btn"
            onClick={() => { setAnswers({}); setRevealed(false); }}
          >
            ↺ Retry Quiz
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────
   Open Quiz — one at a time stepper
───────────────────────────────────── */
function OpenQuiz({ questions }) {
  const opens = questions.filter(q => q.type !== 'mcq');
  const [current, setCurrent] = useState(0);  // index into opens[]
  const [done, setDone]       = useState(false);

  if (opens.length === 0) return (
    <div className="empty-state">
      <div className="empty-state-icon">📭</div>
      <p>No open questions in this session.</p>
    </div>
  );

  if (done) return (
    <div className="quiz-done-screen">
      <div className="quiz-done-icon">🏁</div>
      <h2 className="quiz-done-title">Session Complete!</h2>
      <p className="quiz-done-sub">You've reviewed all {opens.length} question{opens.length > 1 ? 's' : ''}.</p>
      <button className="quiz-retry-btn" onClick={() => { setCurrent(0); setDone(false); }}>
        ↺ Start Over
      </button>
    </div>
  );

  return (
    <OpenCard
      question={opens[current]}
      index={current + 1}
      total={opens.length}
      onNext={() => {
        if (current + 1 >= opens.length) setDone(true);
        else setCurrent(c => c + 1);
      }}
    />
  );
}

/* ─────────────────────────────────────
   Mixed Quiz — MCQs first, then opens
───────────────────────────────────── */
function MixedQuiz({ questions }) {
  const mcqs  = questions.filter(q => q.type === 'mcq');
  const opens = questions.filter(q => q.type !== 'mcq');
  const [phase, setPhase] = useState(mcqs.length > 0 ? 'mcq' : 'open');

  // When MCQs are done (submitted), move to opens
  // We detect this via a local Submit wrapper
  const [mcqDone, setMcqDone] = useState(false);

  if (phase === 'mcq' && !mcqDone) {
    return (
      <div>
        <div className="quiz-phase-banner">
          📝 Phase 1 of 2 — Multiple Choice
        </div>
        <MCQQuizWithDone questions={mcqs} onDone={() => {
          if (opens.length > 0) setMcqDone(true);
        }} />
        {mcqDone && opens.length > 0 && (
          <div className="quiz-submit-bar" style={{ marginTop: 16 }}>
            <button className="quiz-submit-btn" onClick={() => setPhase('open')}>
              Continue to Open Questions →
            </button>
          </div>
        )}
      </div>
    );
  }

  if (opens.length > 0) {
    return (
      <div>
        <div className="quiz-phase-banner">
          ✏️ Phase 2 of 2 — Open Questions
        </div>
        <OpenQuiz questions={opens} />
      </div>
    );
  }

  return <MCQQuiz questions={mcqs} />;
}

/* Helper — MCQQuiz that calls onDone after reveal */
function MCQQuizWithDone({ questions, onDone }) {
  const [answers, setAnswers]   = useState({});
  const [revealed, setRevealed] = useState(false);
  const allAnswered = questions.every(q => answers[q.id] !== undefined);
  const score = revealed ? questions.filter(q => answers[q.id] === q.answer).length : null;

  return (
    <div className="quiz-shell">
      <div className="qc-list">
        {questions.map((q, i) => (
          <MCQCard
            key={q.id}
            question={q.question}
            index={i}
            selected={answers[q.id] ?? null}
            revealed={revealed}
            onSelect={(key) => !revealed && setAnswers(prev => ({ ...prev, [q.id]: key }))}
            answer={q.answer}
            options={q.options}
            explanation={q.explanation}
          />
        ))}
      </div>
      {!revealed ? (
        <div className="quiz-submit-bar">
          <span className="quiz-progress-text">
            {Object.keys(answers).length} / {questions.length} answered
          </span>
          <button
            className="quiz-submit-btn"
            onClick={() => { setRevealed(true); onDone(); }}
            disabled={!allAnswered}
          >
            Submit MCQs &amp; Continue
          </button>
        </div>
      ) : (
        <div className="quiz-results-bar">
          <span className="quiz-score">
            🎯 MCQ Score: <strong>{score}</strong> / {questions.length}
            ({Math.round((score / questions.length) * 100)}%)
          </span>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════
   Main Session Page
═══════════════════════════════════════ */
export default function Session({ user, theme, onThemeToggle, collapsed, onCollapse }) {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [session, setSession]   = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);

  // For the 'Generate More' form
  const [moreMode, setMoreMode]   = useState('mcq');
  const [moreCount, setMoreCount] = useState(5);

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

  const handleGenerateMore = async () => {
    setGeneratingMore(true);
    try {
      const res = await api.post('/generate', {
        text: session.course_name, // Backend uses courseName as context if text is missing
        courseName: session.course_name,
        mode: moreMode,
        count: moreCount,
        sessionId: session.id
      });
      
      setSession(prev => ({
        ...prev,
        questions: [...prev.questions, ...res.data.questions]
      }));
      setShowMoreModal(false);
    } catch (err) {
      alert('Failed to generate more questions. Please try again.');
    } finally {
      setGeneratingMore(false);
    }
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
  const mode      = session?.mode;

  // Derive instructions per mode
  const howToLines = (() => {
    if (mode === 'mcq') return [
      'Select an answer for every question',
      'Click "Submit All & See Results" when done',
      'Correct answers are revealed all at once',
      'You can retry the quiz as many times as you like',
    ];
    if (mode === 'essay' || mode === 'short_answer') return [
      'Each question is shown one at a time',
      'Type your answer in the box',
      'Click "Check My Answer" for AI feedback',
      'The model answer is revealed after grading',
      'Move to the next question when ready',
    ];
    return [
      'MCQs come first — answer all and submit',
      'Open questions follow one at a time',
      'AI grades your written answers intelligently',
    ];
  })();

  return (
    <div className="app-shell">
      <Sidebar {...sidebarProps} />

      <main className="main-content">
        <div className="session-shell">

          {/* ════ LEFT: quiz content ════ */}
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

            {questions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No questions found</h3>
                <p>Something may have gone wrong during generation.</p>
              </div>
            ) : (
              <>
                {(mode === 'mcq') && <MCQQuiz questions={questions} />}
                {(mode === 'essay' || mode === 'short_answer') && <OpenQuiz questions={questions} />}
                {(mode === 'mixed') && <MixedQuiz questions={questions} />}
              </>
            )}
          </div>

          {/* ════ RIGHT: sticky info panel ════ */}
          <aside className="session-right">
            <div className="session-info-panel">

              <span className="session-mode-pill">{MODE_LABEL[mode] || mode}</span>
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
                <ul className="session-how-list">
                  {howToLines.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              </div>

              {/* MCQ legend */}
              {(mode === 'mcq' || mode === 'mixed') && (
                <>
                  <div className="session-divider" />
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
                </>
              )}

              {/* Open-answer grade legend */}
              {(mode === 'essay' || mode === 'short_answer' || mode === 'mixed') && (
                <>
                  <div className="session-divider" />
                  <div className="session-legend">
                    <div className="session-legend-row">
                      <span className="legend-dot legend-dot--green" />
                      <span>Correct (70–100% match)</span>
                    </div>
                    <div className="session-legend-row">
                      <span className="legend-dot legend-dot--amber" />
                      <span>Partial (30–69% match)</span>
                    </div>
                    <div className="session-legend-row">
                      <span className="legend-dot legend-dot--red" />
                      <span>Incorrect (&lt;30% match)</span>
                    </div>
                  </div>
                </>
              )}

              <div className="session-divider" />
              <button 
                className="session-sidebar-btn" 
                onClick={() => setShowMoreModal(true)}
              >
                <span className="sidebar-btn-icon">＋</span>
                Generate More
              </button>

            </div>
          </aside>

        </div>
      </main>

      {/* Generate More Modal */}
      {showMoreModal && (
        <div className="modal-overlay" onClick={() => !generatingMore && setShowMoreModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generate More Questions</h3>
              <button className="modal-close" onClick={() => setShowMoreModal(false)} disabled={generatingMore}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="modal-sub">Add more questions to this session for <strong>{session.course_name}</strong>.</p>
              
              <div className="form-group">
                <label>Question Type</label>
                <div className="mode-chips">
                  {['mcq', 'short_answer', 'essay', 'code', 'mixed'].map(m => (
                    <button
                      key={m}
                      className={`mode-chip ${moreMode === m ? 'active' : ''}`}
                      onClick={() => setMoreMode(m)}
                    >
                      {m.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Count: {moreCount}</label>
                <input 
                  type="range" min="1" max="20" 
                  value={moreCount} 
                  onChange={e => setMoreCount(parseInt(e.target.value))}
                  className="range-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="lp-btn-light" 
                onClick={() => setShowMoreModal(false)}
                disabled={generatingMore}
              >
                Cancel
              </button>
              <button 
                className="lp-btn-dark" 
                onClick={handleGenerateMore}
                disabled={generatingMore}
              >
                {generatingMore ? 'Generating...' : '✦ Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
