import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

/**
 * CodeLab — A premium VS Code-style editor using Monaco.
 * Supports syntax highlighting, language selection, and live preview.
 */
export default function CodeLab({ value, onChange, disabled = false }) {
  const [language, setLanguage] = useState('javascript');
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  // Update preview content when code changes
  useEffect(() => {
    if (showPreview && (language === 'html' || language === 'css')) {
      const timeout = setTimeout(() => {
        setPreviewContent(value);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [value, language, showPreview]);

  const languages = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'Java', value: 'java' },
    { label: 'PHP', value: 'php' },
  ];

  const handleEditorChange = (val) => {
    onChange(val || '');
  };

  const isWeb = language === 'html' || language === 'css';

  return (
    <div className={`flex flex-col border border-border rounded-xl overflow-hidden bg-[#1e1e1e] shadow-lg h-full transition-all ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      
      {/* Toolbar */}
      <div className="bg-[#252526] px-4 py-3 flex items-center justify-between border-b border-[#333]">
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            className="bg-[#3c3c3c] text-[#ccc] border border-[#555] rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer hover:border-primary/50 transition-colors"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={disabled}
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>

          {isWeb && (
            <button 
              className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all border ${
                showPreview 
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-transparent border-[#555] text-[#aaa] hover:text-white hover:border-white'
              }`}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? '📝 Editor' : '👁️ Preview'}
            </button>
          )}
        </div>
      </div>

      <div className={`flex-1 flex overflow-hidden ${showPreview ? 'flex-row' : 'flex-col'}`}>
        <div className="flex-1 h-full min-h-[400px]">
          <Editor
            height="100%"
            language={language}
            value={value}
            theme="vs-dark"
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              lineNumbers: 'on',
              roundedSelection: true,
              scrollBeyondLastLine: false,
              readOnly: disabled,
              automaticLayout: true,
              padding: { top: 20, bottom: 20 },
              cursorStyle: 'line',
              wordWrap: 'on'
            }}
          />
        </div>

        {showPreview && isWeb && (
          <div className="flex-1 bg-white border-l border-[#333] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="bg-gray-100 px-4 py-1.5 border-bottom border-gray-200 flex items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Output</span>
            </div>
            <iframe
              title="preview"
              srcDoc={language === 'html' ? previewContent : `<html><style>${previewContent}</style><body class="p-8"><h1 class="text-2xl font-bold mb-4">CSS Preview</h1><p class="text-gray-600">Your styles are being applied to this preview window.</p><div class="p-4 bg-blue-100 rounded mt-4">Sample Box</div></body></html>`}
              className="flex-1 w-full h-full border-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
