import { useState, useCallback } from "react";
import { Btn }        from "../../../components/ui/Btn";
import { Ic }         from "../../../components/ui/Icons";
import { useStore }   from "../../../store/useStore.js";
import { outputsApi } from "../../../api/outputs.js";
import { MCQ }        from "./MCQ.jsx";

const LETTERS = ["A", "B", "C", "D"];

function optsToStrings(opts) {
  // opts can be [{label,text}] or ["string","string"]
  return opts.map(o => (typeof o === "object" && o !== null ? o.text : o));
}

function stringsToOpts(strs) {
  return strs.map((t, i) => ({ label: LETTERS[i], text: t }));
}

function makeEmpty() {
  return {
    _key: Math.random(), id: null,
    question: "", opts: ["", "", "", ""], correct: "A", explanation: "",
    saving: false, error: "",
  };
}

function fromStore(m) {
  return {
    _key: m.id, id: m.id,
    question: m.question,
    opts: optsToStrings(m.options),
    correct: m.correct_answer,
    explanation: m.explanation ?? "",
    saving: false, error: "",
  };
}

export function MCQList({ onBack }) {
  const [mode, setMode] = useState("list");
  if (mode === "quiz") return <MCQ onBack={() => setMode("list")} />;
  return <ListView onBack={onBack} onQuiz={() => setMode("quiz")} />;
}

function ListView({ onBack, onQuiz }) {
  const activeFolderId = useStore(s => s.activeFolderId);
  const rawMcqs        = useStore(s => s.mcqs[activeFolderId] ?? []);

  const [rows,   setRows]   = useState(() => rawMcqs.map(fromStore));
  const [addN,   setAddN]   = useState(1);

  const updateRow = (key, patch) =>
    setRows(rs => rs.map(r => r._key === key ? { ...r, ...patch } : r));

  const saveRow = useCallback(async (row) => {
    if (!row.question.trim()) return;
    updateRow(row._key, { saving: true, error: "" });
    try {
      const payload = {
        question:       row.question,
        options:        stringsToOpts(row.opts),
        correct_answer: row.correct,
        explanation:    row.explanation,
      };
      if (row.id) {
        const updated = await outputsApi.updateMcq(row.id, payload);
        useStore.setState(s => ({
          mcqs: {
            ...s.mcqs,
            [activeFolderId]: (s.mcqs[activeFolderId] ?? []).map(m =>
              m.id === row.id ? { ...m, ...updated } : m
            ),
          },
        }));
        updateRow(row._key, { saving: false });
      } else if (row.opts.every(o => o.trim())) {
        const created = await outputsApi.createMcq({ folder_id: activeFolderId, ...payload });
        useStore.setState(s => ({
          mcqs: { ...s.mcqs, [activeFolderId]: [...(s.mcqs[activeFolderId] ?? []), created] },
        }));
        updateRow(row._key, { saving: false, id: created.id, _key: created.id });
      } else {
        updateRow(row._key, { saving: false });
      }
    } catch {
      updateRow(row._key, { saving: false, error: "Save failed" });
    }
  }, [activeFolderId]);

  const deleteRow = async (row) => {
    if (row.id) {
      await outputsApi.deleteMcq(row.id).catch(() => {});
      useStore.setState(s => ({
        mcqs: { ...s.mcqs, [activeFolderId]: (s.mcqs[activeFolderId] ?? []).filter(m => m.id !== row.id) },
      }));
    }
    setRows(rs => rs.filter(r => r._key !== row._key));
  };

  const addRows = () =>
    setRows(rs => [...rs, ...Array.from({ length: addN }, makeEmpty)]);

  return (
    <div className="card-list-view">
      <div className="card-list-header">
        <div>
          <div className="output-title">MCQ Questions</div>
          <div className="card-list-count">{rows.length} question{rows.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="flex-center row-gap-10">
          <Btn variant="secondary" size="sm" onClick={onBack}>← Folder</Btn>
          <Btn variant="primary" size="sm" onClick={onQuiz} disabled={rows.length === 0}>
            Take Quiz →
          </Btn>
        </div>
      </div>

      <div className="card-list-scroll">
        {rows.length === 0 && (
          <div className="card-list-empty">No questions yet — add some below.</div>
        )}
        {rows.map((row, i) => (
          <div key={row._key} className="card-list-item card-list-item--mcq">
            <div className="card-list-num">{i + 1}</div>
            <div className="card-list-fields">
              <textarea
                className="card-field"
                placeholder="Question"
                value={row.question}
                rows={2}
                onChange={e => updateRow(row._key, { question: e.target.value })}
                onBlur={() => saveRow(row)}
              />
              <div className="card-list-opts">
                {LETTERS.map((ltr, oi) => (
                  <div key={ltr} className="card-opt-row">
                    <button
                      className={`card-opt-letter${row.correct === ltr ? " card-opt-letter--correct" : ""}`}
                      onClick={() => updateRow(row._key, { correct: ltr })}
                      onMouseDown={e => e.preventDefault()} // don't blur the active field
                      title="Mark correct"
                    >{ltr}</button>
                    <input
                      className="card-opt-input"
                      placeholder={`Option ${ltr}`}
                      value={row.opts[oi]}
                      onChange={e => {
                        const n = [...row.opts]; n[oi] = e.target.value;
                        updateRow(row._key, { opts: n });
                      }}
                      onBlur={() => saveRow(row)}
                    />
                  </div>
                ))}
              </div>
              <input
                className="card-field"
                placeholder="Explanation (optional)"
                value={row.explanation}
                onChange={e => updateRow(row._key, { explanation: e.target.value })}
                onBlur={() => saveRow(row)}
              />
              {row.error && <div className="card-field-err">{row.error}</div>}
            </div>
            <div className="card-list-actions">
              {row.saving
                ? <span className="card-save-dot" title="Saving…">●</span>
                : <button className="card-del-btn" onClick={() => deleteRow(row)} title="Delete">
                    <Ic n="trash" s={13} />
                  </button>
              }
            </div>
          </div>
        ))}
      </div>

      <div className="card-list-footer">
        <span className="card-list-footer-label">Add</span>
        <input
          type="number" min={1} max={20} className="card-add-count"
          value={addN}
          onChange={e => setAddN(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
        />
        <span className="card-list-footer-label">empty question{addN !== 1 ? "s" : ""}</span>
        <Btn variant="secondary" size="sm" onClick={addRows}>
          <Ic n="plus" s={13} /> Add
        </Btn>
      </div>
    </div>
  );
}
