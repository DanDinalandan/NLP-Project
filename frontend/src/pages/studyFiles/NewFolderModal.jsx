import { useState } from "react";
import { Btn }        from "../../components/ui/Btn.jsx";
import { ModalShell } from "./UploadModal.jsx";
import { useStore }   from "../../store/useStore.js";

export function NewFolderModal({ onClose, onCreated }) {
  const [name,  setName]  = useState("");
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");
  const addFolder = useStore(s => s.addFolder);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Folder name is required."); return; }
    setBusy(true);
    setError("");
    try {
      const folder = await addFolder(trimmed);
      onCreated(folder);
    } catch {
      setError("Could not create folder. Make sure the backend is running.");
      setBusy(false);
    }
  };

  return (
    <ModalShell title="New folder" onClose={onClose}>
      <form onSubmit={submit}>
        <input
          className="modal-name-input"
          placeholder="e.g. Biology Chapter 3"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          disabled={busy}
        />
        {error && <div className="modal-error">{error}</div>}
        <div className="flex-end-row" style={{ marginTop: 20 }}>
          <Btn variant="secondary" type="button" onClick={onClose} disabled={busy}>Cancel</Btn>
          <Btn variant="primary" type="submit" disabled={!name.trim() || busy}>
            {busy ? "Creating…" : "Create folder →"}
          </Btn>
        </div>
      </form>
    </ModalShell>
  );
}
