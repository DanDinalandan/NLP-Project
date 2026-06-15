import { useState, useRef } from "react";
import { Ic } from "../../../components/ui/Icons";
import { useStore } from "../../../store/useStore.js";
import { outputsApi } from "../../../api/outputs.js";

export function Flashcards() {
  const activeFolderId       = useStore(s => s.activeFolderId);
  const flashcardsMap        = useStore(s => s.flashcards);
  const rawCards             = flashcardsMap[activeFolderId] ?? [];
  const markCardMastered     = useStore(s => s.markCardMastered);
  const markCardReviewed     = useStore(s => s.markCardReviewed);
  const completeReviewSession = useStore(s => s.completeReviewSession);

  const cards = rawCards.map(c => ({ id: c.id, term: c.front, def: c.back }));

  const [idx,       setIdx]      = useState(0);
  const [flip,      setFlip]     = useState(false);
  const [assessed,  setAssessed] = useState({});
  const [sessionDone, setSessionDone] = useState(false);
  const [editing,   setEditing]  = useState(false);
  const [editFront, setEditFront]= useState('');
  const [editBack,  setEditBack] = useState('');
  const [saving,    setSaving]   = useState(false);

  const card = cards[idx];

  const startEdit = () => {
    setEditFront(card.term);
    setEditBack(card.def);
    setEditing(true);
    setFlip(false);
  };

  const saveEdit = async () => {
    if (!card || saving) return;
    setSaving(true);
    try {
      await outputsApi.updateFlashcard(card.id, { front: editFront.trim(), back: editBack.trim() });
      // Update local store
      useStore.setState(s => ({
        flashcards: {
          ...s.flashcards,
          [activeFolderId]: (s.flashcards[activeFolderId] ?? []).map(c =>
            c.id === card.id ? { ...c, front: editFront.trim(), back: editBack.trim() } : c
          ),
        },
      }));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

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

      {editing ? (
        <div className="fc-edit-form">
          <label className="fc-edit-label">Front (term)</label>
          <textarea className="fc-edit-input" value={editFront}
            onChange={e => setEditFront(e.target.value)} rows={2} />
          <label className="fc-edit-label" style={{ marginTop: 8 }}>Back (definition)</label>
          <textarea className="fc-edit-input" value={editBack}
            onChange={e => setEditBack(e.target.value)} rows={3} />
          <div className="fc-edit-actions">
            <button className="fc-edit-save" onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="fc-edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
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
          <button className="fc-edit-btn" onClick={startEdit} title="Edit this card">
            <Ic n="edit" s={14} />
          </button>
        </div>
      )}

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
        Self-rating feeds your spaced repetition queue · "Know it" awards XP
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
