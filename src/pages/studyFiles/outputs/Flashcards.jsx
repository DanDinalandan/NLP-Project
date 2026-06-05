import { useState } from "react";
import { Ic } from "../../../components/ui/Icons";
import { FLASHCARDS } from "../../../data/mockData";

export function Flashcards() {
  const [idx, setIdx]   = useState(0);
  const [flip, setFlip] = useState(false);
  const card = FLASHCARDS[idx];

  const go = d => {
    setIdx(i => Math.max(0, Math.min(FLASHCARDS.length - 1, i + d)));
    setFlip(false);
  };

  return (
    <div className="fc-viewer">
      <div className="fc-header">
        <div className="fc-title">Cell Structure Flashcards</div>
        <div className="fc-counter">
          <span style={{ fontWeight: 600 }}>{idx + 1} / {FLASHCARDS.length}</span>
          <ProgressStrip pct={((idx + 1) / FLASHCARDS.length) * 100} />
        </div>
      </div>

      <div onClick={() => setFlip(f => !f)} className="fc-card">
        {!flip ? (
          <>
            <div className="slabel fc-card-slabel">Term</div>
            <div className="fc-term">{card?.term || "Unknown Term"}</div>
            <div className="fc-sub">{card?.sub}</div>
            <FlipHint />
          </>
        ) : (
          <>
            <div className="slabel fc-card-slabel">Definition</div>
            <div className="fc-def">{card?.def || "Unknown Definition"}</div>
            <FlipHint label="Tap to flip back" />
          </>
        )}
      </div>

      <div className="fc-nav">
        <button className="fc-nav-btn" onClick={() => go(-1)} disabled={idx === 0}>
          <Ic n="cL" s={16} />
        </button>
        <button onClick={() => setFlip(f => !f)} className="fc-flip-btn">
          Flip card
        </button>
        <button className="fc-nav-btn" onClick={() => go(1)} disabled={idx === FLASHCARDS.length - 1}>
          <Ic n="cR" s={16} />
        </button>
      </div>

      <div className="fc-assess">
        {ASSESS_OPTS.map(r => (
          <button key={r.l} className={`assess-btn ${r.class}`}>
            {r.i && <Ic n={r.i} s={13} />}{r.l}
          </button>
        ))}
      </div>
      <div className="fc-hint-text">Self-rating feeds your spaced repetition queue</div>
    </div>
  );
}

const ASSESS_OPTS = [
  { l: "Know it",      i: "check", class: "assess-know"   },
  { l: "Almost",       i: null,    class: "assess-almost"  },
  { l: "Review again", i: "flip",  class: "assess-review"  },
];

function FlipHint({ label = "Tap to reveal definition" }) {
  return (
    <div className="fc-flip-hint">
      <Ic n="flip" s={12} /> {label}
    </div>
  );
}

function ProgressStrip({ pct }) {
  return (
    <div className="fc-progress">
      <div className="fc-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}