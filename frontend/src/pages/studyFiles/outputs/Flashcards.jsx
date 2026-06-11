import { useState } from "react";
import { Ic } from "../../../components/ui/Icons";
import { useStore } from "../../../store/useStore.js";

export function Flashcards() {
  const activeFolderId       = useStore(s => s.activeFolderId);
  const rawCards             = useStore(s => s.flashcards[activeFolderId] ?? []);
  const markCardMastered     = useStore(s => s.markCardMastered);
  const markCardReviewed     = useStore(s => s.markCardReviewed);
  const completeReviewSession = useStore(s => s.completeReviewSession);

  const cards = rawCards.map(c => ({ id: c.id, term: c.front, def: c.back }));

  const [idx,      setIdx]      = useState(0);
  const [flip,     setFlip]     = useState(false);
  // { [cardId]: 'know' | 'almost' | 'review' }
  const [assessed, setAssessed] = useState({});
  // Track whether the session completion achievement was triggered this session
  const [sessionDone, setSessionDone] = useState(false);

  const card = cards[idx];

  const go = d => {
    setIdx(i => Math.max(0, Math.min(cards.length - 1, i + d)));
    setFlip(false);
  };

  const handleAssess = (rating) => {
    if (!card) return;
    const alreadyRated = assessed[card.id];

    setAssessed(prev => ({ ...prev, [card.id]: rating }));

    // Always mark as reviewed (for review_all_terms tracking) on first rating
    if (!alreadyRated) {
      markCardReviewed(activeFolderId, card.id);
    }

    // Mastery XP only from "Know it"
    if (rating === 'know') {
      markCardMastered(activeFolderId, card.id);
    }

    // Detect session completion: this is the last card and it's now rated
    const newAssessed = { ...assessed, [card.id]: rating };
    const allRated = cards.every(c => newAssessed[c.id]);
    if (allRated && !sessionDone) {
      setSessionDone(true);
      completeReviewSession(activeFolderId);
    }
  };

  if (!cards.length) {
    return (
      <div className="fc-viewer">
        <div className="fc-header"><div className="fc-title">Flashcards</div></div>
        <div className="fc-card" style={{ justifyContent: 'center' }}>
          <div className="fc-term" style={{ opacity: 0.5 }}>No flashcards yet. Generate outputs first.</div>
        </div>
      </div>
    );
  }

  const knownCount = Object.values(assessed).filter(v => v === 'know').length;
  const ratedCount = Object.keys(assessed).length;
  const knownPct   = cards.length > 0 ? Math.round((knownCount / cards.length) * 100) : 0;

  return (
    <div className="fc-viewer">
      <div className="fc-header">
        <div className="fc-title">Flashcards</div>
        <div className="fc-counter">
          <span style={{ fontWeight: 600 }}>{idx + 1} / {cards.length}</span>
          {knownCount > 0 && (
            <span className="fc-mastered-badge">{knownPct}% known</span>
          )}
          <ProgressStrip pct={((idx + 1) / cards.length) * 100} />
        </div>
      </div>

      <div onClick={() => setFlip(f => !f)} className="fc-card">
        {!flip ? (
          <>
            <div className="slabel fc-card-slabel">Term</div>
            <div className="fc-term">{card?.term || "Unknown Term"}</div>
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
        <button className="fc-nav-btn" onClick={() => go(1)} disabled={idx === cards.length - 1}>
          <Ic n="cR" s={16} />
        </button>
      </div>

      <div className="fc-assess">
        {ASSESS_OPTS.map(r => {
          const isSelected = assessed[card?.id] === r.rating;
          return (
            <button
              key={r.l}
              className={`assess-btn ${r.class}${isSelected ? ' assess-selected' : ''}`}
              onClick={() => handleAssess(r.rating)}
            >
              {r.i && <Ic n={r.i} s={13} />}{r.l}
            </button>
          );
        })}
      </div>

      {sessionDone && (
        <div className="fc-session-done">
          Session complete — {knownCount}/{cards.length} known ({knownPct}%)
        </div>
      )}
      <div className="fc-hint-text">
        Self-rating feeds your spaced repetition queue · "Know it" awards XP (requires internet)
      </div>
    </div>
  );
}

const ASSESS_OPTS = [
  { l: "Know it",      i: "check", class: "assess-know",   rating: "know"   },
  { l: "Almost",       i: null,    class: "assess-almost",  rating: "almost" },
  { l: "Review again", i: "flip",  class: "assess-review",  rating: "review" },
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
