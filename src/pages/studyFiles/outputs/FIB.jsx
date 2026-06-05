import { useState } from "react";
import { Btn } from "../../../components/ui/Btn";
import { Ic } from "../../../components/ui/Icons";
import { FIB_DATA } from "../../../data/mockData";

export function FillInBlanks() {
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState("");
  const [showHint, setShowHint] = useState(false);
  const q = FIB_DATA[idx];
  const pct = ((idx + 1) / FIB_DATA.length) * 100;

  const next = () => { setIdx(i => Math.min(FIB_DATA.length - 1, i + 1)); setAns(""); setShowHint(false); };
  const prev = () => { setIdx(i => Math.max(0, i - 1)); setAns(""); setShowHint(false); };

  return (
    <div>
      <div className="mcq-header">
        <div className="output-title">Fill-in-the-blanks</div>
        <div className="flex-center row-gap-10">
          <div className="badge badge-green">Score: 1 / {FIB_DATA.length}</div>
          <div className="output-counter">{idx + 1} / {FIB_DATA.length}</div>
        </div>
      </div>

      <div className="progress-track-full gap-20">
        <div className="fc-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="fib-sentence">
        {q.before}
        <span className="fib-blank">{ans || "____________"}</span>
        {q.after}
      </div>

      <div className="fib-input-row">
        <input
          className="fib-input"
          placeholder="Type your answer here..."
          value={ans}
          onChange={e => setAns(e.target.value)}
        />
        <Btn variant="primary">Check →</Btn>
      </div>

      {showHint ? (
        <div className="hint-card gap-20">
          <div className="hint-text">
            <Ic n="hint" s={15} /> {q.hint}
          </div>
          <button className="hint-penalty">Use hint (-5 XP)</button>
        </div>
      ) : (
        <div className="gap-20">
          <Btn variant="soft" onClick={() => setShowHint(true)}><Ic n="hint" s={14} /> Need a hint?</Btn>
        </div>
      )}

      <div className="flex-end-row">
        <Btn variant="secondary" onClick={prev}><Ic n="cL" s={14} /> Previous</Btn>
        <Btn variant="primary" onClick={next}>Next question →</Btn>
      </div>
    </div>
  );
}