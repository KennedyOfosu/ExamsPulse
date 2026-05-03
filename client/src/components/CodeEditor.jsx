import { useState, useEffect, useRef } from 'react';

/**
 * A lightweight VS Code-style code editor with line numbering.
 */
export default function CodeEditor({ value, onChange, placeholder = 'Write your code here...', disabled = false }) {
  const lineCount = value.split('\n').length;
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className={`code-editor-container ${disabled ? 'editor-disabled' : ''}`}>
      <div className="code-editor-header">
        <div className="editor-dots">
          <span className="dot dot-red"></span>
          <span className="dot dot-yellow"></span>
          <span className="dot dot-green"></span>
        </div>
        <span className="editor-lang">JAVASCRIPT</span>
      </div>
      <div className="code-editor-body">
        <div className="line-numbers" ref={lineNumbersRef}>
          {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
            <div key={i} className="line-number">{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="code-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck="false"
        />
      </div>
    </div>
  );
}
