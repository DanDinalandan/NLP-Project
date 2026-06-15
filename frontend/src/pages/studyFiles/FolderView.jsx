import { useState, useRef } from "react";
import { useStore }          from "../../store/useStore.js";
import { Btn }               from "../../components/ui/Btn";
import { Badge }             from "../../components/ui/Badge.jsx";
import { Ic }                from "../../components/ui/Icons";
import { ManualCreateModal } from "./ManualCreateModal.jsx";
import { getFolderMasteryPct } from "../../store/useStore.js";
import { outputsApi }        from "../../api/outputs.js";
import { foldersApi }        from "../../api/folders.js";
import { settingsApi }       from "../../api/settings.js";

const EXT_COLOR = {
  pdf: "file-type-badge-pdf", pptx: "file-type-badge-ppt",
  csv: "file-type-badge-txt", txt:  "file-type-badge-txt", md: "file-type-badge-txt",
};

const STATUS_LABEL = {
  pending: "Ready to generate", parsing: "Parsing…", chunking: "Chunking…",
  reviewing: "Reviewing…", aggregating: "Aggregating…", generating: "Generating…",
  done: "Ready", error: "Output failed",
};

const STAGE_PCT = {
  parsing: 10, chunking: 20, reviewing: 45, aggregating: 65, generating: 80,
};

const ACTIVE_STATUSES = new Set(['parsing','chunking','reviewing','aggregating','generating']);
const TERMINAL        = new Set(['done','error','pending','cancelled']);

export function FolderView({ folder, outputs, onUpload, onGenerate, onOpenOutput, onDelete, onOutputsChanged }) {
  const sourceFilesMap    = useStore(s => s.sourceFiles);
  const sourceFiles       = sourceFilesMap[folder.id] ?? [];
  const deleteSourceFile  = useStore(s => s.deleteSourceFile);
  const cancelSourceFile  = useStore(s => s.cancelSourceFile);
  const deleteFolder      = useStore(s => s.deleteFolder);
  const mastery           = useStore(s => getFolderMasteryPct(s, folder.id));

  const activeFiles   = sourceFiles.filter(f => ACTIVE_STATUSES.has(f.status));
  const isGenerating  = activeFiles.length > 0;
  const estMin        = Math.max(1, activeFiles.length * 3);
  const estMax        = Math.max(3, activeFiles.length * 7);

  const [showManual,      setShowManual]      = useState(false);
  const [toastMsg,        setToastMsg]        = useState('');
  const [publishBusy,     setPublishBusy]     = useState(false);
  const [showDelConfirm,  setShowDelConfirm]  = useState(false);
  const [delInput,        setDelInput]        = useState('');
  const [delBusy,         setDelBusy]         = useState(false);

  const handleDeleteFolder = async () => {
    if (delInput.trim() !== folder.name) return;
    setDelBusy(true);
    try {
      await deleteFolder(folder.id);
      onDelete?.();
    } catch (e) {
      showToast(e.message || 'Delete failed — check backend terminal');
      setDelBusy(false);
    }
  };

  const supabaseId        = folder.supabase_id;
  const storeUser         = useStore(s => s.user);
  const isLoggedIn        = !!storeUser?.supabaseUser;
  const patchFolder       = useStore(s => s.patchFolder);
  const unlockAchievement = useStore(s => s.unlockAchievement);

  const handlePublish = async () => {
    setPublishBusy(true);
    try {
      if (supabaseId) {
        await settingsApi.unpublishFolder(folder.id);
        patchFolder(folder.id, { supabase_id: null, pub: false });
        showToast('Folder unpublished.');
      } else {
        const res = await settingsApi.publishFolder(folder.id);
        patchFolder(folder.id, { supabase_id: res.supabase_id, pub: true });
        unlockAchievement('make_public');
        showToast('Folder published! Others can now find it in Search.');
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('JWT expired') || msg.includes('PGRST303')) {
        useStore.getState().setSupabaseUser(null);
        showToast('Session expired — please log in again in Settings.');
      } else {
        showToast(msg || 'Publish failed.');
      }
    } finally {
      setPublishBusy(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div>
      {showManual && (
        <ManualCreateModal
          folder={folder}
          onClose={() => setShowManual(false)}
          onCreated={(msg) => { setShowManual(false); showToast(msg); }}
        />
      )}

      {/* Inline success toast */}
      {toastMsg && (
        <div className="folder-toast">{toastMsg}</div>
      )}

      {/* Header */}
      <div className="folder-view-header">
        <div>
          <div className="folder-view-title">{folder.name}</div>
          <div className="folder-view-sub">
            {sourceFiles.length} files · last edited {folder.edited}
          </div>
          {/* Mastery mini-bar */}
          {mastery !== null && (
            <div className="fv-mastery-row">
              <div className="fv-mastery-track">
                <div
                  className="fv-mastery-fill"
                  style={{
                    width: `${mastery}%`,
                    background: mastery >= 100 ? '#059669' : mastery >= 95 ? '#10b981' : 'var(--blue)',
                  }}
                />
              </div>
              <span className="fv-mastery-label">{mastery}% mastered</span>
            </div>
          )}
        </div>
        <div className="folder-view-actions">
          {/* Publish to Supabase (only when signed in to online account) */}
          {isLoggedIn && (
            <Btn
              variant={supabaseId ? 'secondary' : 'ghost'}
              size="sm"
              onClick={handlePublish}
              disabled={publishBusy}
              title={supabaseId ? 'Remove from public search' : 'Share in public search'}
            >
              <Ic n={supabaseId ? 'users' : 'share'} s={13} />
              {publishBusy ? '…' : supabaseId ? 'Published' : 'Publish'}
            </Btn>
          )}
          <Btn variant="secondary" onClick={onUpload}><Ic n="upload" s={14}/> Upload</Btn>
          <Btn variant="secondary" onClick={() => setShowManual(true)}>
            <Ic n="plus" s={14}/> Add manually
          </Btn>
          <Btn variant="primary" onClick={onGenerate} disabled={isGenerating}
            title={isGenerating ? 'Generation already in progress — wait for it to finish' : undefined}>
            <Ic n="sparkles" s={14}/> {isGenerating ? 'Generating…' : 'Generate'}
          </Btn>
          <Btn
            variant="danger"
            size="sm"
            onClick={() => { setShowDelConfirm(v => !v); setDelInput(''); }}
            title="Delete this folder"
          >
            <Ic n="x" s={13} /> Delete
          </Btn>
        </div>
      </div>

      {/* Delete confirmation panel */}
      {showDelConfirm && (
        <div className="del-confirm-panel">
          <div className="del-confirm-title">
            <Ic n="hint" s={14} c="var(--danger)" /> Type <strong>{folder.name}</strong> to confirm deletion
          </div>
          <div className="del-confirm-row">
            <input
              className="del-confirm-input"
              placeholder={folder.name}
              value={delInput}
              onChange={e => setDelInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDeleteFolder()}
              autoFocus
            />
            <Btn
              variant="danger"
              size="sm"
              onClick={handleDeleteFolder}
              disabled={delInput.trim() !== folder.name || delBusy}
            >
              {delBusy ? 'Deleting…' : 'Delete folder'}
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => setShowDelConfirm(false)}>
              Cancel
            </Btn>
          </div>
          <div className="del-confirm-warn">
            This deletes all source files, generated outputs, flashcards, and embeddings. This cannot be undone.
          </div>
        </div>
      )}

      {/* Active generation banner */}
      {isGenerating && (
        <div className="gen-active-banner">
          <span className="gen-spinner" />
          <span>
            Generating outputs for <strong>{activeFiles.length}</strong> file{activeFiles.length !== 1 ? 's' : ''}…
          </span>
          <span className="gen-active-sub">~{estMin}–{estMax} min remaining · your laptop will run warm</span>
        </div>
      )}

      {/* Source files */}
      <div className="slabel gap-12">SOURCE FILES</div>
      <div className="gap-28">
        {sourceFiles.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>No files yet. Upload to get started.</div>
        )}
        {sourceFiles.map(f => (
          <SourceFileRow
            key={f.id}
            f={f}
            onDelete={() => deleteSourceFile(folder.id, f.id)}
            onCancel={() => cancelSourceFile(folder.id, f.id)}
          />
        ))}
      </div>

      {/* Generated outputs */}
      <div className="slabel gap-12">GENERATED OUTPUTS</div>
      {outputs.length === 0 ? (
        <div className="empty-outputs">
          <div className="flex-center" style={{ justifyContent: 'center', marginBottom: 10 }}>
            <Ic n="sparkles" s={24} c="var(--lav)" />
          </div>
          <div className="empty-outputs-title">No outputs yet</div>
          <div className="empty-outputs-sub">Generate flashcards, quizzes, and summaries from your files.</div>
          <Btn variant="primary" onClick={onGenerate}>Generate now</Btn>
        </div>
      ) : (
        <div className="outputs-grid">
          {outputs.map(out => (
            <ArtifactCard
              key={out.id}
              item={out}
              onClick={() => onOpenOutput(out)}
              onDelete={async (item) => {
                if (!confirm(`Delete all ${item.type} outputs for this folder?`)) return;
                try {
                  if (item.type === 'Flashcard') await outputsApi.deleteAllFlashcards(item.folderId);
                  else if (item.type === 'MCQ')  await outputsApi.deleteAllMcqs(item.folderId);
                  else if (item.type === 'FIB')  await outputsApi.deleteAllFibs(item.folderId);
                  else                           await outputsApi.deleteOutput(item.id);
                  onOutputsChanged?.();
                } catch (e) { alert(e.message || 'Delete failed'); }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Source file row with editable generated title ─────────── */
function SourceFileRow({ f, onDelete, onCancel }) {
  const [editing,  setEditing]  = useState(false);
  const [title,    setTitle]    = useState(f.generated_title ?? "");
  const [saving,   setSaving]   = useState(false);
  const inputRef = useRef();

  const startEdit = () => {
    setTitle(f.generated_title ?? "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const saveTitle = async () => {
    setSaving(true);
    try {
      await foldersApi.updateFileTitle(f.id, title.trim());
      f.generated_title = title.trim();
    } catch { /* silently ignore */ }
    setSaving(false);
    setEditing(false);
  };

  const onKey = (e) => {
    if (e.key === 'Enter') saveTitle();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <div className="source-row">
      <div className={`file-type-badge ${EXT_COLOR[f.file_type] ?? 'file-type-badge-txt'}`}>
        {f.file_type?.toUpperCase()}
      </div>
      <div className="file-info" style={{ flex: 1 }}>
        <div className="file-name">{f.original_name}</div>

        {/* Generated title — editable */}
        {f.status === 'done' && (
          <div className="file-title-row">
            {editing ? (
              <input
                ref={inputRef}
                className="file-title-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={onKey}
                disabled={saving}
                maxLength={100}
              />
            ) : (
              <span
                className="file-title"
                onClick={startEdit}
                title="Click to edit title"
              >
                {f.generated_title || <em style={{ color: 'var(--muted)' }}>No title yet</em>}
                <Ic n="edit" s={11} c="var(--muted)" style={{ marginLeft: 5 }} />
              </span>
            )}
          </div>
        )}

        <div className="file-size" style={{ color: f.status === 'error' ? 'var(--danger)' : undefined }}>
          {f.status === 'error' && f.error_message === '[Cancelled]'
            ? 'Cancelled'
            : STATUS_LABEL[f.status] ?? f.status}
        </div>
        {/* Stage-based progress bar */}
        {!['done', 'error', 'pending', 'cancelled'].includes(f.status) && (
          <div className="upload-bar" style={{ marginTop: 4 }}>
            <div className="upload-bar-fill" style={{
              width: `${STAGE_PCT[f.status] ?? 30}%`,
              transition: 'width 0.6s ease',
            }} />
          </div>
        )}
        {f.status === 'error' && f.error_message && f.error_message !== '[Cancelled]' && (
          <div className="file-error-msg" title={f.error_message}>
            {f.error_message.length > 80 ? f.error_message.slice(0, 80) + '…' : f.error_message}
          </div>
        )}
      </div>
      <div className="flex-center row-gap-10">
        {ACTIVE_STATUSES.has(f.status) && <span className="row-spinner" />}
        {f.status === 'done' && <Ic n="check" s={14} c="var(--success)" />}
        {ACTIVE_STATUSES.has(f.status) ? (
          <button className="icon-btn" onClick={onCancel} title="Cancel generation">
            <Ic n="x" s={13} c="var(--danger)" />
          </button>
        ) : (
          <button className="icon-btn" onClick={onDelete} title="Delete file">
            <Ic n="x" s={14} c="var(--muted)" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Artifact card ─────────────────────────────────────────── */
function ArtifactCard({ item, onClick, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const typeMap = {
    Flashcard: { i: "flashcard", bg: "linear-gradient(135deg, #eaecff, #c3bee9)", typeBg: "rgba(140,152,228,.14)", c: "#6b77cc" },
    MCQ:       { i: "mcq",       bg: "linear-gradient(135deg, #fce4f1, #f5cae8)", typeBg: "rgba(245,202,232,.5)",  c: "#9d3a7a" },
    Summary:   { i: "summary",   bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)", typeBg: "#d1fae5",               c: "#059669" },
    Reviewer:  { i: "files",     bg: "linear-gradient(135deg, #fef3c7, #fde68a)", typeBg: "#fef3c7",               c: "#b45309" },
    FIB:       { i: "fib",       bg: "linear-gradient(135deg, #fef3c7, #fde68a)", typeBg: "#fef3c7",               c: "#db6e1b" },
  };
  const style = typeMap[item.type] ?? typeMap.Flashcard;

  const triggerDownload = async (url, defaultName, ext) => {
    const filters = {
      pdf:  { name: 'PDF',           extensions: ['pdf']  },
      docx: { name: 'Word Document', extensions: ['docx'] },
      csv:  { name: 'CSV',           extensions: ['csv']  },
    };
    try {
      const { save }      = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      const savePath = await save({ defaultPath: `${defaultName}.${ext}`, filters: [filters[ext]] });
      if (!savePath) return;
      const res   = await fetch(url);
      const bytes = new Uint8Array(await res.arrayBuffer());
      await writeFile(savePath, bytes);
    } catch {
      const a = document.createElement('a');
      a.href = url; a.download = `${defaultName}.${ext}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
  };

  const safeName = item.name.replace(/\s+/g, '_');
  const docxUrl  = outputsApi.exportDocxUrl(item.type, item.id, item.folderId);
  const csvUrl   = item.type === 'MCQ' ? outputsApi.exportCsvUrl(item.folderId) : null;

  return (
    <div className="artifact-card" onClick={onClick}>
      <div className="artifact-thumb" style={{ background: style.bg }}>
        <Ic n={style.i} s={32} c={style.c} />
      </div>
      <div className="artifact-body">
        <div className="artifact-name">{item.name}</div>
        <div className="artifact-time">Created {item.created}</div>
        <Badge style={{ background: style.typeBg, color: style.c }}>{item.type}</Badge>
      </div>
      <div className="artifact-exports" onClick={e => e.stopPropagation()}>
        {item.downloadUrl && (
          <button className="artifact-export-btn" onClick={() => triggerDownload(item.downloadUrl, safeName, 'pdf')} title="Download PDF">PDF</button>
        )}
        <button className="artifact-export-btn" onClick={() => triggerDownload(docxUrl, safeName, 'docx')} title="Download DOCX">DOCX</button>
        {csvUrl && (
          <button className="artifact-export-btn" onClick={() => triggerDownload(csvUrl, safeName, 'csv')} title="Download CSV">CSV</button>
        )}
      </div>

      {/* ── Triple-dot menu ──────────────────────── */}
      <div className="artifact-menu-wrap" onClick={e => e.stopPropagation()}>
        <button
          className="artifact-menu-btn"
          onClick={() => setMenuOpen(o => !o)}
          title="More options"
        >⋯</button>
        {menuOpen && (
          <div className="artifact-menu-dropdown">
            <button
              className="artifact-menu-item artifact-menu-item--danger"
              onClick={() => { setMenuOpen(false); onDelete?.(item); }}
            >
              <Ic n="trash" s={13} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
