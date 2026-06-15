import { useState } from "react";
import { Btn }      from "../../../components/ui/Btn";
import { Ic }       from "../../../components/ui/Icons";
import { useStore } from "../../../store/useStore.js";

const LETTER_TO_IDX = { A: 0, B: 1, C: 2, D: 3 };

export function MCQ({ onBack }) {
  const activeFolderId        = useStore(s => s.activeFolderId);
  const mcqsMap               = useStore(s => s.mcqs);
  const rawMcqs               = mcqsMap[activeFolderId] ?? [];
  const markMCQResult         = useStore(s => s.markMCQResult);
  const completeReviewSession = useStore(s => s.completeReviewSession);

  const questions = rawMcqs.map(m => ({
    id:          m.id,
    q:           m.question,
    opts:        m.options,
    correct:     LETTER_TO_IDX[m.correct_answer] ?? 0,
    explanation: m.explanation,
  }));

  // Track every answer: { [questionId]: { sel: i, isCorrect: bool } }
  const [answers,     setAnswers]     = useState({});
  const [idx,         setIdx]         = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  const q          = questions[idx];
  const qAns       = q ? answers[q.id] : null;
  const sub        = !!qAns;                        // already answered this question
  const sel        = qAns?.sel ?? null;
  const pct        = questions.length ? ((idx + 1) / questions.length) * 100 : 0;
  const isLast     = idx === questions.length - 1;
  const correctCount = Object.values(answers).filter(a => a.isCorrect).length;

  const handleSelect = (i) => {
    if (sub) return;
    const isCorrect  = i === q.correct;
    markMCQResult(activeFolderId, q.id, isCorrect);
    const newAnswers = { ...answers, [q.id]: { sel: i, isCorrect } };
    setAnswers(newAnswers);
    const allDone = questions.every(qn => newAnswers[qn.id] !== undefined);
    if (allDone && !sessionDone) {
      setSessionDone(true);
      completeReviewSession(activeFolderId);
    }
  };

  const next = () => setIdx(i => Math.min(questions.length - 1, i + 1));
  const prev = () => setIdx(i => Math.max(0, i - 1));

  if (!questions.length) {
    return (
      <div>
        <div className="mcq-header"><div className="output-title">MCQ Quiz</div></div>
        <div className="card mcq-question-card gap-14">
          <div className="mcq-question-text" style={{ opacity: 0.5 }}>No questions yet. Generate outputs first.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Score popup ──────────────────────────────────────────── */}
      {sessionDone && (
        <div className="quiz-done-overlay">
          <div className="quiz-done-modal">
            <div className="quiz-done-emoji">
              {correctCount === questions.length ? '🏆' : correctCount >= questions.length * 0.7 ? '🎉' : '📚'}
            </div>
            <div className="quiz-done-title">Quiz Complete!</div>
            <div className="quiz-done-score">
              {correctCount}<span className="quiz-done-denom"> / {questions.length}</span>
            </div>
            <div className="quiz-done-sub">
              {correctCount === questions.length
                ? 'Perfect score! Great job.'
                : correctCount >= questions.length * 0.7
                  ? 'Good work — keep it up!'
                  : 'Keep reviewing and try again.'}
            </div>
            <Btn variant="primary" onClick={onBack}>← Back to Folder</Btn>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mcq-header">
        <div className="output-title">MCQ Quiz</div>
        <div className="flex-center row-gap-10">
          <div className="output-counter">Q {idx + 1} / {questions.length}</div>
          {Object.keys(answers).length > 0 && (
            <div className="mcq-correct-badge">{correctCount} correct</div>
          )}
        </div>
      </div>

      <div className="progress-track-full gap-20">
        <div className="fc-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* ── Question ─────────────────────────────────────────────── */}
      <div className="card mcq-question-card gap-14">
        <div className="slabel gap-8">Question {idx + 1}</div>
        <div className="mcq-question-text">{q.q}</div>
      </div>

      {/* ── Choices — click to auto-submit ───────────────────────── */}
      <div className="gap-20">
        {q.opts.map((opt, i) => {
          const optText = typeof opt === 'object' && opt !== null ? opt.text : opt;
          let statusClass = "";
          if (sub) {
            if (i === q.correct)  statusClass = "correct";
            else if (i === sel)   statusClass = "wrong";
            else                  statusClass = "disabled";
          }
          return (
            <div
              key={i}
              className={`choice-row ${statusClass}`}
              onClick={() => handleSelect(i)}
              style={{ cursor: sub ? 'default' : 'pointer' }}
            >
              <div className="choice-letter">{String.fromCharCode(65 + i)}</div>
              <div>{optText}</div>
            </div>
          );
        })}
      </div>

      {/* ── Explanation ──────────────────────────────────────────── */}
      {sub && q.explanation && (
        <div className="mcq-explanation">
          <Ic n="hint" s={14} /> {q.explanation}
        </div>
      )}

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <div className="flex-end-row">
        <Btn variant="secondary" onClick={prev} disabled={idx === 0}>
          <Ic n="cL" s={14} /> Previous
        </Btn>
        {sub && (
          isLast
            ? <Btn variant="primary" onClick={() => setSessionDone(true)}>See results →</Btn>
            : <Btn variant="primary" onClick={next}>Next question →</Btn>
        )}
      </div>
    </div>
  );
}
