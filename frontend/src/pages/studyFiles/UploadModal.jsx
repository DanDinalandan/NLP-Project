import { useRef, useState } from "react";
import { Btn }     from "../../components/ui/Btn.jsx";
import { Ic }      from "../../components/ui/Icons.jsx";
import { SLabel }  from "../../components/ui/SLabel.jsx";
import { useStore } from "../../store/useStore.js";

const ALLOWED = ['pdf', 'pptx', 'csv', 'txt', 'md'];
const API     = 'http://127.0.0.1:8765';

const FT_COLORS = {
  pdf: 'file-type-badge-pdf-solid', pptx: 'file-type-badge-ppt-solid',
  txt: 'file-type-badge-txt-solid', csv:  'file-type-badge-csv-solid',
  md:  'file-type-badge-txt-solid',
};

// Single state entry per file — avoids nested-setState race conditions
// { file: File, status: 'pending'|'uploading'|'done'|'error', error: '' }

export function UploadModal({ folder, onClose }) {
  const [items,    setItems]    = useState([]);
  const [busy,     setBusy]     = useState(false);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef();

  const addFiles = (fileList) => {
    const next = Array.from(fileList)
      .filter(f => ALLOWED.includes(f.name.split('.').pop().toLowerCase()))
      .map(f => ({ file: f, status: 'pending', error: '' }));
    if (next.length) setItems(prev => [...prev, ...next]);
  };

  const removeItem = (idx) =>
    setItems(prev => prev.filter((_, i) => i !== idx));

  const setItemStatus = (idx, status, error = '') =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, status, error } : it));

  const handleUpload = async () => {
    if (!items.length || !folder?.id || busy) return;
    setBusy(true);

    const folderId = folder.id; // capture before any async

    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done') continue;

      setItemStatus(i, 'uploading');

      const form = new FormData();
      form.append('file', items[i].file);

      try {
        const res = await fetch(`${API}/folders/${folderId}/files`, {
          method: 'POST',
          body: form,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || `Server returned ${res.status}`);
        }

        const fileRow = await res.json();

        // Update Zustand store directly — no wrapper that could fail silently
        const { sourceFiles, folders } = useStore.getState();
        useStore.setState({
          sourceFiles: {
            ...sourceFiles,
            [folderId]: [...(sourceFiles[folderId] ?? []), fileRow],
          },
          folders: folders.map(f =>
            f.id === folderId ? { ...f, files: (f.files || 0) + 1 } : f
          ),
        });

        setItemStatus(i, 'done');
      } catch (err) {
        setItemStatus(i, 'error',
          err.message || 'Upload failed. Make sure the backend is running.');
      }
    }

    setBusy(false);
    setFinished(true);
  };

  const errorCount   = items.filter(it => it.status === 'error').length;
  const pendingCount = items.filter(it => it.status === 'pending').length;
  const allDone      = items.length > 0 && items.every(it => it.status === 'done');

  // After first pass, retrying means resetting error items to pending
  const handleRetry = () => {
    setItems(prev => prev.map(it =>
      it.status === 'error' ? { ...it, status: 'pending', error: '' } : it
    ));
    setFinished(false);
  };

  return (
    <ModalShell title={`Upload to "${folder?.name ?? 'folder'}"`} onClose={onClose}>

      {/* Drop zone — visible while not mid-upload */}
      {!busy && !finished && (
        <div
          className="drop-zone gap-20"
          onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          <input
            ref={inputRef} type="file" multiple
            accept=".pdf,.pptx,.csv,.txt,.md"
            style={{ display: 'none' }}
            onChange={e => addFiles(e.target.files)}
          />
          <div className="drop-icon"><Ic n="upload" s={38} /></div>
          <div className="drop-title">Drop files here</div>
          <div className="drop-sub">or click to browse · PDF, PPTX, CSV, TXT, MD</div>
        </div>
      )}

      {/* File list */}
      {items.length > 0 && (
        <>
          <SLabel className="gap-12">
            {finished ? 'Upload results' : `${items.length} file${items.length !== 1 ? 's' : ''} queued`}
          </SLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, idx) => {
              const ext = it.file.name.split('.').pop().toLowerCase();
              return (
                <div key={idx} className="source-row gap-8">
                  <div className={`file-type-badge ${FT_COLORS[ext] ?? 'file-type-badge-txt-solid'}`}>
                    {ext.toUpperCase()}
                  </div>
                  <div className="file-info" style={{ flex: 1 }}>
                    <div className="file-name">{it.file.name}</div>
                    <div className="file-size"
                      style={{ color: it.status === 'error' ? 'var(--danger)' : undefined }}>
                      {it.status === 'pending'   && `${(it.file.size / 1024).toFixed(1)} KB`}
                      {it.status === 'uploading' && 'Uploading…'}
                      {it.status === 'done'      && 'Uploaded ✓'}
                      {it.status === 'error'     && (it.error || 'Upload failed')}
                    </div>
                    {it.status === 'uploading' && (
                      <div className="upload-bar" style={{ marginTop: 4 }}>
                        <div className="upload-bar-fill"
                          style={{ width: '100%', animation: 'shimmer 1.4s linear infinite' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {it.status === 'pending' && !busy && (
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                        onClick={() => removeItem(idx)}>
                        <Ic n="x" s={13} c="var(--muted)" />
                      </button>
                    )}
                    {it.status === 'uploading' && <span className="setup-spinner" />}
                    {it.status === 'done'      && <Ic n="check" s={15} c="var(--success)" />}
                    {it.status === 'error'     && <Ic n="x" s={15} c="var(--danger)" />}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {allDone && (
        <div className="setup-success-msg" style={{ marginTop: 12 }}>
          All files uploaded successfully!
        </div>
      )}
      {finished && errorCount > 0 && (
        <div className="setup-error-msg" style={{ marginTop: 12 }}>
          {errorCount} file{errorCount !== 1 ? 's' : ''} failed. Click Retry to try again.
        </div>
      )}
      {!folder?.id && (
        <div className="setup-error-msg" style={{ marginTop: 8 }}>
          No folder selected. Please open a folder first.
        </div>
      )}

      <div className="flex-end-row">
        <Btn variant="secondary" onClick={onClose} disabled={busy}>
          {allDone ? 'Done' : 'Cancel'}
        </Btn>

        {!allDone && !finished && (
          <Btn variant="primary" onClick={handleUpload}
            disabled={pendingCount === 0 || busy || !folder?.id}>
            <Ic n="upload" s={13} />
            {busy ? 'Uploading…' : `Upload (${pendingCount})`}
          </Btn>
        )}

        {finished && errorCount > 0 && (
          <Btn variant="primary" onClick={handleRetry}>
            Retry failed ({errorCount})
          </Btn>
        )}
      </div>
    </ModalShell>
  );
}

export function ModalShell({ title, onClose, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>
            <Ic n="x" s={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
