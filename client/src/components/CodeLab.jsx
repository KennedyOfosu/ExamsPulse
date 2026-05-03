import { useState, useEffect, lazy, Suspense } from 'react';

// Lazy-load the Monaco Editor to avoid build-time Node.js conflicts
const Editor = lazy(() => import('@monaco-editor/react'));

/**
 * CodeLab — A VS Code-style editor using Monaco.
 * Supports syntax highlighting, language selection, and live preview.
 */
export default function CodeLab({ value, onChange, disabled = false }) {
  const [language, setLanguage] = useState('javascript');
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    if (showPreview && (language === 'html' || language === 'css')) {
      const t = setTimeout(() => setPreviewContent(value), 500);
      return () => clearTimeout(t);
    }
  }, [value, language, showPreview]);

  const languages = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'HTML',       value: 'html' },
    { label: 'CSS',        value: 'css' },
    { label: 'Java',       value: 'java' },
    { label: 'PHP',        value: 'php' },
  ];

  const isWeb = language === 'html' || language === 'css';

  return (
    <div className={`codelab-shell${disabled ? ' codelab-shell--disabled' : ''}`}>

      {/* Toolbar */}
      <div className="codelab-toolbar">
        <div className="codelab-dots">
          <span className="codelab-dot codelab-dot--red" />
          <span className="codelab-dot codelab-dot--yellow" />
          <span className="codelab-dot codelab-dot--green" />
        </div>
        <div className="codelab-toolbar-right">
          <select
            className="codelab-lang-select"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            disabled={disabled}
          >
            {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          {isWeb && (
            <button
              className={`codelab-preview-btn${showPreview ? ' codelab-preview-btn--active' : ''}`}
              onClick={() => setShowPreview(p => !p)}
            >
              {showPreview ? '📝 Editor' : '👁 Preview'}
            </button>
          )}
        </div>
      </div>

      {/* Editor + Preview */}
      <div className={`codelab-body${showPreview ? ' codelab-body--split' : ''}`}>
        <div className="codelab-editor-pane">
          <Suspense fallback={<div className="codelab-loading">Loading editor…</div>}>
            <Editor
              height="100%"
              language={language}
              value={value}
              theme="vs-dark"
              onChange={v => onChange(v || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: disabled,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                wordWrap: 'on',
              }}
            />
          </Suspense>
        </div>

        {showPreview && isWeb && (
          <div className="codelab-preview-pane">
            <div className="codelab-preview-header">Live Output</div>
            <iframe
              title="preview"
              className="codelab-preview-frame"
              srcDoc={
                language === 'html'
                  ? previewContent
                  : `<html><style>${previewContent}</style><body style="padding:24px;font-family:sans-serif"><h2>CSS Preview</h2><p style="color:#666">Your styles are applied here.</p><div style="padding:16px;background:#e0e7ff;border-radius:8px;margin-top:16px">Sample Box</div></body></html>`
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
