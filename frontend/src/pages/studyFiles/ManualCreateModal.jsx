import { useState } from "react";
import { Btn }       from "../../components/ui/Btn";
import { FormInput } from "../../components/ui/FormInput";
import { Ic }        from "../../components/ui/Icons";
import { outputsApi } from "../../api/outputs.js";
import { useStore }  from "../../store/useStore.js";

const TABS = ['Flashcard', 'MCQ'];
const LETTERS = ['A', 'B', 'C', 'D'];

export function ManualCreateModal({ folder, onClose, onCreated }) {
  const [tab,  setTab]  = useState('Flashcard');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  // Flashcard fields
  const [front, setFront] = useState('');
  const [back,  setBack]  = useState('');

  // MCQ fields
  const [question, setQuestion] = useState('');
  const [opts,     setOpts]     = useState(['', '', '', '']);
  const [correct,  setCorrect]  = useState('A');
  const [expl,     setExpl]     = useState('');

  const loadFolderOutputs = useStore(s => s.loadFolderOutputs);

  const handleSubmitFC = async () => {
    if (!front.trim() || !back.trim()) { setErr('Term and definition are required.'); return; }
    setBusy(true); setErr('');
    try {
      await outputsApi.createFlashcard({ folder_id: folder.id, front: front.trim(), back: back.trim() });
      await loadFolderOutputs(folder.id);
      onCreated?.('Flashcard created');
      setFront(''); setBack('');
    } catch { setErr('Failed to create flashcard.'); }
    finally { setBusy(false); }
  };

  const handleSubmitMCQ = async () => {
    if (!question.trim()) { setErr('Question is required.'); return; }
    if (opts.some(o => !o.trim())) { setErr('All four answer options are required.'); return; }
    setBusy(true); setErr('');
    try {
      await outputsApi.createMcq({
        folder_id: folder.id,
        question:  question.trim(),
        options:   opts.map(o => o.trim()),
        correct_answer: correct,
        explanation: expl.trim(),
      });
      await loadFolderOutputs(folder.id);
      onCreated?.('MCQ created');
      setQuestion(''); setOpts(['', '', '', '']); setCorrect('A'); setExpl('');
    } catch { setErr('Failed to create MCQ.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create manually</div>
          <button className="modal-close" onClick={onClose}><Ic n="x" s={16} /></button>
        </div>

        {/* Tab switcher */}
        <div className="manual-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`manual-tab${tab === t ? ' manual-tab--active' : ''}`}
              onClick={() => { setTab(t); setErr(''); }}
            >
              <Ic n={t === 'Flashcard' ? 'flashcard' : 'mcq'} s={14} />
              {t}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {err && <div className="manual-err gap-14">{err}</div>}

          {tab === 'Flashcard' && (
            <>
              <FormInput label="Term (front)" value={front} onChange={e => setFront(e.target.value)} placeholder="e.g. Photosynthesis" />
              <div style={{ marginTop: 12 }}>
                <label className="slabel gap-6">Definition (back)</label>
                <textarea
                  className="manual-textarea"
                  rows={4}
                  value={back}
                  onChange={e => setBack(e.target.value)}
                  placeholder="e.g. The process by which plants convert light energy into glucose…"
                />
              </div>
              <div className="flex-end-row" style={{ marginTop: 16 }}>
                <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
                <Btn variant="primary" onClick={handleSubmitFC} disabled={busy}>
                  {busy ? 'Saving…' : 'Add flashcard'}
                </Btn>
              </div>
            </>
          )}

          {tab === 'MCQ' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label className="slabel gap-6">Question</label>
                <textarea
                  className="manual-textarea"
                  rows={3}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g. What is the primary product of photosynthesis?"
                />
              </div>

              <div className="slabel gap-8">Answer options</div>
              {opts.map((opt, i) => (
                <div key={i} className="mcq-opt-row">
                  <button
                    className={`mcq-opt-letter${correct === LETTERS[i] ? ' mcq-opt-letter--correct' : ''}`}
                    onClick={() => setCorrect(LETTERS[i])}
                    title="Mark as correct answer"
                  >
                    {LETTERS[i]}
                  </button>
                  <input
                    className="mcq-opt-input"
                    value={opt}
                    onChange={e => {
                      const n = [...opts]; n[i] = e.target.value; setOpts(n);
                    }}
                    placeholder={`Option ${LETTERS[i]}`}
                  />
                </div>
              ))}
              <div className="slabel gap-8" style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>
                Click a letter to mark it as the correct answer (currently: {correct})
              </div>

              <div style={{ marginTop: 12 }}>
                <FormInput
                  label="Explanation (optional)"
                  value={expl}
                  onChange={e => setExpl(e.target.value)}
                  placeholder="Brief explanation shown after answer is submitted"
                />
              </div>

              <div className="flex-end-row" style={{ marginTop: 16 }}>
                <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
                <Btn variant="primary" onClick={handleSubmitMCQ} disabled={busy}>
                  {busy ? 'Saving…' : 'Add question'}
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
