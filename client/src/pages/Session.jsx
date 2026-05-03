import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import CodeLab from '../components/CodeLab.jsx';
import api from '../lib/api.js';

const MODE_LABEL = { mcq: 'MCQ', essay: 'Essay', short_answer: 'Short Answer', mixed: 'Mixed', code: 'Code' };

/* Group questions by timestamp proximity (5s window = same batch) */
function groupIntoBatches(questions) {
  if (!questions?.length) return [];
  const sorted = [...questions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const groups = [];
  let cur = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const gap = new Date(sorted[i].created_at) - new Date(sorted[i - 1].created_at);
    if (gap < 5000) cur.push(sorted[i]);
    else { groups.push(cur); cur = [sorted[i]]; }
  }
  groups.push(cur);
  return groups;
}

export default function Session({ user, theme, onThemeToggle, collapsed, onCollapse }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [answerMode, setAnswerMode] = useState('text');
  const [responses, setResponses] = useState({});
  const [skipped, setSkipped] = useState(new Set());
  const [showSummary, setShowSummary] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState(new Set());

  const [showMoreModal, setShowMoreModal] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [moreMode, setMoreMode] = useState('mcq');
  const [moreCount, setMoreCount] = useState(5);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/sessions/${id}`), api.get('/sessions')])
      .then(([res, allRes]) => {
        const sess = res.data;
        setSession(sess);
        setSessions(allRes.data);
        if (sess.questions?.length) {
          setSelectedId(sess.questions[0].id);
          const init = {};
          sess.questions.forEach(q => { init[q.id] = { draft: '', result: null, grading: false }; });
          setResponses(init);
        }
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load.'))
      .finally(() => setLoading(false));
  }, [id]);

  const batches = useMemo(() => {
    const groups = groupIntoBatches(session?.questions);
    return groups.map((qs, i) => ({
      batchId: `b${i}`,
      label: `Session ${i + 1}`,
      time: new Date(qs[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      typeLabel: [...new Set(qs.map(q => q.type))].map(t => MODE_LABEL[t] || t).join(' / '),
      questions: qs,
    }));
  }, [session]);

  useEffect(() => {
    if (batches.length) setExpandedBatches(new Set([batches[batches.length - 1].batchId]));
  }, [batches.length]);

  const allQuestions = useMemo(() =>
    session?.questions ? [...session.questions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : []
  , [session]);

  const currentIdx = allQuestions.findIndex(q => q.id === selectedId);
  const selectedQ = allQuestions[currentIdx];
  const resp = responses[selectedId] || {};
  const answeredCount = Object.values(responses).filter(r => r.draft?.trim()).length;

  const updateDraft = val => setResponses(p => ({ ...p, [selectedId]: { ...p[selectedId], draft: val } }));

  const handleSubmit = async () => {
    if (!resp.draft?.trim()) return;
    setResponses(p => ({ ...p, [selectedId]: { ...p[selectedId], grading: true } }));
    try {
      const res = await api.post('/grade', { questionId: selectedId, studentAnswer: resp.draft });
      setResponses(p => ({ ...p, [selectedId]: { ...p[selectedId], grading: false, result: res.data } }));
    } catch {
      alert('Grading failed. Please try again.');
      setResponses(p => ({ ...p, [selectedId]: { ...p[selectedId], grading: false } }));
    }
  };

  const goTo = (qId) => { setSelectedId(qId); setShowSummary(false); };
  const goPrev = () => { if (currentIdx > 0) goTo(allQuestions[currentIdx - 1].id); };
  const goNext = () => {
    if (currentIdx < allQuestions.length - 1) goTo(allQuestions[currentIdx + 1].id);
    else setShowSummary(true);
  };
  const doSkip = () => { setSkipped(p => new Set(p).add(selectedId)); goNext(); };

  const toggleBatch = (batchId) => {
    setExpandedBatches(p => {
      const n = new Set(p);
      n.has(batchId) ? n.delete(batchId) : n.add(batchId);
      return n;
    });
  };

  const handleGenerateMore = async () => {
    setGeneratingMore(true);
    try {
      const res = await api.post('/generate', { courseName: session.course_name, mode: moreMode, count: moreCount, sessionId: session.id });
      setSession(p => ({ ...p, questions: [...p.questions, ...res.data.questions] }));
      setResponses(p => {
        const n = { ...p };
        res.data.questions.forEach(q => { if (!n[q.id]) n[q.id] = { draft: '', result: null, grading: false }; });
        return n;
      });
      setShowMoreModal(false);
    } catch { alert('Failed to generate.'); }
    finally { setGeneratingMore(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this session?')) return;
    setDeleting(true);
    await api.delete(`/sessions/${id}`);
    navigate('/');
  };

  if (loading) return (
    <div className="sess-shell">
      <Sidebar user={user} sessions={[]} collapsed={collapsed} onCollapse={onCollapse} />
      <div className="sess-loading"><span className="spinner" /></div>
    </div>
  );

  if (error) return (
    <div className="sess-shell">
      <Sidebar user={user} sessions={[]} collapsed={collapsed} onCollapse={onCollapse} />
      <div className="sess-loading" style={{ color: 'var(--danger)' }}>{error}</div>
    </div>
  );

  return (
    <div className="sess-shell">
      <Sidebar user={user} sessions={sessions} theme={theme} onThemeToggle={onThemeToggle} collapsed={collapsed} onCollapse={onCollapse} />

      <div className="sess-body">

        {/* ── LEFT: Workspace ── */}
        <div className="sess-left">
          {showSummary ? (
            <div className="sess-summary">
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>Session Summary</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Review your progress before finishing.</p>
              </div>

              <div className="sess-summary-stats">
                {[
                  { label: 'Answered', val: answeredCount, color: 'var(--success)' },
                  { label: 'Skipped', val: skipped.size, color: 'var(--accent)' },
                  { label: 'Unanswered', val: allQuestions.length - answeredCount - skipped.size, color: 'var(--text-muted)' },
                ].map(s => (
                  <div key={s.label} className="sess-summary-stat">
                    <span style={{ fontSize: 32, fontWeight: 900, color: s.color }}>{s.val}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: 4 }}>{s.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allQuestions.map((q, i) => {
                  const r = responses[q.id];
                  const isAns = r?.draft?.trim() || r?.result;
                  const isSk = skipped.has(q.id);
                  return (
                    <div key={q.id} className="sess-summary-row">
                      <span className={`sess-summary-badge ${isAns ? 'badge-answered' : isSk ? 'badge-skipped' : 'badge-unanswered'}`}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: isAns ? 'var(--success)' : isSk ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {isAns ? 'Answered' : isSk ? 'Skipped' : 'Unanswered'}
                        </span>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => goTo(q.id)}>Review</button>
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <button className="btn btn-primary" style={{ padding: '14px 40px', fontSize: 14 }} onClick={() => navigate('/')}>
                  Finish &amp; Return Home
                </button>
              </div>
            </div>
          ) : selectedQ ? (
            <div className="sess-workspace">

              {/* Progress dots + counter */}
              <div className="sess-progress-bar">
                <span className="sess-progress-label">
                  Question {currentIdx + 1} of {allQuestions.length}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>
                  {answeredCount} answered · {skipped.size} skipped
                </span>
              </div>
              <div className="sess-dot-row">
                {allQuestions.map((q, i) => {
                  const isCur = q.id === selectedId;
                  const isAns = responses[q.id]?.draft?.trim() || responses[q.id]?.result;
                  const isSk = skipped.has(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => goTo(q.id)}
                      title={`Q${i + 1}`}
                      className={`sess-dot ${isCur ? 'sess-dot--active' : isAns ? 'sess-dot--answered' : isSk ? 'sess-dot--skipped' : 'sess-dot--empty'}`}
                    />
                  );
                })}
              </div>

              {/* Question text */}
              <div className="sess-question-block">
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                  <span className="badge badge-mixed">{MODE_LABEL[selectedQ.type] || selectedQ.type}</span>
                  {skipped.has(selectedId) && <span className="badge" style={{ background: 'rgba(245,158,11,.15)', color: 'var(--accent)' }}>Skipped</span>}
                </div>
                <h1 className="sess-question-text">{selectedQ.question}</h1>
              </div>

              {/* Mode toggle */}
              <div className="sess-mode-toggle">
                <div className="sess-mode-switch">
                  {['text', 'code'].map(m => (
                    <button key={m} onClick={() => setAnswerMode(m)}
                      className={`sess-mode-btn ${answerMode === m ? 'sess-mode-btn--active' : ''}`}>
                      {m === 'text' ? 'Text Mode' : 'Code Mode'}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Auto-saving draft</span>
              </div>

              {/* Editor */}
              <div className="sess-editor-area">
                {answerMode === 'text' ? (
                  <textarea
                    className="sess-textarea"
                    placeholder="Type your answer here..."
                    value={resp.draft || ''}
                    onChange={e => updateDraft(e.target.value)}
                    disabled={resp.grading}
                  />
                ) : (
                  <CodeLab value={resp.draft || ''} onChange={updateDraft} disabled={resp.grading} />
                )}
              </div>

              {/* Submit */}
              <button
                className={`btn ${resp.draft?.trim() && !resp.grading ? 'btn-primary' : ''}`}
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', ...((!resp.draft?.trim() || resp.grading) ? { background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'not-allowed' } : {}) }}
                onClick={handleSubmit}
                disabled={resp.grading || !resp.draft?.trim()}
              >
                {resp.grading ? 'AI Evaluating…' : 'Submit for AI Feedback'}
              </button>

              {/* Result */}
              {resp.result && (
                <div className={`sess-result ${resp.result.score >= 70 ? 'sess-result--correct' : resp.result.score >= 30 ? 'sess-result--partial' : 'sess-result--wrong'}`}>
                  <div className="sess-result-header">
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>AI Feedback</span>
                    <span className={`badge ${resp.result.score >= 70 ? 'badge-answered-pill' : resp.result.score >= 30 ? 'badge-skipped-pill' : 'badge-wrong-pill'}`}>{resp.result.score}%</span>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 12 }}>{resp.result.feedback}</p>
                  <div className="sess-model-answer">
                    <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Model Answer</span>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>{selectedQ.answer}</p>
                  </div>
                </div>
              )}

              {/* Nav controls */}
              <div className="sess-nav-controls">
                <button className="btn btn-ghost" onClick={goPrev} disabled={currentIdx === 0}>← Prev</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ border: '1px solid var(--accent)', color: 'var(--accent)', background: 'rgba(245,158,11,.08)' }} onClick={doSkip}>Skip</button>
                  <button className="btn btn-ghost" onClick={() => setShowSummary(true)}>Summary</button>
                  <button className="btn btn-primary" onClick={goNext}>
                    {currentIdx === allQuestions.length - 1 ? 'Finish' : 'Next →'}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="sess-empty-state">
              <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>🖱️</span>
              <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Select a question to begin</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: Batch list + Stats ── */}
        <div className="sess-right">

          <div className="sess-right-list">
            <div className="sess-right-heading">Study Sets</div>

            {batches.map(batch => (
              <div key={batch.batchId} style={{ marginBottom: 8 }}>
                <button className="sess-batch-header" onClick={() => toggleBatch(batch.batchId)}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-primary)' }}>{batch.label}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {batch.questions.length} Qs · {batch.time} · {batch.typeLabel}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', transition: 'transform 0.2s', display: 'inline-block', transform: expandedBatches.has(batch.batchId) ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </button>

                {expandedBatches.has(batch.batchId) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 4, marginTop: 4 }}>
                    {batch.questions.map(q => {
                      const gIdx = allQuestions.findIndex(aq => aq.id === q.id);
                      const isCur = q.id === selectedId;
                      const isAns = responses[q.id]?.draft?.trim() || responses[q.id]?.result;
                      const isSk = skipped.has(q.id);
                      return (
                        <button key={q.id} onClick={() => goTo(q.id)}
                          className={`sess-q-item ${isCur ? 'sess-q-item--active' : ''}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span className="sess-q-num">{gIdx + 1}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>{q.type}</span>
                            {isAns && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--success)' }}>✓</span>}
                            {isSk && !isAns && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--accent)' }}>!</span>}
                          </div>
                          <p style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isCur ? 'rgba(255,255,255,.9)' : 'var(--text-secondary)' }}>
                            {q.question}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pinned stats card */}
          <div className="sess-stats-card">
            <span className="badge badge-mixed" style={{ marginBottom: 6 }}>{MODE_LABEL[session?.mode]}</span>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.course_name}</h4>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>Progress: {answeredCount}/{allQuestions.length}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[{ label: 'Total', val: allQuestions.length }, { label: 'Open', val: allQuestions.filter(q => q.type !== 'mcq').length }].map(s => (
                <div key={s.label} style={{ background: 'var(--bg)', padding: '10px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{s.val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => setShowMoreModal(true)}>+ More</button>
              <button className="btn btn-danger btn-sm" style={{ padding: '6px 10px' }} onClick={handleDelete} disabled={deleting} title="Delete">🗑</button>
            </div>
          </div>
        </div>
      </div>

      {/* Generate More Modal */}
      {showMoreModal && (
        <div className="modal-overlay" onClick={() => !generatingMore && setShowMoreModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generate More</h3>
              <button className="modal-close" onClick={() => setShowMoreModal(false)} disabled={generatingMore}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="modal-sub">Add more questions to <strong>{session.course_name}</strong>.</p>
              <div className="form-group">
                <label>Question Type</label>
                <div className="mode-chips">
                  {['mcq', 'short_answer', 'essay', 'code', 'mixed'].map(m => (
                    <button key={m} className={`mode-chip ${moreMode === m ? 'active' : ''}`} onClick={() => setMoreMode(m)}>
                      {m.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Count: {moreCount}</label>
                <input type="range" min="1" max="20" value={moreCount} onChange={e => setMoreCount(+e.target.value)} className="range-input" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowMoreModal(false)} disabled={generatingMore}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGenerateMore} disabled={generatingMore}>
                {generatingMore ? 'Generating…' : '✦ Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
