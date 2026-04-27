import { useState } from 'react';

const TYPE_LABEL = { mcq: 'MCQ', essay: 'Essay', short_answer: 'Short Answer' };

/* ── MCQ Interactive Card ── */
function MCQCard({ options, answer, explanation }) {
  const [selected, setSelected] = useState(null);

  const pick = (key) => {
    if (selected) return; // locked after first pick
    setSelected(key);
  };

  const answered = selected !== null;

  return (
    <>
      <div className="qc-options">
        {Object.entries(options).map(([key, val]) => {
          const isCorrect  = key === answer;
          const isSelected = key === selected;

          let mod = '';
          if (answered) {
            if (isCorrect)            mod = 'qc-option--correct';
            else if (isSelected)      mod = 'qc-option--wrong';
            else                      mod = 'qc-option--dim';
          }

          return (
            <button
              key={key}
              className={`qc-option ${mod}`}
              onClick={() => pick(key)}
              disabled={answered}
            >
              <span className="qc-option-key">{key}</span>
              <span className="qc-option-text">{val}</span>
              {answered && isCorrect  && <span className="qc-badge qc-badge--ok">✓ Correct</span>}
              {answered && isSelected && !isCorrect && <span className="qc-badge qc-badge--no">✗ Wrong</span>}
            </button>
          );
        })}
      </div>

      {answered && explanation && (
        <div className="qc-explanation">
          <span className="qc-explanation-icon">💡</span>
          <span>{explanation}</span>
        </div>
      )}

      {answered && selected !== answer && (
        <div className="qc-correct-note">
          The correct answer is <strong>{answer}</strong>: {options[answer]}
        </div>
      )}
    </>
  );
}

/* ── Essay / Short Answer Card ── */
function OpenCard({ answer, explanation }) {
  const [shown, setShown] = useState(false);
  return (
    <>
      {!shown ? (
        <button className="qc-reveal-btn" onClick={() => setShown(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Show model answer
        </button>
      ) : (
        <div className="qc-answer-box">
          <div className="qc-answer-label">Model Answer</div>
          <p className="qc-answer-text">{answer}</p>
          {explanation && (
            <div className="qc-explanation" style={{ marginTop: 12 }}>
              <span className="qc-explanation-icon">💡</span>
              <span>{explanation}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ── Main Export ── */
export default function QuestionCard({ question, index }) {
  const { type, question: qText, options, answer, explanation } = question;

  return (
    <div className="qc-card">
      {/* Header row */}
      <div className="qc-header">
        <span className="qc-num">{index + 1}</span>
        <span className="qc-type-pill">{TYPE_LABEL[type] || type}</span>
      </div>

      {/* Question text */}
      <p className="qc-text">{qText}</p>

      {/* Body by type */}
      {type === 'mcq' && options
        ? <MCQCard options={options} answer={answer} explanation={explanation} />
        : <OpenCard answer={answer} explanation={explanation} />
      }
    </div>
  );
}
