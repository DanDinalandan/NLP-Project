import { useRef, useState } from "react";
import { Btn }    from "../../components/ui/Btn.jsx";
import { Ic }     from "../../components/ui/Icons.jsx";
import { SLabel } from "../../components/ui/SLabel.jsx";
import { useStore } from "../../store/useStore.js";

const FT_COLORS = {
  pdf: "file-type-badge-pdf-solid", pptx: "file-type-badge-ppt-solid",
  txt: "file-type-badge-txt-solid", csv: "file-type-badge-csv-solid",
  md:  "file-type-badge-txt-solid",
};

export function UploadModal({ folder, onClose }) {
  const [staged, setStaged]   = useState([]);
  const [uploading, setUpl]   = useState(false);
  const [uploaded, setUpled]  = useState([]);
  const uploadFile = useStore(s => s.uploadFile);
  const inputRef   = useRef();

  const addFiles = (fileList) => {
    const allowed = ['pdf', 'pptx', 'csv', 'txt', 'md'];
    const newFiles = Array.from(fileList).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return allowed.includes(ext);
    });
    setStaged(prev => [...prev, ...newFiles]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!staged.length || !folder) return;
    setUpl(true);
    for (const file of staged) {
      try {
        await uploadFile(folder.id, file);
        setUpled(prev => [...prev, file.name]);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setUpl(false);
    setStaged([]);
    onClose();
  };

  return (
    <ModalShell title={`Upload files to "${folder?.name ?? "folder"}"`} onClose={onClose}>
      <div
        className="drop-zone gap-20"
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.pptx,.csv,.txt,.md"
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
        <div className="drop-icon"><Ic n="upload" s={38} /></div>
        <div className="drop-title">Drop your files here</div>
        <div className="drop-sub">or click to browse from your device</div>
        <div className="format-pills">
          {["PDF", "TXT", "PPTX", "CSV"].map(f => (
            <span key={f} className="format-pill">{f}</span>
          ))}
        </div>
      </div>

      {staged.length > 0 && (
        <>
          <SLabel className="gap-12">Files to upload</SLabel>
          {staged.map((f, i) => {
            const ext = f.name.split('.').pop().toLowerCase();
            return (
              <div key={i} className="source-row gap-8">
                <div className={`file-type-badge ${FT_COLORS[ext] ?? 'file-type-badge-txt-solid'}`}>
                  {ext.toUpperCase()}
                </div>
                <div className="file-info">
                  <div className="file-name">{f.name}</div>
                  <div className="file-size">{(f.size / 1024).toFixed(1)} KB · Ready to upload</div>
                </div>
                <Ic n="x" s={13} c="var(--muted)" style={{ cursor: 'pointer' }}
                  onClick={() => setStaged(prev => prev.filter((_, j) => j !== i))} />
              </div>
            );
          })}
        </>
      )}

      <div className="flex-end-row">
        <Btn variant="secondary" onClick={onClose} disabled={uploading}>Cancel</Btn>
        <Btn variant="primary" onClick={handleUpload} disabled={!staged.length || uploading}>
          <Ic n="upload" s={13} /> {uploading ? 'Uploading…' : 'Upload'}
        </Btn>
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
