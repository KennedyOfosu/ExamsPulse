import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import CodeLab from '../components/CodeLab.jsx';
import api from '../lib/api.js';

const MODE_LABEL = { mcq: 'MCQ', essay: 'Essay', short_answer: 'Short Answer', mixed: 'Mixed' };

export default function Session({ user, theme, onThemeToggle, collapsed, onCollapse }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Workspace State
  const [selectedId, setSelectedId] = useState(null);
  const [answerMode, setAnswerMode] = useState('text'); // 'text' | 'code'
  const [responses, setResponses] = useState({}); // { [id]: { draft, result, grading } }
  
  // UI State
  const [deleting, setDeleting] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [moreMode, setMoreMode] = useState('mcq');
  const [moreCount, setMoreCount] = useState(5);

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
        // Initialize responses for the first question
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

  const selectedQuestion = useMemo(() => 
    session?.questions?.find(q => q.id === selectedId), 
  [session, selectedId]);

  const handleUpdateDraft = (val) => {
    setResponses(prev => ({
      ...prev,
      [selectedId]: { ...prev[selectedId], draft: val }
    }));
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
      // Initialize new responses
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
          {selectedQuestion ? (
            <div className="max-w-4xl w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Question Area */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    Question {session.questions.indexOf(selectedQuestion) + 1}
                  </span>
                  <span className="text-muted text-xs font-medium">
                    {MODE_LABEL[selectedQuestion.type] || selectedQuestion.type}
                  </span>
                </div>
                <h1 className="text-2xl font-semibold leading-tight text-primary">
                  {selectedQuestion.question}
                </h1>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex bg-surface-2 p-1 rounded-lg border border-border shadow-inner">
                  <button 
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${answerMode === 'text' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-primary'}`}
                    onClick={() => setAnswerMode('text')}
                  >
                    TEXT MODE
                  </button>
                  <button 
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${answerMode === 'code' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-primary'}`}
                    onClick={() => setAnswerMode('code')}
                  >
                    CODE MODE
                  </button>
                </div>
                <div className="text-xs text-muted font-medium">
                  Saving automatically...
                </div>
              </div>

              {/* Input Area */}
              <div className="min-h-[300px]">
                {answerMode === 'text' ? (
                  <textarea
                    className="w-full h-80 p-6 bg-surface-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-primary font-medium leading-relaxed transition-all placeholder:text-muted/50"
                    placeholder="Type your structured answer here..."
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

              {/* Submit Button */}
              <div className="flex flex-col items-center gap-4">
                <button
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg ${
                    responses[selectedId]?.grading || !responses[selectedId]?.draft?.trim()
                      ? 'bg-muted cursor-not-allowed opacity-50'
                      : 'bg-primary text-white hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                  onClick={handleSubmit}
                  disabled={responses[selectedId]?.grading || !responses[selectedId]?.draft?.trim()}
                >
                  {responses[selectedId]?.grading ? 'AI IS EVALUATING...' : 'SUBMIT FOR AI FEEDBACK'}
                </button>

                {/* Feedback Result */}
                {responses[selectedId]?.result && (
                  <div className={`w-full p-6 rounded-xl border-l-4 shadow-sm animate-in zoom-in-95 duration-300 ${
                    responses[selectedId].result.score >= 70 ? 'bg-green-50/50 border-green-500' :
                    responses[selectedId].result.score >= 30 ? 'bg-amber-50/50 border-amber-500' : 'bg-red-50/50 border-red-500'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-sm uppercase tracking-tight text-primary">AI Feedback</h3>
                      <span className={`px-2 py-1 rounded text-xs font-black ${
                        responses[selectedId].result.score >= 70 ? 'bg-green-100 text-green-700' :
                        responses[selectedId].result.score >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {responses[selectedId].result.score}% MATCH
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-secondary mb-4">{responses[selectedId].result.feedback}</p>
                    <div className="p-4 bg-surface-1/50 rounded-lg border border-border/50">
                      <span className="text-[10px] font-bold text-muted uppercase block mb-1">Model Answer</span>
                      <p className="text-xs text-muted leading-normal italic">{selectedQuestion.answer}</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
              <span className="text-6xl mb-4">🖱️</span>
              <p className="text-sm font-bold tracking-widest uppercase">Select a question to begin</p>
            </div>
          )}
        </section>

        {/* ── RIGHT PANEL: Navigation & Stats ── */}
        <section className="w-80 flex flex-col bg-surface-2 border-l border-border relative">
          
          {/* Question List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 px-2">Questions</h3>
            {session.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setSelectedId(q.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
                  selectedId === q.id 
                    ? 'bg-primary border-primary text-white shadow-md' 
                    : 'bg-surface-1 border-border text-primary hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    selectedId === q.id ? 'bg-white/20' : 'bg-muted/10'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60`}>
                    {q.type}
                  </span>
                  {responses[q.id]?.result && (
                    <span className="ml-auto text-[10px]">✓</span>
                  )}
                </div>
                <p className={`text-xs line-clamp-2 leading-relaxed font-medium ${
                  selectedId === q.id ? 'text-white/90' : 'text-secondary'
                }`}>
                  {q.question}
                </p>
              </button>
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
                <p className="text-[10px] text-muted font-medium">Created on {new Date(session.created_at).toLocaleDateString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-surface-1 p-3 rounded-xl border border-border/50">
                  <span className="block text-[10px] font-bold text-muted uppercase mb-1">Total</span>
                  <span className="text-xl font-black text-primary leading-none">{session.questions.length}</span>
                </div>
                <div className="bg-surface-1 p-3 rounded-xl border border-border/50">
                  <span className="block text-[10px] font-bold text-muted uppercase mb-1">Open</span>
                  <span className="text-xl font-black text-primary leading-none">
                    {session.questions.filter(q => q.type !== 'mcq').length}
                  </span>
                </div>
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

      {/* Generate More Modal (Reused) */}
      {showMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-1 w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-primary">Generate More</h3>
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
              <button className="flex-1 py-3 text-xs font-bold text-muted" onClick={() => setShowMoreModal(false)}>Cancel</button>
              <button 
                className="flex-[2] py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20"
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
