import { useState, useCallback } from "react";
import { Btn }        from "../../components/ui/Btn";
import { Ic }         from "../../components/ui/Icons";
import { outputsApi } from "../../api/outputs.js";
import { useStore }   from "../../store/useStore.js";

const TABS = ["Flashcard", "MCQ", "FIB"];
const LETTERS = ["A", "B", "C", "D"];

function makeFC()  { return { _key: Math.random(), id: null, front: "", back: "", saving: false }; }
function makeMCQ() { return { _key: Math.random(), id: null, question: "", opts: ["", "", "", ""], correct: "A", explanation: "", saving: false }; }
function makeFIB() { return { _key: Math.random(), id: null, before_blank: "", answer: "", after_blank: "", hint: "", saving: false }; }

function optsToObjects(strs) {
  return strs.map((t, i) => ({ label: LETTERS[i], text: t }));
}

export function ManualCreateModal({ folder, onClose, onCreated }) {
  const [tab,  setTab]  = useState("Flashcard");

  const [fcRows,  setFcRows]  = useState(() => Array.from({ length: 5 }, makeFC));
  const [mcqRows, setMcqRows] = useState(() => Array.from({ length: 3 }, makeMCQ));
  const [fibRows, setFibRows] = useState(() => Array.from({ length: 3 }, makeFIB));
  const [fcAddN,  setFcAddN]  = useState(1);
  const [mcqAddN, setMcqAddN] = useState(1);
  const [fibAddN, setFibAddN] = useState(1);

  const loadFolderOutputs = useStore(s => s.loadFolderOutputs);
  const activeFolderId    = useStore(s => s.activeFolderId);

  /* ── helpers ──────────────────────────────────────────────── */
  const updateFC  = (key, p) => setFcRows(rs => rs.map(r => r._key === key ? { ...r, ...p } : r));
  const updateMCQ = (key, p) => setMcqRows(rs => rs.map(r => r._key === key ? { ...r, ...p } : r));
  const updateFIB = (key, p) => setFibRows(rs => rs.map(r => r._key === key ? { ...r, ...p } : r));

  /* ── autosave on blur ─────────────────────────────────────── */
  const saveFC = useCallback(async (row) => {
    if (!row.front.trim() || !row.back.trim()) return;
    updateFC(row._key, { saving: true });
    try {
      if (row.id) {
        await outputsApi.updateFlashcard(row.id, { front: row.front, back: row.back });
        updateFC(row._key, { saving: false });
      } else {
        const c = await outputsApi.createFlashcard({ folder_id: folder.id, front: row.front.trim(), back: row.back.trim() });
        updateFC(row._key, { saving: false, id: c.id, _key: c.id });
      }
    } catch { updateFC(row._key, { saving: false }); }
  }, [folder.id]);

  const saveMCQ = useCallback(async (row) => {
    if (!row.question.trim() || row.opts.some(o => !o.trim())) return;
    updateMCQ(row._key, { saving: true });
    const payload = { question: row.question, options: optsToObjects(row.opts), correct_answer: row.correct, explanation: row.explanation };
    try {
      if (row.id) {
        await outputsApi.updateMcq(row.id, payload);
        updateMCQ(row._key, { saving: false });
      } else {
        const c = await outputsApi.createMcq({ folder_id: folder.id, ...payload });
        updateMCQ(row._key, { saving: false, id: c.id, _key: c.id });
      }
    } catch { updateMCQ(row._key, { saving: false }); }
  }, [folder.id]);

  const saveFIB = useCallback(async (row) => {
    if (!row.answer.trim() || (!row.before_blank.trim() && !row.after_blank.trim())) return;
    updateFIB(row._key, { saving: true });
    const payload = { before_blank: row.before_blank, answer: row.answer, after_blank: row.after_blank, hint: row.hint };
    try {
      if (row.id) {
        await outputsApi.updateFib(row.id, payload);
        updateFIB(row._key, { saving: false });
      } else {
        const c = await outputsApi.createFib({ folder_id: folder.id, ...payload });
        updateFIB(row._key, { saving: false, id: c.id, _key: c.id });
      }
    } catch { updateFIB(row._key, { saving: false }); }
  }, [folder.id]);

  /* ── delete ───────────────────────────────────────────────── */
  const delFC = async (row) => {
    if (row.id) await outputsApi.deleteFlashcard(row.id).catch(() => {});
    setFcRows(rs => rs.filter(r => r._key !== row._key));
  };
  const delMCQ = async (row) => {
    if (row.id) await outputsApi.deleteMcq(row.id).catch(() => {});
    setMcqRows(rs => rs.filter(r => r._key !== row._key));
  };
  const delFIB = async (row) => {
    if (row.id) await outputsApi.deleteFib(row.id).catch(() => {});
    setFibRows(rs => rs.filter(r => r._key !== row._key));
  };

  const handleDone = async () => {
    await loadFolderOutputs(activeFolderId);
    onCreated?.("Cards saved");
  };

  /* ── render ───────────────────────────────────────────────── */
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-box--wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create manually</div>
          <button className="modal-close" onClick={onClose}><Ic n="x" s={16} /></button>
        </div>

        <div className="manual-tabs">
          {TABS.map(t => (
            <button key={t} className={`manual-tab${tab === t ? " manual-tab--active" : ""}`}
              onClick={() => setTab(t)}>
              <Ic n={t === "Flashcard" ? "flashcard" : t === "MCQ" ? "mcq" : "fib"} s={14} /> {t}
            </button>
          ))}
        </div>

        <div className="manual-list-scroll">
          {/* ── Flashcards ──────────────────────────────────── */}
          {tab === "Flashcard" && (
            <>
              {fcRows.map((row, i) => (
                <div key={row._key} className="card-list-item">
                  <div className="card-list-num">{i + 1}</div>
                  <div className="card-list-fields">
                    <textarea className="card-field" rows={2} placeholder="Front (term / question)"
                      value={row.front} onChange={e => updateFC(row._key, { front: e.target.value })}
                      onBlur={() => saveFC(row)} />
                    <textarea className="card-field card-field--back" rows={2} placeholder="Back (definition / answer)"
                      value={row.back} onChange={e => updateFC(row._key, { back: e.target.value })}
                      onBlur={() => saveFC(row)} />
                  </div>
                  <div className="card-list-actions">
                    {row.saving
                      ? <span className="card-save-dot">●</span>
                      : <button className="card-del-btn" onClick={() => delFC(row)}><Ic n="trash" s={13} /></button>}
                  </div>
                </div>
              ))}
              <div className="card-list-footer">
                <span className="card-list-footer-label">Add</span>
                <input type="number" min={1} max={50} className="card-add-count"
                  value={fcAddN} onChange={e => setFcAddN(Math.max(1, Number(e.target.value) || 1))} />
                <span className="card-list-footer-label">card{fcAddN !== 1 ? "s" : ""}</span>
                <Btn variant="secondary" size="sm"
                  onClick={() => setFcRows(rs => [...rs, ...Array.from({ length: fcAddN }, makeFC)])}>
                  <Ic n="plus" s={13} /> Add
                </Btn>
              </div>
            </>
          )}

          {/* ── MCQs ────────────────────────────────────────── */}
          {tab === "MCQ" && (
            <>
              {mcqRows.map((row, i) => (
                <div key={row._key} className="card-list-item card-list-item--mcq">
                  <div className="card-list-num">{i + 1}</div>
                  <div className="card-list-fields">
                    <textarea className="card-field" rows={2} placeholder="Question"
                      value={row.question} onChange={e => updateMCQ(row._key, { question: e.target.value })}
                      onBlur={() => saveMCQ(row)} />
                    <div className="card-list-opts">
                      {LETTERS.map((ltr, oi) => (
                        <div key={ltr} className="card-opt-row">
                          <button
                            className={`card-opt-letter${row.correct === ltr ? " card-opt-letter--correct" : ""}`}
                            onMouseDown={e => { e.preventDefault(); updateMCQ(row._key, { correct: ltr }); }}
                          >{ltr}</button>
                          <input className="card-opt-input" placeholder={`Option ${ltr}`}
                            value={row.opts[oi]}
                            onChange={e => { const n = [...row.opts]; n[oi] = e.target.value; updateMCQ(row._key, { opts: n }); }}
                            onBlur={() => saveMCQ(row)} />
                        </div>
                      ))}
                    </div>
                    <input className="card-field" placeholder="Explanation (optional)"
                      value={row.explanation} onChange={e => updateMCQ(row._key, { explanation: e.target.value })}
                      onBlur={() => saveMCQ(row)} />
                  </div>
                  <div className="card-list-actions">
                    {row.saving
                      ? <span className="card-save-dot">●</span>
                      : <button className="card-del-btn" onClick={() => delMCQ(row)}><Ic n="trash" s={13} /></button>}
                  </div>
                </div>
              ))}
              <div className="card-list-footer">
                <span className="card-list-footer-label">Add</span>
                <input type="number" min={1} max={20} className="card-add-count"
                  value={mcqAddN} onChange={e => setMcqAddN(Math.max(1, Number(e.target.value) || 1))} />
                <span className="card-list-footer-label">question{mcqAddN !== 1 ? "s" : ""}</span>
                <Btn variant="secondary" size="sm"
                  onClick={() => setMcqRows(rs => [...rs, ...Array.from({ length: mcqAddN }, makeMCQ)])}>
                  <Ic n="plus" s={13} /> Add
                </Btn>
              </div>
            </>
          )}

          {/* ── FIBs ────────────────────────────────────────── */}
          {tab === "FIB" && (
            <>
              {fibRows.map((row, i) => (
                <div key={row._key} className="card-list-item">
                  <div className="card-list-num">{i + 1}</div>
                  <div className="card-list-fields">
                    <div className="fib-edit-preview">
                      <input className="card-field card-field--fib" placeholder="Before blank"
                        value={row.before_blank} onChange={e => updateFIB(row._key, { before_blank: e.target.value })}
                        onBlur={() => saveFIB(row)} />
                      <span className="fib-edit-sep">___</span>
                      <input className="card-field card-field--fib" placeholder="After blank (optional)"
                        value={row.after_blank} onChange={e => updateFIB(row._key, { after_blank: e.target.value })}
                        onBlur={() => saveFIB(row)} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <input className="card-field" placeholder="Answer (required)" style={{ flex: 1 }}
                        value={row.answer} onChange={e => updateFIB(row._key, { answer: e.target.value })}
                        onBlur={() => saveFIB(row)} />
                      <input className="card-field" placeholder="Hint (optional)" style={{ flex: 1 }}
                        value={row.hint} onChange={e => updateFIB(row._key, { hint: e.target.value })}
                        onBlur={() => saveFIB(row)} />
                    </div>
                  </div>
                  <div className="card-list-actions">
                    {row.saving
                      ? <span className="card-save-dot">●</span>
                      : <button className="card-del-btn" onClick={() => delFIB(row)}><Ic n="trash" s={13} /></button>}
                  </div>
                </div>
              ))}
              <div className="card-list-footer">
                <span className="card-list-footer-label">Add</span>
                <input type="number" min={1} max={20} className="card-add-count"
                  value={fibAddN} onChange={e => setFibAddN(Math.max(1, Number(e.target.value) || 1))} />
                <span className="card-list-footer-label">blank{fibAddN !== 1 ? "s" : ""}</span>
                <Btn variant="secondary" size="sm"
                  onClick={() => setFibRows(rs => [...rs, ...Array.from({ length: fibAddN }, makeFIB)])}>
                  <Ic n="plus" s={13} /> Add
                </Btn>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer-row">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleDone}>Done — save to folder</Btn>
        </div>
      </div>
    </div>
  );
}
