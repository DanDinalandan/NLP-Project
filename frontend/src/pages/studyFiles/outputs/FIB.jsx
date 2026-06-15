import { useState } from "react";
import { Btn }      from "../../../components/ui/Btn";
import { Ic }       from "../../../components/ui/Icons";
import { useStore } from "../../../store/useStore.js";

export function FillInBlanks({ onBack }) {
  const activeFolderId = useStore(s => s.activeFolderId);
  const fibsMap        = useStore(s => s.fibs);
  const fibs           = fibsMap[activeFolderId] ?? [];

  // Track answers per index: { [idx]: { userAns, isCorrect } }
  const [answers,     setAnswers]     = useState({});
  const [idx,         setIdx]         = useState(0);
  const [userAns,     setUserAns]     = useState('');
  const [showHint,    setShowHint]    = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  if (!fibs.length) {
    return (
      <div>
        <div className="mcq-header">
          <div className="output-title">Fill-in-the-Blanks</div>
        </div>
        <div className="empty-outputs" style={{ marginTop: 40 }}>
          <div className="flex-center" style={{ justifyContent: 'center', marginBottom: 10 }}>
            <Ic n="fib" s={32} c="var(--lav)" />
          </div>
          <div className="empty-outputs-title">No fill-in-the-blank questions yet</div>
          <div className="empty-outputs-sub">Generate outputs from an uploaded file to create fill-in-the-blank exercises.</div>
        </div>
      </div>
    );
  }

  const q       = fibs[idx];
  const qAns    = answers[idx];
  const checked = !!qAns;
  const isLast  = idx === fibs.length - 1;
  const pct     = ((idx + 1) / fibs.length) * 100;

  const checkIsCorrect = (ans) =>
    ans.trim().toLowerCase() === q.answer.trim().toLowerCase();

  const handleCheck = () => {
    if (!userAns.trim()) return;
    const isCorrect = checkIsCorrect(userAns);
    setAnswers(prev => ({ ...prev, [idx]: { userAns, isCorrect } }));
    if (isCorrect) { /* no extra state needed */ }
  };

  const handleNext = () => {
    setIdx(i => i + 1);
    setUserAns('');
    setShowHint(false);
  };

  const handlePrev = () => {
    setIdx(i => i - 1);
    // Restore previous answer to input if it exists
    const prev = answers[idx - 1];
    setUserAns(prev?.userAns ?? '');
    setShowHint(false);
  };

  const onKey = (e) => { if (e.key === 'Enter' && !checked) handleCheck(); };

  const correctCount = Object.values(answers).filter(a => a.isCorrect).length;

  const displayAns   = checked ? qAns.userAns   : (userAns || null);
  const displayRight = checked ? qAns.isCorrect  : false;
  const displayWrong = checked ? !qAns.isCorrect : false;

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Score popup ──────────────────────────────────────────── */}
      {sessionDone && (
        <div className="quiz-done-overlay">
          <div className="quiz-done-modal">
            <div className="quiz-done-emoji">
              {correctCount === fibs.length ? '🏆' : correctCount >= fibs.length * 0.7 ? '🎉' : '📚'}
            </div>
            <div className="quiz-done-title">Exercise Complete!</div>
            <div className="quiz-done-score">
              {correctCount}<span className="quiz-done-denom"> / {fibs.length}</span>
            </div>
            <div className="quiz-done-sub">
              {correctCount === fibs.length
                ? 'Perfect! All blanks correct.'
                : correctCount >= fibs.length * 0.7
                  ? 'Good work — keep it up!'
                  : 'Keep reviewing and try again.'}
            </div>
            <Btn variant="primary" onClick={onBack}>← Back to Folder</Btn>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mcq-header">
        <div className="output-title">Fill-in-the-Blanks</div>
        <div className="flex-center row-gap-10">
          <div className="badge badge-green">Score: {correctCount} / {fibs.length}</div>
          <div className="output-counter">{idx + 1} / {fibs.length}</div>
        </div>
      </div>

      <div className="progress-track-full gap-20">
        <div className="fc-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* ── Sentence ─────────────────────────────────────────────── */}
      <div className="fib-sentence">
        {q.before_blank}&nbsp;
        <span className={`fib-blank${displayRight ? ' fib-blank--correct' : displayWrong ? ' fib-blank--wrong' : ''}`}>
          {checked ? q.answer : (displayAns || '____________')}
        </span>
        {q.after_blank ? <>&nbsp;{q.after_blank}</> : null}
      </div>

      {/* ── Input ────────────────────────────────────────────────── */}
      {!checked && (
        <div className="fib-input-row">
          <input
            className="fib-input"
            placeholder="Type your answer…"
            value={userAns}
            onChange={e => setUserAns(e.target.value)}
            onKeyDown={onKey}
            autoFocus
          />
          <Btn variant="primary" onClick={handleCheck} disabled={!userAns.trim()}>
            Check →
          </Btn>
        </div>
      )}

      {/* ── Result ───────────────────────────────────────────────── */}
      {checked && (
        <div className={`fib-result ${displayRight ? 'fib-result--correct' : 'fib-result--wrong'}`}>
          {displayRight
            ? '✓ Correct!'
            : `✗ Correct answer: "${q.answer}"`}
        </div>
      )}

      {/* ── Hint ─────────────────────────────────────────────────── */}
      {q.hint && !checked && (
        showHint
          ? <div className="hint-card gap-20"><div className="hint-text"><Ic n="hint" s={15} /> {q.hint}</div></div>
          : <div className="gap-20"><Btn variant="soft" onClick={() => setShowHint(true)}><Ic n="hint" s={14} /> Need a hint?</Btn></div>
      )}

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <div className="flex-end-row">
        <Btn variant="secondary" onClick={handlePrev} disabled={idx === 0}>
          <Ic n="cL" s={14} /> Previous
        </Btn>
        {checked && (
          isLast
            ? <Btn variant="primary" onClick={() => setSessionDone(true)}>See results →</Btn>
            : <Btn variant="primary" onClick={handleNext}>Next →</Btn>
        )}
      </div>
    </div>
  );
}
