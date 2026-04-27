import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import api from '../lib/api.js';

const MODES = [
  { id: 'mixed',        label: 'Mixed',        icon: '🎯', desc: 'All question types' },
  { id: 'mcq',         label: 'MCQ',           icon: '📝', desc: 'Multiple choice only' },
  { id: 'essay',       label: 'Essay',         icon: '✍️', desc: 'Long-form answers' },
  { id: 'short_answer',label: 'Short Answer',  icon: '💬', desc: 'Brief responses' },
];

const ACCEPTED_EXT = ['.pdf', '.ppt', '.pptx'];

function fileIcon(name = '') {
  const ext = name.toLowerCase().split('.').pop();
  if (ext === 'pdf') return '📄';
  if (['ppt','pptx'].includes(ext)) return '📊';
  return '📎';
}
function formatSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(0) + ' KB';
  return (b/1048576).toFixed(1) + ' MB';
}

/* ── Folder card badge config ── */
const MODE_BADGE = {
  mcq:          { text: 'MCQ',   bg: '#3b82f6' },
  essay:        { text: 'Essay', bg: '#f59e0b' },
  short_answer: { text: 'S/A',   bg: '#10b981' },
  mixed:        { text: 'Mixed', bg: '#6b7280' },
};

function FolderCard({ session }) {
  const badge = MODE_BADGE[session.mode] || MODE_BADGE.mixed;
  const date  = new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <a href={`/session/${session.id}`} className="session-folder-card" title={session.course_name}>
      <div className="folder-icon-wrap">
        <svg width="120" height="94" viewBox="0 0 120 94" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="24" width="112" height="66" rx="9" fill="#323232"/>
          <path d="M4 24 Q4 15 13 15 L44 15 Q52 15 56 24 Z" fill="#323232"/>
          <rect x="26" y="9" width="62" height="30" rx="5" fill="#b0b0b0" transform="rotate(-5 57 24)"/>
          <rect x="32" y="7" width="62" height="30" rx="5" fill="#cccccc" transform="rotate(3 63 22)"/>
          <rect x="4" y="32" width="112" height="58" rx="9" fill="#404040"/>
          <rect x="4" y="32" width="112" height="20" rx="9" fill="white" opacity="0.06"/>
          <rect x="10" y="70" width="38" height="16" rx="8" fill={badge.bg} opacity="0.9"/>
          <text x="29" y="81" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="700"
            fontFamily="Inter,system-ui,sans-serif">{badge.text}</text>
        </svg>
      </div>
      <div className="folder-name">{session.course_name || 'Untitled'}</div>
      <div className="folder-meta">{date}</div>
    </a>
  );
}

export default function Dashboard({ user, theme, onThemeToggle, collapsed, onCollapse }) {
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const courseModalRef = useRef();
  const typeModalRef = useRef();

  const [files, setFiles]           = useState([]);
  const [context, setContext]       = useState('');
  const [courseName, setCourseName] = useState('');
  const [count, setCount]           = useState(10);
  const [mode, setMode]             = useState('mixed');
  const [dragging, setDragging]     = useState(false);
  const [sessions, setSessions]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [stage, setStage]           = useState('');
  const [progress, setProgress]     = useState(0);
  const [error, setError]           = useState('');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showTypeModal, setShowTypeModal]     = useState(false);

  useEffect(() => {
    api.get('/sessions').then(r => setSessions(r.data)).catch(() => {});
  }, []);

  // Close modals on outside click
  useEffect(() => {
    const handler = (e) => {
      if (showCourseModal && courseModalRef.current && !courseModalRef.current.contains(e.target)) setShowCourseModal(false);
      if (showTypeModal  && typeModalRef.current  && !typeModalRef.current.contains(e.target))  setShowTypeModal(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCourseModal, showTypeModal]);

  const addFiles = (incoming) => {
    setError('');
    const valid = [], errs = [];
    for (const f of incoming) {
      if (!ACCEPTED_EXT.some(e => f.name.toLowerCase().endsWith(e))) {
        errs.push(`"${f.name}" — only PDF and PowerPoint supported.`); continue;
      }
      if (f.size > 20 * 1024 * 1024) { errs.push(`"${f.name}" exceeds 20 MB.`); continue; }
      if (!files.find(x => x.name === f.name)) valid.push(f);
    }
    if (errs.length) setError(errs.join('\n'));
    if (valid.length) setFiles(p => [...p, ...valid]);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleGenerate = async () => {
    if (files.length === 0) { setError('Please add at least one file before generating.'); return; }
    if (!courseName.trim()) { setError('Please set a course name — click the Course button.'); return; }
    setError(''); setLoading(true);

    try {
      setStage('uploading'); setProgress(20);
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('courseName', courseName.trim());
      formData.append('mode', mode);
      if (context.trim()) formData.append('context', context.trim());

      const { data: uploadData } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProgress(55);

      setStage('generating'); setProgress(65);
      await api.post('/generate', { sessionId: uploadData.sessionId, count });
      setProgress(100);

      navigate(`/session/${uploadData.sessionId}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong.');
      setLoading(false); setStage(''); setProgress(0);
    }
  };

  const selectedMode = MODES.find(m => m.id === mode);
  const formatDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const modeBadge  = { mcq:'badge-mcq', essay:'badge-essay', short_answer:'badge-short-answer', mixed:'badge-mixed' };

  // Personalized greeting — extract & capitalize first name
  const rawName =
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0]?.split(/[._\-+]/)[0] ||
    'there';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="app-shell">
      <Sidebar user={user} sessions={sessions} theme={theme} onThemeToggle={onThemeToggle} collapsed={collapsed} onCollapse={onCollapse} />

      <main className="main-content">
        <div className="arena-center">

          {/* Hero text */}
          <div className="arena-hero">
            <h1 className="arena-greeting">{timeGreeting}, {firstName}.</h1>
            <p className="arena-subtext">Generate exam questions from your study material.</p>
          </div>

          {/* Input Card */}
          <div
            className={`arena-card ${dragging ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {/* File chips row */}
            {files.length > 0 && (
              <div className="arena-files-row">
                {files.map(f => (
                  <div key={f.name} className="arena-file-chip">
                    <span>{fileIcon(f.name)}</span>
                    <span className="arena-file-chip-name">{f.name}</span>
                    <span className="arena-file-chip-size">{formatSize(f.size)}</span>
                    <button onClick={() => setFiles(p => p.filter(x => x.name !== f.name))}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Text area */}
            <textarea
              className="arena-textarea"
              placeholder="Describe what to focus on, or add context for the AI… (optional)"
              value={context}
              onChange={e => setContext(e.target.value)}
              rows={3}
            />

            {/* Progress bar */}
            {loading && (
              <div className="arena-progress">
                <div className="arena-progress-bar" style={{ width: `${progress}%` }} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="arena-error">⚠️ {error}</div>
            )}

            {/* Toolbar */}
            <div className="arena-toolbar">
              {/* Left buttons */}
              <div className="arena-toolbar-left">

                {/* Add files */}
                <input ref={fileInputRef} type="file" accept=".pdf,.ppt,.pptx" multiple
                  style={{ display: 'none' }} onChange={e => addFiles(Array.from(e.target.files))} />
                <button className="arena-tool-btn" onClick={() => fileInputRef.current.click()} title="Add files">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  <span>Add files</span>
                  {files.length > 0 && <span className="arena-tool-badge">{files.length}</span>}
                </button>

                {/* Course & Questions */}
                <div className="arena-popover-wrap" ref={courseModalRef}>
                  <button
                    className={`arena-tool-btn ${courseName ? 'arena-tool-btn--active' : ''}`}
                    onClick={() => { setShowCourseModal(v => !v); setShowTypeModal(false); }}
                    title="Set course and question count"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    <span>{courseName || 'Course & Questions'}</span>
                    {count !== 10 && courseName && <span className="arena-tool-meta">· {count}Q</span>}
                  </button>
                  {showCourseModal && (
                    <div className="arena-popover">
                      <div className="arena-popover-title">Course Settings</div>
                      <label>Course Name</label>
                      <input
                        type="text" className="input" autoFocus
                        placeholder="e.g. Networking & System Admin"
                        value={courseName}
                        onChange={e => setCourseName(e.target.value)}
                      />
                      <label style={{ marginTop: 14 }}>Number of Questions</label>
                      <div className="arena-count-row">
                        {[5, 10, 15, 20, 30].map(n => (
                          <button key={n}
                            className={`arena-count-btn ${count === n ? 'active' : ''}`}
                            onClick={() => setCount(n)}
                          >{n}</button>
                        ))}
                      </div>
                      <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}
                        onClick={() => setShowCourseModal(false)}>
                        Done
                      </button>
                    </div>
                  )}
                </div>

                {/* Question Type */}
                <div className="arena-popover-wrap" ref={typeModalRef}>
                  <button
                    className="arena-tool-btn arena-tool-btn--active"
                    onClick={() => { setShowTypeModal(v => !v); setShowCourseModal(false); }}
                    title="Select question type"
                  >
                    <span>{selectedMode.icon}</span>
                    <span>{selectedMode.label}</span>
                  </button>
                  {showTypeModal && (
                    <div className="arena-popover">
                      <div className="arena-popover-title">Question Type</div>
                      {MODES.map(m => (
                        <button key={m.id}
                          className={`arena-type-option ${mode === m.id ? 'active' : ''}`}
                          onClick={() => { setMode(m.id); setShowTypeModal(false); }}
                        >
                          <span className="arena-type-icon">{m.icon}</span>
                          <div>
                            <div className="arena-type-label">{m.label}</div>
                            <div className="arena-type-desc">{m.desc}</div>
                          </div>
                          {mode === m.id && <span style={{ marginLeft:'auto' }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: send button */}
              <button
                id="generate-btn"
                className={`arena-send-btn ${loading ? 'loading' : ''}`}
                onClick={handleGenerate}
                disabled={loading}
                title="Generate questions"
              >
                {loading
                  ? <span className="spinner" style={{ width:16, height:16, borderWidth:2 }} />
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Status line */}
          {loading && (
            <p className="arena-status-line">
              {stage === 'uploading' ? `📤 Uploading ${files.length} file${files.length>1?'s':''}…` : '🤖 AI is generating your questions…'}
            </p>
          )}

          {/* Folder grid sessions */}
          {sessions.length > 0 && (
            <div className="session-folders">
              <div className="session-folders-title">Recent Sessions</div>
              <div className="session-folders-grid">
                {sessions.slice(0, 8).map(s => (
                  <FolderCard key={s.id} session={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
