import { useState } from "react";
import { Btn } from "../../../components/ui/Btn";
import { Ic } from "../../../components/ui/Icons";
import { useStore } from "../../../store/useStore.js";

const LETTER_TO_IDX = { A: 0, B: 1, C: 2, D: 3 };

export function MCQ() {
  const activeFolderId       = useStore(s => s.activeFolderId);
  const rawMcqs              = useStore(s => s.mcqs[activeFolderId] ?? []);
  const markMCQResult        = useStore(s => s.markMCQResult);
  const completeReviewSession = useStore(s => s.completeReviewSession);

  const questions = rawMcqs.map(m => ({
    id: m.id,
    q: m.question,
    opts: m.options,
    correct: LETTER_TO_IDX[m.correct_answer] ?? 0,
    explanation: m.explanation,
  }));

  const [idx,         setIdx]         = useState(0);
  const [sel,         setSel]         = useState(null);
  const [sub,         setSub]         = useState(false);
  // { [questionId]: boolean }  — answered questions in this session
  const [answered,    setAnswered]    = useState({});
  const [sessionDone, setSessionDone] = useState(false);

  const q   = questions[idx];
  const pct = questions.length ? ((idx + 1) / questions.length) * 100 : 0;

  const next = () => { setIdx(i => Math.min(questions.length - 1, i + 1)); setSel(null); setSub(false); };
  const prev = () => { setIdx(i => Math.max(0, i - 1)); setSel(null); setSub(false); };

  const handleSubmit = () => {
    if (sel === null || sub) return;
    const isCorrect = sel === q.correct;
    markMCQResult(activeFolderId, q.id, isCorrect);

    const newAnswered = { ...answered, [q.id]: isCorrect };
    setAnswered(newAnswered);
    setSub(true);

    // Session complete when every question has been answered
    const allAnswered = questions.every(qn => newAnswered[qn.id] !== undefined);
    if (allAnswered && !sessionDone) {
      setSessionDone(true);
      completeReviewSession(activeFolderId);
    }
  };

  const correctCount = Object.values(answered).filter(Boolean).length;

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
    <div>
      <div className="mcq-header">
        <div className="output-title">MCQ Quiz</div>
        <div className="flex-center row-gap-10">
          <div className="mcq-timer"><Ic n="clock" s={13} /> 10:05</div>
          <div className="output-counter">Q {idx + 1} / {questions.length}</div>
          {correctCount > 0 && (
            <div className="mcq-correct-badge">{correctCount} correct</div>
          )}
        </div>
      </div>

      <div className="progress-track-full gap-20">
        <div className="fc-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="card mcq-question-card gap-14">
        <div className="slabel gap-8">Question {idx + 1}</div>
        <div className="mcq-question-text">{q.q}</div>
      </div>

      <div className="gap-20">
        {q.opts.map((optText, i) => {
          let statusClass = "";
          if (sub) {
            if (i === q.correct) statusClass = "correct";
            else if (i === sel)  statusClass = "wrong";
            else                  statusClass = "disabled";
          } else if (sel === i) {
            statusClass = "selected";
          }
          return (
            <div key={i} className={`choice-row ${statusClass}`} onClick={() => !sub && setSel(i)}>
              <div className="choice-letter">{String.fromCharCode(65 + i)}</div>
              <div>{optText}</div>
            </div>
          );
        })}
      </div>

      {sub && q.explanation && (
        <div className="mcq-explanation">
          <Ic n="hint" s={14} /> {q.explanation}
        </div>
      )}

      {sessionDone && (
        <div className="fc-session-done">
          Quiz complete — {correctCount}/{questions.length} correct
        </div>
      )}

      <div className="flex-end-row">
        <Btn variant="secondary" onClick={prev}><Ic n="cL" s={14} /> Previous</Btn>
        {!sub
          ? <Btn variant="primary" onClick={handleSubmit} disabled={sel === null}>Submit answer →</Btn>
          : <Btn variant="primary" onClick={next}>Next question →</Btn>
        }
      </div>
    </div>
  );
}
