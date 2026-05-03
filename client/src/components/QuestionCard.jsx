import { useState } from 'react';
import api from '../lib/api.js';

const TYPE_LABEL = { mcq: 'MCQ', essay: 'Essay', short_answer: 'Short Answer' };

/* ─────────────────────────────────────────────────────
   MCQCard — used inside the full MCQ quiz view.
   Accepts:
     selected   : key chosen by user (or null)
     revealed   : whether answers are revealed (after Submit All)
     onSelect   : (key) => void
─────────────────────────────────────────────────────── */
export function MCQCard({ question, index, selected, revealed, onSelect, answer, options, explanation }) {
  return (
    <div className="qc-card">
      <div className="qc-header">
        <span className="qc-num">{index + 1}</span>
        <span className="qc-type-pill">MCQ</span>
        {revealed && (
          selected === answer
            ? <span className="qc-result-pill qc-result-pill--ok">✓ Correct</span>
            : <span className="qc-result-pill qc-result-pill--no">✗ Wrong</span>
        )}
      </div>

      <p className="qc-text">{question}</p>

      <div className="qc-options">
        {Object.entries(options).map(([key, val]) => {
          const isCorrect  = key === answer;
          const isSelected = key === selected;
          let mod = '';
          if (revealed) {
            if (isCorrect)          mod = 'qc-option--correct';
            else if (isSelected)    mod = 'qc-option--wrong';
            else                    mod = 'qc-option--dim';
          } else if (isSelected) {
            mod = 'qc-option--selected';
          }
          return (
            <button
              key={key}
              className={`qc-option ${mod}`}
              onClick={() => !revealed && onSelect(key)}
              disabled={revealed}
            >
              <span className="qc-option-key">{key}</span>
              <span className="qc-option-text">{val}</span>
              {revealed && isCorrect  && <span className="qc-badge qc-badge--ok">✓ Correct</span>}
              {revealed && isSelected && !isCorrect && <span className="qc-badge qc-badge--no">✗ Wrong</span>}
            </button>
          );
        })}
      </div>

      {revealed && explanation && (
        <div className="qc-explanation">
          <span className="qc-explanation-icon">💡</span>
          <span>{explanation}</span>
        </div>
      )}

      {revealed && selected !== answer && (
        <div className="qc-correct-note">
          Correct answer: <strong>{answer}</strong> — {options[answer]}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   OpenCard — one at a time stepper for short/essay.
   Props:
     question     : { type, question, answer, explanation }
     index        : display number (1-based)
     total        : total open questions
     onNext       : () => void — called after grading to advance
─────────────────────────────────────────────────────── */
export function OpenCard({ question: q, index, total, onNext }) {
  const [draft, setDraft]       = useState('');
  const [grading, setGrading]   = useState(false);
  const [result, setResult]     = useState(null); // { score, feedback, similarity }
  const [error, setError]       = useState('');

  const isLast = index === total;

  const handleCheck = async () => {
    if (!draft.trim()) return;
    setGrading(true);
    setError('');
    try {
      const res = await api.post('/grade', {
        question:      q.question,
        modelAnswer:   q.answer,
        studentAnswer: draft.trim(),
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not grade your answer. Please try again.');
    } finally {
      setGrading(false);
    }
  };

  const scoreConfig = {
    correct:   { label: '✓ Correct',        cls: 'grade-correct'   },
    partial:   { label: '◑ Partially Correct', cls: 'grade-partial' },
    incorrect: { label: '✗ Incorrect',       cls: 'grade-incorrect' },
  };

  return (
    <div className="qc-open-shell">

      {/* Progress bar */}
      <div className="qc-stepper-bar">
        <div
          className="qc-stepper-fill"
          style={{ width: `${((index - 1) / total) * 100}%` }}
        />
      </div>
      <p className="qc-stepper-label">Question {index} of {total}</p>

      <div className="qc-card">
        <div className="qc-header">
          <span className="qc-num">{index}</span>
          <span className="qc-type-pill">{TYPE_LABEL[q.type] || q.type}</span>
        </div>

        <p className="qc-text">{q.question}</p>

        {/* Input area (only if not yet graded) */}
        {!result && (
          <>
            <textarea
              className="qc-textarea"
              placeholder={q.type === 'essay'
                ? 'Write your essay answer here…'
                : 'Type your answer here…'}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={q.type === 'essay' ? 6 : 3}
              disabled={grading}
            />
            {error && <p className="qc-grade-error">{error}</p>}
            <button
              className="qc-check-btn"
              onClick={handleCheck}
              disabled={!draft.trim() || grading}
            >
              {grading
                ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}} /> Grading…</>
                : '✦ Check My Answer'}
            </button>
          </>
        )}

        {/* Result panel */}
        {result && (
          <div className={`qc-grade-result ${scoreConfig[result.score]?.cls || ''}`}>
            <div className="qc-grade-header">
              <span className="qc-grade-label">{scoreConfig[result.score]?.label}</span>
              <span className="qc-grade-sim">{result.similarity}% match</span>
            </div>

            {/* Student's answer */}
            <div className="qc-your-answer">
              <div className="qc-answer-label">Your answer</div>
              <p className="qc-answer-text">{draft}</p>
            </div>

            {/* AI feedback */}
            <div className="qc-feedback">
              <span className="qc-explanation-icon">💡</span>
              <span>{result.feedback}</span>
            </div>

            {/* Model answer */}
            <div className="qc-answer-box">
              <div className="qc-answer-label">Model Answer</div>
              <p className="qc-answer-text">{q.answer}</p>
              {q.explanation && (
                <div className="qc-explanation" style={{ marginTop: 10 }}>
                  <span className="qc-explanation-icon">📖</span>
                  <span>{q.explanation}</span>
                </div>
              )}
            </div>

            {/* Next / Finish */}
            <button className="qc-next-btn" onClick={onNext}>
              {isLast ? '🏁 See Results' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Default export kept for backward-compat (not used in
   new Session.jsx, but safe to keep).
─────────────────────────────────────────────────────── */
export default function QuestionCard({ question, index }) {
  const { type, question: qText, options, answer, explanation } = question;
  const [selected, setSelected] = useState(null);
  const [shown, setShown]       = useState(false);

  if (type === 'mcq' && options) {
    return (
      <MCQCard
        question={qText}
        index={index}
        selected={selected}
        revealed={false}
        onSelect={setSelected}
        answer={answer}
        options={options}
        explanation={explanation}
      />
    );
  }
  return null;
}
