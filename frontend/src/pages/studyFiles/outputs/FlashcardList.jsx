import { useState, useCallback } from "react";
import { Btn }        from "../../../components/ui/Btn";
import { Ic }         from "../../../components/ui/Icons";
import { useStore }   from "../../../store/useStore.js";
import { outputsApi } from "../../../api/outputs.js";
import { Flashcards } from "./Flashcards.jsx";

// Each row: { _key, id?, front, back, saving, error }
function makeEmpty() {
  return { _key: Math.random(), id: null, front: "", back: "", saving: false, error: "" };
}

function fromStore(c) {
  return { _key: c.id, id: c.id, front: c.front, back: c.back, saving: false, error: "" };
}

export function FlashcardList({ onBack }) {
  const [mode, setMode] = useState("list"); // "list" | "study"

  if (mode === "study") return <Flashcards onBack={() => setMode("list")} />;

  return <ListView onBack={onBack} onStudy={() => setMode("study")} />;
}

function ListView({ onBack, onStudy }) {
  const activeFolderId = useStore(s => s.activeFolderId);
  const rawCards       = useStore(s => s.flashcards[activeFolderId] ?? []);

  const [rows,    setRows]    = useState(() => rawCards.map(fromStore));
  const [addN,    setAddN]    = useState(1);
  const [adding,  setAdding]  = useState(false);

  // Sync store → rows when rawCards change length (e.g. after external add)
  // intentionally NOT on every render to avoid overwriting in-progress edits

  const updateRow = (key, patch) =>
    setRows(rs => rs.map(r => r._key === key ? { ...r, ...patch } : r));

  const saveRow = useCallback(async (row) => {
    if (!row.front.trim() && !row.back.trim()) return; // skip fully empty
    updateRow(row._key, { saving: true, error: "" });
    try {
      if (row.id) {
        await outputsApi.updateFlashcard(row.id, { front: row.front, back: row.back });
        // mirror to store
        useStore.setState(s => ({
          flashcards: {
            ...s.flashcards,
            [activeFolderId]: (s.flashcards[activeFolderId] ?? []).map(c =>
              c.id === row.id ? { ...c, front: row.front, back: row.back } : c
            ),
          },
        }));
        updateRow(row._key, { saving: false });
      } else if (row.front.trim() && row.back.trim()) {
        // New card — create only when both sides filled
        const created = await outputsApi.createFlashcard({
          folder_id: activeFolderId, front: row.front.trim(), back: row.back.trim(),
        });
        useStore.setState(s => ({
          flashcards: { ...s.flashcards, [activeFolderId]: [...(s.flashcards[activeFolderId] ?? []), created] },
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
      await outputsApi.deleteFlashcard(row.id).catch(() => {});
      useStore.setState(s => ({
        flashcards: { ...s.flashcards, [activeFolderId]: (s.flashcards[activeFolderId] ?? []).filter(c => c.id !== row.id) },
      }));
    }
    setRows(rs => rs.filter(r => r._key !== row._key));
  };

  const addCards = async () => {
    setAdding(true);
    const newRows = Array.from({ length: addN }, makeEmpty);
    setRows(rs => [...rs, ...newRows]);
    setAdding(false);
  };

  return (
    <div className="card-list-view">
      <div className="card-list-header">
        <div>
          <div className="output-title">Flashcards</div>
          <div className="card-list-count">{rows.length} card{rows.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="flex-center row-gap-10">
          <Btn variant="secondary" size="sm" onClick={onBack}>← Folder</Btn>
          <Btn variant="primary" size="sm" onClick={onStudy} disabled={rows.length === 0}>
            Study Flashcards →
          </Btn>
        </div>
      </div>

      <div className="card-list-scroll">
        {rows.length === 0 && (
          <div className="card-list-empty">No flashcards yet — add some below.</div>
        )}
        {rows.map((row, i) => (
          <div key={row._key} className="card-list-item">
            <div className="card-list-num">{i + 1}</div>
            <div className="card-list-fields">
              <textarea
                className="card-field"
                placeholder="Front (term / question)"
                value={row.front}
                onChange={e => updateRow(row._key, { front: e.target.value })}
                onBlur={() => saveRow(row)}
                rows={2}
              />
              <textarea
                className="card-field card-field--back"
                placeholder="Back (definition / answer)"
                value={row.back}
                onChange={e => updateRow(row._key, { back: e.target.value })}
                onBlur={() => saveRow(row)}
                rows={2}
              />
              {row.error && <div className="card-field-err">{row.error}</div>}
            </div>
            <div className="card-list-actions">
              {row.saving
                ? <span className="card-save-dot" title="Saving…">●</span>
                : <button className="card-del-btn" onClick={() => deleteRow(row)} title="Delete card">
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
          type="number" min={1} max={50}
          className="card-add-count"
          value={addN}
          onChange={e => setAddN(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
        />
        <span className="card-list-footer-label">empty card{addN !== 1 ? "s" : ""}</span>
        <Btn variant="secondary" size="sm" onClick={addCards} disabled={adding}>
          <Ic n="plus" s={13} /> Add
        </Btn>
      </div>
    </div>
  );
}
