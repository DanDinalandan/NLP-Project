import { useState } from "react";
import { useStore }          from "../../store/useStore.js";
import { Btn }               from "../../components/ui/Btn";
import { Badge }             from "../../components/ui/Badge.jsx";
import { Ic }                from "../../components/ui/Icons";
import { ManualCreateModal } from "./ManualCreateModal.jsx";
import { getFolderMasteryPct } from "../../store/useStore.js";

const EXT_COLOR = {
  pdf: "file-type-badge-pdf", pptx: "file-type-badge-ppt",
  csv: "file-type-badge-txt", txt:  "file-type-badge-txt", md: "file-type-badge-txt",
};

const STATUS_LABEL = {
  pending: "Pending", parsing: "Parsing…", chunking: "Chunking…",
  reviewing: "Reviewing…", aggregating: "Aggregating…", generating: "Generating…",
  done: "Ready", error: "Error",
};

export function FolderView({ folder, outputs, onUpload, onGenerate, onOpenOutput }) {
  const sourceFiles      = useStore(s => s.sourceFiles[folder.id] ?? []);
  const deleteSourceFile = useStore(s => s.deleteSourceFile);
  const renameFolder     = useStore(s => s.renameFolder);
  const mastery          = useStore(s => getFolderMasteryPct(s, folder.id));

  const [showManual, setShowManual] = useState(false);
  const [toastMsg,   setToastMsg]   = useState('');
  const [privBusy,   setPrivBusy]   = useState(false);

  const isPublic = folder.pub;

  const togglePrivacy = async () => {
    setPrivBusy(true);
    try {
      await renameFolder(folder.id, { privacy: isPublic ? 'private' : 'public' });
    } finally {
      setPrivBusy(false);
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
          {/* Privacy toggle */}
          <Btn
            variant={isPublic ? 'secondary' : 'ghost'}
            size="sm"
            onClick={togglePrivacy}
            disabled={privBusy}
            title={isPublic ? 'Make private' : 'Make public'}
          >
            <Ic n={isPublic ? 'users' : 'lock'} s={13} />
            {privBusy ? '…' : isPublic ? 'Public' : 'Private'}
          </Btn>
          <Btn variant="secondary" onClick={onUpload}><Ic n="upload" s={14}/> Upload</Btn>
          <Btn variant="secondary" onClick={() => setShowManual(true)}>
            <Ic n="plus" s={14}/> Add manually
          </Btn>
          <Btn variant="primary" onClick={onGenerate}><Ic n="sparkles" s={14}/> Generate</Btn>
        </div>
      </div>

      {/* Source files */}
      <div className="slabel gap-12">SOURCE FILES</div>
      <div className="gap-28">
        {sourceFiles.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>No files yet. Upload to get started.</div>
        )}
        {sourceFiles.map(f => (
          <div key={f.id} className="source-row">
            <div className={`file-type-badge ${EXT_COLOR[f.file_type] ?? 'file-type-badge-txt'}`}>
              {f.file_type?.toUpperCase()}
            </div>
            <div className="file-info">
              <div className="file-name">{f.original_name}</div>
              <div className="file-size">{STATUS_LABEL[f.status] ?? f.status}</div>
              {f.status !== 'done' && f.status !== 'error' && f.status !== 'pending' && (
                <div className="upload-bar"><div className="upload-bar-fill" style={{ width: '60%' }} /></div>
              )}
              {f.status === 'error' && (
                <div style={{ color: 'var(--danger)', fontSize: 12 }}>{f.error_message}</div>
              )}
            </div>
            <div className="flex-center row-gap-10">
              {f.status === 'done' && <Ic n="check" s={14} c="var(--success)" />}
              <button
                className="icon-btn"
                onClick={() => deleteSourceFile(folder.id, f.id)}
                title="Delete file"
              >
                <Ic n="x" s={14} c="var(--muted)" />
              </button>
            </div>
          </div>
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
            <ArtifactCard key={out.id} item={out} onClick={() => onOpenOutput(out)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Artifact card ─────────────────────────────────────────── */
function ArtifactCard({ item, onClick }) {
  const typeMap = {
    Flashcard: { i: "flashcard", bg: "linear-gradient(135deg, #eaecff, #c3bee9)", typeBg: "rgba(140,152,228,.14)", c: "#6b77cc" },
    MCQ:       { i: "mcq",       bg: "linear-gradient(135deg, #fce4f1, #f5cae8)", typeBg: "rgba(245,202,232,.5)",  c: "#9d3a7a" },
    Summary:   { i: "summary",   bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)", typeBg: "#d1fae5",               c: "#059669" },
    Reviewer:  { i: "files",     bg: "linear-gradient(135deg, #fef3c7, #fde68a)", typeBg: "#fef3c7",               c: "#b45309" },
    FIB:       { i: "fib",       bg: "linear-gradient(135deg, #fef3c7, #fde68a)", typeBg: "#fef3c7",               c: "#db6e1b" },
  };
  const style = typeMap[item.type] ?? typeMap.Flashcard;

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!item.downloadUrl) return;
    try {
      // Tauri path
      const { save }            = await import('@tauri-apps/plugin-dialog');
      const { writeFile }       = await import('@tauri-apps/plugin-fs');
      const { BaseDirectory }   = await import('@tauri-apps/plugin-fs');
      const savePath = await save({
        defaultPath: `${item.name.replace(/\s+/g, '_')}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (!savePath) return;
      const res   = await fetch(item.downloadUrl);
      const bytes = new Uint8Array(await res.arrayBuffer());
      await writeFile(savePath, bytes);
    } catch {
      // Browser fallback
      const a = document.createElement('a');
      a.href     = item.downloadUrl;
      a.download = `${item.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

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
      {item.downloadUrl && (
        <button className="artifact-dl-btn" onClick={handleDownload} title="Download PDF">
          <Ic n="download" s={15} c="var(--muted)" />
        </button>
      )}
    </div>
  );
}
