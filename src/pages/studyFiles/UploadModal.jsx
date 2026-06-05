import { Btn }    from "../../components/ui/Btn.jsx";
import { Ic }     from "../../components/ui/Icons.jsx";
import { SLabel } from "../../components/ui/SLabel.jsx";
import { UPLOAD_FILES } from "../../data/mockData.js";

// Point to the SOLID css classes
const FT_COLORS = { 
  PDF: "file-type-badge-pdf-solid", 
  PPT: "file-type-badge-ppt-solid", 
  TXT: "file-type-badge-txt-solid", 
  CSV: "file-type-badge-csv-solid" 
};

export function UploadModal({ folder, onClose }) {
  return (
    <ModalShell
      title={`Upload files to "${folder?.name ?? "folder"}"`}
      onClose={onClose}
    >
      <div className="drop-zone gap-20">
        <div className="drop-icon"><Ic n="upload" s={38} /></div>
        <div className="drop-title">Drop your files here</div>
        <div className="drop-sub">or click to browse from your device</div>
        <div className="format-pills">
          {["PDF", "TXT", "PPTX", "CSV"].map(f => (
            <span key={f} className="format-pill">{f}</span>
          ))}
        </div>
      </div>

      <SLabel className="gap-12">Files</SLabel>
      {UPLOAD_FILES.map(f => <UploadFileRow key={f.id} file={f} />)}

      <div className="flex-end-row">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary"   onClick={onClose}>
          <Ic n="upload" s={13} /> Upload
        </Btn>
      </div>
    </ModalShell>
  );
}

function UploadFileRow({ file }) {
  return (
    <div className="source-row gap-8">
      <div className={`file-type-badge ${FT_COLORS[file.type] ?? "file-type-badge-txt-solid"}`}>
        {file.type}
      </div>
      <div className="file-info">
        <div className="file-name">{file.name}</div>
        <div className="file-size">
          {file.size} · {file.uploading ? "Uploading…" : "Done"}
        </div>
        {file.uploading && (
          <div className="upload-bar">
            <div className="upload-bar-fill" style={{ width: `${file.pct}%` }} />
          </div>
        )}
      </div>
      <div className="flex-center row-gap-8">
        {!file.uploading && <Ic n="check" s={13} c="var(--success)" />}
        <Ic n="x" s={13} c="var(--muted)" />
      </div>
    </div>
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