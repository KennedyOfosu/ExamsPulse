import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import CodeLab from '../components/CodeLab.jsx';
import api from '../lib/api.js';

const MODE_LABEL = { mcq: 'MCQ', essay: 'Essay', short_answer: 'Short Answer', mixed: 'Mixed', code: 'Code' };

export default function Session({ user, theme, onThemeToggle, collapsed, onCollapse }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation State
  const [selectedId, setSelectedId] = useState(null);
  const [answerMode, setAnswerMode] = useState('text'); 
  const [responses, setResponses] = useState({}); // { [id]: { draft, result, grading } }
  const [skippedIds, setSkippedIds] = useState(new Set());
  const [showSummary, setShowSummary] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState(new Set());
  
  // UI State
  const [deleting, setDeleting] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [moreMode, setMoreMode] = useState('mcq');
  const [moreCount, setMoreCount] = useState(5);

  // Group questions into batches based on timestamp proximity (5s window)
  const batches = useMemo(() => {
    if (!session?.questions) return [];
    const questions = [...session.questions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const groups = [];
    let currentBatch = [];
    
    questions.forEach((q, i) => {
      if (i === 0) {
        currentBatch.push(q);
      } else {
        const prevTime = new Date(questions[i-1].created_at).getTime();
        const currTime = new Date(q.created_at).getTime();
        if (currTime - prevTime < 5000) {
          currentBatch.push(q);
        } else {
          groups.push(currentBatch);
          currentBatch = [q];
        }
      }
    });
    if (currentBatch.length) groups.push(currentBatch);
    
    // Sort groups descending (newest first)
    return groups.reverse().map((questions, idx) => ({
      id: `batch-${groups.length - idx}`,
      name: `Session ${groups.length - idx}`,
      timestamp: questions[0].created_at,
      questions,
      type: questions[0].type
    }));
  }, [session]);

  // Expand the latest batch by default
  useEffect(() => {
    if (batches.length > 0) {
      setExpandedBatches(new Set([batches[0].id]));
    }
  }, [batches.length]);

  useEffect(() => {
    Promise.all([
      api.get(`/sessions/${id}`),
      api.get('/sessions'),
    ]).then(([res, allRes]) => {
      const sess = res.data;
      setSession(sess);
      setSessions(allRes.data);
      if (sess.questions?.length > 0) {
        setSelectedId(sess.questions[0].id);
        setResponses(prev => {
          const initial = {};
          sess.questions.forEach(q => {
            initial[q.id] = { draft: '', result: null, grading: false };
          });
          return initial;
        });
      }
    }).catch(err => {
      setError(err.response?.data?.error || 'Failed to load session.');
    }).finally(() => setLoading(false));
  }, [id]);

  const allQuestions = useMemo(() => 
    session?.questions ? [...session.questions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : []
  , [session]);

  const currentIndex = allQuestions.findIndex(q => q.id === selectedId);
  const selectedQuestion = allQuestions[currentIndex];

  const handleUpdateDraft = (val) => {
    setResponses(prev => ({
      ...prev,
      [selectedId]: { ...prev[selectedId], draft: val }
    }));
    // Remove from skipped if they type
    if (skippedIds.has(selectedId)) {
      const next = new Set(skippedIds);
      next.delete(selectedId);
      setSkippedIds(next);
    }
  };

  const handleSubmit = async () => {
    const current = responses[selectedId];
    if (!current?.draft?.trim()) return;

    setResponses(prev => ({
      ...prev,
      [selectedId]: { ...prev[selectedId], grading: true }
    }));

    try {
      const res = await api.post('/grade', {
        questionId: selectedId,
        studentAnswer: current.draft
      });
      setResponses(prev => ({
        ...prev,
        [selectedId]: { ...prev[selectedId], grading: false, result: res.data }
      }));
    } catch (err) {
      alert('Grading failed. Please try again.');
      setResponses(prev => ({
        ...prev,
        [selectedId]: { ...prev[selectedId], grading: false }
      }));
    }
  };

  const handleSkip = () => {
    setSkippedIds(prev => new Set(prev).add(selectedId));
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < allQuestions.length - 1) {
      setSelectedId(allQuestions[currentIndex + 1].id);
      setShowSummary(false);
    } else {
      setShowSummary(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedId(allQuestions[currentIndex - 1].id);
      setShowSummary(false);
    }
  };

  const toggleBatch = (batchId) => {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!confirm('Delete this session?')) return;
    setDeleting(true);
    await api.delete(`/sessions/${id}`);
    navigate('/');
  };

  const handleGenerateMore = async () => {
    setGeneratingMore(true);
    try {
      const res = await api.post('/generate', {
        courseName: session.course_name,
        mode: moreMode,
        count: moreCount,
        sessionId: session.id
      });
      setSession(prev => ({
        ...prev,
        questions: [...prev.questions, ...res.data.questions]
      }));
      setResponses(prev => {
        const next = { ...prev };
        res.data.questions.forEach(q => {
          if (!next[q.id]) next[q.id] = { draft: '', result: null, grading: false };
        });
        return next;
      });
      setShowMoreModal(false);
    } catch (err) {
      alert('Failed to generate more questions.');
    } finally {
      setGeneratingMore(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen bg-background text-primary">
      <Sidebar user={user} sessions={[]} collapsed={collapsed} onCollapse={onCollapse} />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        user={user} sessions={sessions} theme={theme} 
        onThemeToggle={onThemeToggle} collapsed={collapsed} onCollapse={onCollapse} 
      />

      <main className="flex-1 flex overflow-hidden">
        
        {/* ── LEFT PANEL: Workspace ── */}
        <section className="flex-1 flex flex-col p-8 overflow-y-auto border-r border-border bg-surface-1">
          {showSummary ? (
            /* Summary Screen */
            <div className="max-w-4xl w-full mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-primary">Session Summary</h1>
                <p className="text-secondary">Review your progress before finishing.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {allQuestions.map((q, i) => {
                  const resp = responses[q.id];
                  const isAnswered = resp?.draft?.trim() || resp?.result;
                  const isSkipped = skippedIds.has(q.id);
                  
                  return (
                    <div key={q.id} className="bg-surface-2 p-5 rounded-2xl border border-border flex items-center justify-between group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border ${
                          isAnswered ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                          isSkipped ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                          'bg-surface-1 border-border text-muted'
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-primary line-clamp-1">{q.question}</p>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                            {isAnswered ? 'Answered' : isSkipped ? 'Skipped' : 'Unanswered'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedId(q.id); setShowSummary(false); }}
                        className="px-4 py-2 bg-surface-1 hover:bg-primary hover:text-white border border-border rounded-lg text-xs font-bold transition-all"
                      >
                        Review
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => navigate('/')}
                  className="px-10 py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all"
                >
                  Finish Session & Return Home
                </button>
              </div>
            </div>
          ) : selectedQuestion ? (
            /* Question Workspace */
            <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
              
              {/* Top Navigation Strip */}
              <div className="mb-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-primary uppercase tracking-tighter bg-primary/10 px-3 py-1 rounded-full">
                      Question {currentIndex + 1} of {allQuestions.length}
                    </span>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                      {MODE_LABEL[selectedQuestion.type]} Question
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {allQuestions.map((q, i) => {
                      const isCurrent = q.id === selectedId;
                      const resp = responses[q.id];
                      const isAnswered = resp?.draft?.trim() || resp?.result;
                      const isSkipped = skippedIds.has(q.id);
                      
                      return (
                        <button
                          key={q.id}
                          onClick={() => setSelectedId(q.id)}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            isCurrent ? 'ring-4 ring-primary/20 bg-primary scale-125' :
                            isAnswered ? 'bg-green-500' :
                            isSkipped ? 'ring-1 ring-amber-500 ring-offset-2 ring-offset-surface-1 bg-amber-500/20' :
                            'bg-border'
                          }`}
                          title={`Question ${i + 1}`}
                        />
                      );
                    })}
                  </div>
                </div>

                <h1 className="text-2xl font-bold leading-tight text-primary">
                  {selectedQuestion.question}
                </h1>
              </div>

              {/* Workspace Content */}
              <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Toggle Switch */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex bg-surface-2 p-1 rounded-lg border border-border shadow-inner">
                    <button 
                      className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all ${answerMode === 'text' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-primary'}`}
                      onClick={() => setAnswerMode('text')}
                    >
                      TEXT MODE
                    </button>
                    <button 
                      className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all ${answerMode === 'code' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-primary'}`}
                      onClick={() => setAnswerMode('code')}
                    >
                      CODE MODE
                    </button>
                  </div>
                  <button 
                    onClick={handleSubmit}
                    disabled={responses[selectedId]?.grading || !responses[selectedId]?.draft?.trim()}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      responses[selectedId]?.grading || !responses[selectedId]?.draft?.trim()
                        ? 'bg-muted/30 text-muted cursor-not-allowed'
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                    }`}
                  >
                    {responses[selectedId]?.grading ? 'Grading...' : 'Grade Answer'}
                  </button>
                </div>

                {/* Editor Area */}
                <div className="min-h-[350px]">
                  {answerMode === 'text' ? (
                    <textarea
                      className="w-full h-96 p-8 bg-surface-2 border border-border rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none resize-none text-primary font-medium leading-relaxed transition-all placeholder:text-muted/40"
                      placeholder="Your analytical response..."
                      value={responses[selectedId]?.draft || ''}
                      onChange={(e) => handleUpdateDraft(e.target.value)}
                      disabled={responses[selectedId]?.grading}
                    />
                  ) : (
                    <CodeLab 
                      value={responses[selectedId]?.draft || ''}
                      onChange={handleUpdateDraft}
                      disabled={responses[selectedId]?.grading}
                    />
                  )}
                </div>

                {/* Result Display */}
                {responses[selectedId]?.result && (
                  <div className={`p-6 rounded-2xl border-l-4 shadow-sm animate-in zoom-in-95 duration-300 ${
                    responses[selectedId].result.score >= 70 ? 'bg-green-50/30 border-green-500' :
                    responses[selectedId].result.score >= 30 ? 'bg-amber-50/30 border-amber-500' : 'bg-red-50/30 border-red-500'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-black text-[10px] uppercase tracking-widest text-primary">AI Feedback</h3>
                      <span className="text-xs font-black">{responses[selectedId].result.score}% Match</span>
                    </div>
                    <p className="text-sm leading-relaxed text-secondary mb-4">{responses[selectedId].result.feedback}</p>
                    <div className="p-4 bg-surface-1/50 rounded-xl border border-border/50">
                      <span className="text-[9px] font-black text-muted uppercase block mb-1">Model Answer Reference</span>
                      <p className="text-[11px] text-muted leading-relaxed italic">{selectedQuestion.answer}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Controls */}
              <div className="mt-auto pt-10 border-t border-border flex items-center justify-between gap-4">
                <div className="flex gap-3">
                  <button 
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-4 bg-surface-2 border border-border rounded-xl hover:bg-surface-1 disabled:opacity-30 disabled:hover:bg-surface-2 transition-all"
                    title="Previous"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button 
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                  >
                    {currentIndex === allQuestions.length - 1 ? 'View Summary' : 'Next Question'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleSkip}
                    disabled={currentIndex === allQuestions.length - 1 && showSummary}
                    className="px-6 py-4 bg-surface-2 border border-amber-200 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-50 transition-all"
                  >
                    Skip
                  </button>
                  <button 
                    onClick={() => setShowSummary(true)}
                    className="px-6 py-4 bg-surface-2 border border-border text-muted rounded-xl font-bold text-sm hover:text-primary hover:border-primary transition-all"
                  >
                    Finish
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
              <span className="text-6xl mb-4">🖱️</span>
              <p className="text-sm font-bold tracking-widest uppercase">Select a question to begin</p>
            </div>
          )}
        </section>

        {/* ── RIGHT PANEL: Batched List & Stats ── */}
        <section className="w-80 flex flex-col bg-surface-2 border-l border-border relative">
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-widest px-2">Study Sets</h3>
            
            {batches.map((batch, bIdx) => (
              <div key={batch.id} className="space-y-2">
                <button 
                  onClick={() => toggleBatch(batch.id)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-surface-1 border border-border rounded-lg group"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[11px] font-black text-primary uppercase leading-tight">{batch.name}</span>
                    <span className="text-[9px] text-muted font-bold uppercase tracking-tighter">
                      {batch.questions.length} Questions • {new Date(batch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-muted transition-transform ${expandedBatches.has(batch.id) ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  ><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {expandedBatches.has(batch.id) && (
                  <div className="space-y-1.5 pl-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {batch.questions.map((q) => {
                      const qIdx = allQuestions.findIndex(aq => aq.id === q.id);
                      const isCurrent = q.id === selectedId;
                      const isAnswered = responses[q.id]?.draft?.trim() || responses[q.id]?.result;
                      const isSkipped = skippedIds.has(q.id);

                      return (
                        <button
                          key={q.id}
                          onClick={() => { setSelectedId(q.id); setShowSummary(false); }}
                          className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                            isCurrent 
                              ? 'bg-primary border-primary text-white shadow-md' 
                              : 'bg-surface-1 border-border text-primary hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              isCurrent ? 'bg-white/20' : 'bg-muted/10'
                            }`}>
                              {qIdx + 1}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                              {q.type}
                            </span>
                            {isAnswered && <span className="ml-auto text-[9px]">✓</span>}
                            {isSkipped && <span className="ml-auto text-[9px] text-amber-500">!</span>}
                          </div>
                          <p className={`text-[11px] line-clamp-1 font-medium ${
                            isCurrent ? 'text-white/90' : 'text-secondary'
                          }`}>
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

          {/* Compact Stats Card (Pinned) */}
          <div className="p-4 bg-surface-1 border-t border-border shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)]">
            <div className="bg-surface-2 rounded-2xl p-5 border border-border space-y-4">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase mb-2 inline-block">
                  {MODE_LABEL[session.mode]}
                </span>
                <h4 className="text-sm font-bold text-primary truncate leading-none mb-1">{session.course_name}</h4>
                <p className="text-[10px] text-muted font-medium">Progress: {Object.values(responses).filter(r => r.draft?.trim()).length}/{allQuestions.length}</p>
              </div>

              <div className="flex gap-2">
                <button 
                  className="flex-1 py-2.5 bg-surface-1 hover:bg-muted/5 text-[10px] font-black text-muted hover:text-primary uppercase tracking-widest border border-border rounded-lg transition-all"
                  onClick={() => setShowMoreModal(true)}
                >
                  Generate More
                </button>
                <button 
                  className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-all border border-red-100"
                  onClick={handleDelete}
                  title="Delete Session"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* Generate More Modal */}
      {showMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-1 w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Generate More</h3>
              <button className="text-muted hover:text-primary text-xl" onClick={() => setShowMoreModal(false)}>&times;</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Question Type</label>
                <div className="flex flex-wrap gap-2">
                  {['mcq', 'short_answer', 'essay', 'code', 'mixed'].map(m => (
                    <button
                      key={m}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                        moreMode === m ? 'bg-primary border-primary text-white' : 'bg-surface-2 border-border text-muted hover:border-primary'
                      }`}
                      onClick={() => setMoreMode(m)}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Count</label>
                  <span className="text-xs font-bold text-primary">{moreCount} questions</span>
                </div>
                <input 
                  type="range" min="1" max="20" 
                  value={moreCount} 
                  onChange={e => setMoreCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
            <div className="p-6 bg-surface-2/50 flex gap-3">
              <button className="flex-1 py-3 text-xs font-bold text-muted uppercase tracking-widest" onClick={() => setShowMoreModal(false)}>Cancel</button>
              <button 
                className="flex-[2] py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 uppercase tracking-widest"
                onClick={handleGenerateMore}
                disabled={generatingMore}
              >
                {generatingMore ? 'Generating...' : 'Start Generation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
