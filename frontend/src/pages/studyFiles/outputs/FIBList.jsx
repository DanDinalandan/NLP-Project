import { useState, useCallback } from "react";
import { Btn }          from "../../../components/ui/Btn";
import { Ic }           from "../../../components/ui/Icons";
import { useStore }     from "../../../store/useStore.js";
import { outputsApi }   from "../../../api/outputs.js";
import { FillInBlanks } from "./FIB.jsx";

function makeEmpty() {
  return {
    _key: Math.random(), id: null,
    before_blank: "", answer: "", after_blank: "", hint: "",
    saving: false, error: "",
  };
}

function fromStore(f) {
  return {
    _key: f.id, id: f.id,
    before_blank: f.before_blank, answer: f.answer,
    after_blank: f.after_blank ?? "", hint: f.hint ?? "",
    saving: false, error: "",
  };
}

export function FIBList({ onBack }) {
  const [mode, setMode] = useState("list");
  if (mode === "exercise") return <FillInBlanks onBack={() => setMode("list")} />;
  return <ListView onBack={onBack} onExercise={() => setMode("exercise")} />;
}

function ListView({ onBack, onExercise }) {
  const activeFolderId = useStore(s => s.activeFolderId);
  const rawFibs        = useStore(s => s.fibs[activeFolderId] ?? []);

  const [rows,  setRows]  = useState(() => rawFibs.map(fromStore));
  const [addN,  setAddN]  = useState(1);

  const updateRow = (key, patch) =>
    setRows(rs => rs.map(r => r._key === key ? { ...r, ...patch } : r));

  const saveRow = useCallback(async (row) => {
    // Require answer + at least one side (before or after blank)
    if (!row.answer.trim() || (!row.before_blank.trim() && !row.after_blank.trim())) return;
    updateRow(row._key, { saving: true, error: "" });
    try {
      const payload = {
        before_blank: row.before_blank, answer: row.answer,
        after_blank: row.after_blank,   hint: row.hint,
      };
      if (row.id) {
        await outputsApi.updateFib(row.id, payload);
        useStore.setState(s => ({
          fibs: {
            ...s.fibs,
            [activeFolderId]: (s.fibs[activeFolderId] ?? []).map(f =>
              f.id === row.id ? { ...f, ...payload } : f
            ),
          },
        }));
        updateRow(row._key, { saving: false });
      } else if (row.before_blank.trim() && row.answer.trim()) {
        const created = await outputsApi.createFib({ folder_id: activeFolderId, ...payload });
        useStore.setState(s => ({
          fibs: { ...s.fibs, [activeFolderId]: [...(s.fibs[activeFolderId] ?? []), created] },
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
      await outputsApi.deleteFib(row.id).catch(() => {});
      useStore.setState(s => ({
        fibs: { ...s.fibs, [activeFolderId]: (s.fibs[activeFolderId] ?? []).filter(f => f.id !== row.id) },
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
          <div className="output-title">Fill-in-the-Blanks</div>
          <div className="card-list-count">{rows.length} blank{rows.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="flex-center row-gap-10">
          <Btn variant="secondary" size="sm" onClick={onBack}>← Folder</Btn>
          <Btn variant="primary" size="sm" onClick={onExercise} disabled={rows.length === 0}>
            Take Exercise →
          </Btn>
        </div>
      </div>

      <div className="card-list-scroll">
        {rows.length === 0 && (
          <div className="card-list-empty">No blanks yet — add some below.</div>
        )}
        {rows.map((row, i) => (
          <div key={row._key} className="card-list-item">
            <div className="card-list-num">{i + 1}</div>
            <div className="card-list-fields">
              <div className="fib-edit-preview">
                <input
                  className="card-field card-field--fib"
                  placeholder="Before blank (sentence start)"
                  value={row.before_blank}
                  onChange={e => updateRow(row._key, { before_blank: e.target.value })}
                  onBlur={() => saveRow(row)}
                />
                <span className="fib-edit-sep">___</span>
                <input
                  className="card-field card-field--fib"
                  placeholder="After blank (optional)"
                  value={row.after_blank}
                  onChange={e => updateRow(row._key, { after_blank: e.target.value })}
                  onBlur={() => saveRow(row)}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input
                  className="card-field"
                  placeholder="Answer (required)"
                  value={row.answer}
                  onChange={e => updateRow(row._key, { answer: e.target.value })}
                  onBlur={() => saveRow(row)}
                  style={{ flex: 1 }}
                />
                <input
                  className="card-field"
                  placeholder="Hint (optional)"
                  value={row.hint}
                  onChange={e => updateRow(row._key, { hint: e.target.value })}
                  onBlur={() => saveRow(row)}
                  style={{ flex: 1 }}
                />
              </div>
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
        <span className="card-list-footer-label">empty blank{addN !== 1 ? "s" : ""}</span>
        <Btn variant="secondary" size="sm" onClick={addRows}>
          <Ic n="plus" s={13} /> Add
        </Btn>
      </div>
    </div>
  );
}
