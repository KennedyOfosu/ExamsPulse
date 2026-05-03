import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import CodeLab from '../components/CodeLab.jsx';
import api from '../lib/api.js';

const MODE_LABEL = { mcq: 'MCQ', essay: 'Essay', short_answer: 'Short Answer', mixed: 'Mixed', code: 'Code' };

/* Group questions by timestamp proximity (5-second window = same batch) */
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

  // Navigation
  const [selectedId, setSelectedId] = useState(null);
  const [answerMode, setAnswerMode] = useState('text');
  const [responses, setResponses] = useState({});
  const [skipped, setSkipped] = useState(new Set());
  const [showSummary, setShowSummary] = useState(false);

  // Sidebar batch accordion
  const [expandedBatches, setExpandedBatches] = useState(new Set());

  // Generate More modal
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

  // Auto-expand latest batch
  useEffect(() => {
    if (batches.length) setExpandedBatches(new Set([batches[batches.length - 1].batchId]));
  }, [batches.length]);

  const allQuestions = useMemo(() =>
    session?.questions ? [...session.questions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : []
  , [session]);

  const currentIdx = allQuestions.findIndex(q => q.id === selectedId);
  const selectedQ = allQuestions[currentIdx];

  const updateDraft = val => setResponses(p => ({ ...p, [selectedId]: { ...p[selectedId], draft: val } }));

  const handleSubmit = async () => {
    const cur = responses[selectedId];
    if (!cur?.draft?.trim()) return;
    setResponses(p => ({ ...p, [selectedId]: { ...p[selectedId], grading: true } }));
    try {
      const res = await api.post('/grade', { questionId: selectedId, studentAnswer: cur.draft });
      setResponses(p => ({ ...p, [selectedId]: { ...p[selectedId], grading: false, result: res.data } }));
    } catch {
      alert('Grading failed.');
      setResponses(p => ({ ...p, [selectedId]: { ...p[selectedId], grading: false } }));
    }
  };

  const goTo = (qId) => { setSelectedId(qId); setShowSummary(false); };
  const goPrev = () => { if (currentIdx > 0) goTo(allQuestions[currentIdx - 1].id); };
  const goNext = () => {
    if (currentIdx < allQuestions.length - 1) goTo(allQuestions[currentIdx + 1].id);
    else setShowSummary(true);
  };
  const doSkip = () => {
    setSkipped(p => new Set(p).add(selectedId));
    goNext();
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
    <div className="flex h-screen bg-background">
      <Sidebar user={user} sessions={[]} collapsed={collapsed} onCollapse={onCollapse} />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    </div>
  );
  if (error) return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} sessions={[]} collapsed={collapsed} onCollapse={onCollapse} />
      <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>
    </div>
  );

  const resp = responses[selectedId] || {};
  const answeredCount = Object.values(responses).filter(r => r.draft?.trim()).length;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={user} sessions={sessions} theme={theme} onThemeToggle={onThemeToggle} collapsed={collapsed} onCollapse={onCollapse} />

      <main className="flex-1 flex overflow-hidden">

        {/* ── LEFT: Workspace ── */}
        <section className="flex-1 flex flex-col overflow-y-auto border-r border-border bg-surface-1">
          {showSummary ? (
            /* Summary Screen */
            <div className="max-w-3xl w-full mx-auto p-10 space-y-8">
              <div className="text-center">
                <h1 className="text-3xl font-black text-primary">Session Summary</h1>
                <p className="text-secondary mt-1">Review your progress before finishing.</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Answered', val: answeredCount, color: 'text-green-500' },
                  { label: 'Skipped', val: skipped.size, color: 'text-amber-500' },
                  { label: 'Unanswered', val: allQuestions.length - answeredCount - skipped.size, color: 'text-muted' },
                ].map(s => (
                  <div key={s.label} className="bg-surface-2 rounded-2xl p-5 border border-border">
                    <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                    <div className="text-[10px] font-bold text-muted uppercase mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {allQuestions.map((q, i) => {
                  const r = responses[q.id];
                  const isAns = r?.draft?.trim() || r?.result;
                  const isSk = skipped.has(q.id);
                  return (
                    <div key={q.id} className="flex items-center gap-4 bg-surface-2 p-4 rounded-xl border border-border">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border ${isAns ? 'bg-green-500/10 border-green-500/30 text-green-600' : isSk ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-surface-1 border-border text-muted'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-primary truncate">{q.question}</p>
                        <span className="text-[10px] font-bold text-muted uppercase">{isAns ? 'Answered' : isSk ? 'Skipped' : 'Unanswered'}</span>
                      </div>
                      <button onClick={() => goTo(q.id)} className="px-3 py-1.5 bg-surface-1 hover:bg-primary hover:text-white border border-border rounded-lg text-xs font-bold transition-all">Review</button>
                    </div>
                  );
                })}
              </div>
              <div className="text-center pt-4">
                <button onClick={() => navigate('/')} className="px-10 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20">Finish & Return Home</button>
              </div>
            </div>
          ) : selectedQ ? (
            <div className="max-w-4xl w-full mx-auto p-8 flex flex-col min-h-full">

              {/* Progress dots + counter */}
              <div className="mb-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                    Question {currentIdx + 1} of {allQuestions.length}
                  </span>
                  <span className="text-[10px] text-muted font-bold uppercase">{answeredCount} answered · {skipped.size} skipped</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {allQuestions.map((q, i) => {
                    const isCur = q.id === selectedId;
                    const isAns = responses[q.id]?.draft?.trim() || responses[q.id]?.result;
                    const isSk = skipped.has(q.id);
                    return (
                      <button key={q.id} onClick={() => goTo(q.id)} title={`Q${i + 1}`}
                        className={`h-2.5 rounded-full transition-all duration-300 ${isCur ? 'w-6 bg-primary ring-4 ring-primary/20' : isAns ? 'w-2.5 bg-green-500' : isSk ? 'w-2.5 bg-amber-400' : 'w-2.5 bg-border hover:bg-muted'}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Question */}
              <div className="mb-6 space-y-3">
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded uppercase">{MODE_LABEL[selectedQ.type] || selectedQ.type}</span>
                  {skipped.has(selectedId) && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded uppercase">Skipped</span>}
                </div>
                <h1 className="text-2xl font-semibold text-primary leading-tight">{selectedQ.question}</h1>
              </div>

              {/* Mode toggle */}
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div className="flex bg-surface-2 p-1 rounded-lg border border-border">
                  {['text', 'code'].map(m => (
                    <button key={m} onClick={() => setAnswerMode(m)}
                      className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all uppercase ${answerMode === m ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-primary'}`}>
                      {m} Mode
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-muted">Auto-saving draft</span>
              </div>

              {/* Editor */}
              <div className="mb-6">
                {answerMode === 'text' ? (
                  <textarea
                    className="w-full h-64 p-6 bg-surface-2 border border-border rounded-xl outline-none resize-none text-primary font-medium leading-relaxed focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted/40"
                    placeholder="Type your answer here..."
                    value={resp.draft || ''}
                    onChange={e => updateDraft(e.target.value)}
                    disabled={resp.grading}
                  />
                ) : (
                  <CodeLab value={resp.draft || ''} onChange={updateDraft} disabled={resp.grading} />
                )}
              </div>

              {/* Submit + Result */}
              <div className="mb-8 space-y-4">
                <button onClick={handleSubmit}
                  disabled={resp.grading || !resp.draft?.trim()}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all ${resp.grading || !resp.draft?.trim() ? 'bg-surface-2 text-muted cursor-not-allowed border border-border' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5'}`}>
                  {resp.grading ? 'AI Evaluating…' : 'Submit for AI Feedback'}
                </button>
                {resp.result && (
                  <div className={`p-6 rounded-xl border-l-4 ${resp.result.score >= 70 ? 'bg-green-50/30 border-green-500' : resp.result.score >= 30 ? 'bg-amber-50/30 border-amber-500' : 'bg-red-50/30 border-red-500'}`}>
                    <div className="flex justify-between mb-3">
                      <span className="text-xs font-black text-primary uppercase">AI Feedback</span>
                      <span className={`text-xs font-black px-2 py-0.5 rounded ${resp.result.score >= 70 ? 'bg-green-100 text-green-700' : resp.result.score >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{resp.result.score}%</span>
                    </div>
                    <p className="text-sm text-secondary leading-relaxed mb-3">{resp.result.feedback}</p>
                    <div className="p-3 bg-surface-1/50 rounded-lg border border-border/50">
                      <span className="text-[9px] font-black text-muted uppercase block mb-1">Model Answer</span>
                      <p className="text-xs text-muted italic">{selectedQ.answer}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Nav controls */}
              <div className="mt-auto pt-6 border-t border-border flex items-center justify-between gap-3">
                <button onClick={goPrev} disabled={currentIdx === 0}
                  className="flex items-center gap-2 px-5 py-3 bg-surface-2 border border-border rounded-xl text-xs font-bold disabled:opacity-30 hover:border-primary/50 transition-all">
                  ← Prev
                </button>
                <div className="flex gap-2">
                  <button onClick={doSkip} className="px-5 py-3 border border-amber-300 text-amber-700 bg-amber-50/50 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all">Skip</button>
                  <button onClick={() => setShowSummary(true)} className="px-5 py-3 bg-surface-2 border border-border text-muted rounded-xl text-xs font-bold hover:text-primary transition-all">Summary</button>
                  <button onClick={goNext} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                    {currentIdx === allQuestions.length - 1 ? 'Finish' : 'Next →'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
              <span className="text-5xl mb-3">🖱️</span>
              <p className="text-sm font-bold uppercase tracking-widest">Select a question to begin</p>
            </div>
          )}
        </section>

        {/* ── RIGHT: Batch list + Stats ── */}
        <section className="w-72 flex flex-col bg-surface-2 border-l border-border">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-widest px-1 mb-3">Study Sets</h3>
            {batches.map(batch => (
              <div key={batch.batchId}>
                {/* Batch header */}
                <button onClick={() => setExpandedBatches(p => { const n = new Set(p); n.has(batch.batchId) ? n.delete(batch.batchId) : n.add(batch.batchId); return n; })}
                  className="w-full flex items-center justify-between px-3 py-2 bg-surface-1 border border-border rounded-lg mb-1 hover:border-primary/40 transition-all">
                  <div className="text-left">
                    <div className="text-[11px] font-black text-primary">{batch.label}</div>
                    <div className="text-[9px] text-muted font-bold">{batch.questions.length} Qs · {batch.time} · {batch.typeLabel}</div>
                  </div>
                  <svg className={`w-3.5 h-3.5 text-muted transition-transform ${expandedBatches.has(batch.batchId) ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {expandedBatches.has(batch.batchId) && (
                  <div className="space-y-1 pl-1">
                    {batch.questions.map(q => {
                      const gIdx = allQuestions.findIndex(aq => aq.id === q.id);
                      const isCur = q.id === selectedId;
                      const isAns = responses[q.id]?.draft?.trim() || responses[q.id]?.result;
                      const isSk = skipped.has(q.id);
                      return (
                        <button key={q.id} onClick={() => goTo(q.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${isCur ? 'bg-primary border-primary text-white' : 'bg-surface-1 border-border hover:border-primary/40'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-black px-1.5 rounded ${isCur ? 'bg-white/20' : 'bg-muted/10'}`}>{gIdx + 1}</span>
                            <span className="text-[9px] font-bold uppercase opacity-60">{q.type}</span>
                            {isAns && <span className="ml-auto text-[9px] text-green-500">✓</span>}
                            {isSk && !isAns && <span className="ml-auto text-[9px] text-amber-500">!</span>}
                          </div>
                          <p className={`text-[11px] font-medium line-clamp-1 ${isCur ? 'text-white/90' : 'text-secondary'}`}>{q.question}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pinned stats card */}
          <div className="p-3 border-t border-border">
            <div className="bg-surface-1 rounded-2xl p-4 border border-border space-y-3">
              <div>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mb-1">{MODE_LABEL[session?.mode]}</span>
                <h4 className="text-sm font-bold text-primary truncate">{session?.course_name}</h4>
                <p className="text-[10px] text-muted">Progress: {answeredCount}/{allQuestions.length}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-2 p-2.5 rounded-xl border border-border/50">
                  <div className="text-[9px] font-bold text-muted uppercase mb-0.5">Total</div>
                  <div className="text-lg font-black text-primary">{allQuestions.length}</div>
                </div>
                <div className="bg-surface-2 p-2.5 rounded-xl border border-border/50">
                  <div className="text-[9px] font-bold text-muted uppercase mb-0.5">Open</div>
                  <div className="text-lg font-black text-primary">{allQuestions.filter(q => q.type !== 'mcq').length}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowMoreModal(true)} className="flex-1 py-2 text-[10px] font-black text-muted hover:text-primary uppercase tracking-widest bg-surface-2 border border-border rounded-lg transition-all">+ More</button>
                <button onClick={handleDelete} disabled={deleting} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-all">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4h6v2" /></svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Generate More Modal */}
      {showMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-1 w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-sm text-primary uppercase tracking-widest">Generate More</h3>
              <button className="text-muted hover:text-primary text-xl" onClick={() => setShowMoreModal(false)}>&times;</button>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Question Type</label>
                <div className="flex flex-wrap gap-2">
                  {['mcq', 'short_answer', 'essay', 'code', 'mixed'].map(m => (
                    <button key={m} onClick={() => setMoreMode(m)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${moreMode === m ? 'bg-primary border-primary text-white' : 'bg-surface-2 border-border text-muted hover:border-primary'}`}>
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Count</label>
                  <span className="text-xs font-bold text-primary">{moreCount} questions</span>
                </div>
                <input type="range" min="1" max="20" value={moreCount} onChange={e => setMoreCount(+e.target.value)} className="w-full accent-primary" />
              </div>
            </div>
            <div className="p-5 bg-surface-2/50 flex gap-3">
              <button className="flex-1 py-3 text-xs font-bold text-muted" onClick={() => setShowMoreModal(false)}>Cancel</button>
              <button onClick={handleGenerateMore} disabled={generatingMore} className="flex-[2] py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-lg">
                {generatingMore ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
