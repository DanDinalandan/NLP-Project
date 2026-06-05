import { useState } from "react";
import { Btn } from "../../../components/ui/Btn";
import { Ic } from "../../../components/ui/Icons";
import { MCQ_DATA } from "../../../data/mockData";

export function MCQ() {
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState(null);
  const [sub, setSub] = useState(false);
  const q = MCQ_DATA[idx];
  const pct = ((idx + 1) / MCQ_DATA.length) * 100;

  const next = () => { setIdx(i => Math.min(MCQ_DATA.length - 1, i + 1)); setSel(null); setSub(false); };
  const prev = () => { setIdx(i => Math.max(0, i - 1)); setSel(null); setSub(false); };

  return (
    <div>
      <div className="mcq-header">
        <div className="output-title">MCQ Quiz</div>
        <div className="flex-center row-gap-10">
          <div className="mcq-timer"><Ic n="clock" s={13} /> 10:05</div>
          <div className="output-counter">Q {idx + 1} / {MCQ_DATA.length}</div>
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
            else if (i === sel) statusClass = "wrong";
            else statusClass = "disabled";
          } else if (sel === i) {
            statusClass = "selected";
          }

          return (
            <div 
              key={i} 
              className={`choice-row ${statusClass}`} 
              onClick={() => !sub && setSel(i)}
            >
              <div className="choice-letter">{String.fromCharCode(65 + i)}</div>
              <div>{optText}</div>
            </div>
          );
        })}
      </div>

      <div className="flex-end-row">
        <Btn variant="secondary" onClick={prev}><Ic n="cL" s={14} /> Previous</Btn>
        {!sub 
          ? <Btn variant="primary" onClick={() => sel !== null && setSub(true)}>Submit answer →</Btn>
          : <Btn variant="primary" onClick={next}>Next question →</Btn>
        }
      </div>
    </div>
  );
}