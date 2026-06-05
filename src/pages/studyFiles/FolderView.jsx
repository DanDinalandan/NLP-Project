import { Btn } from "../../components/ui/Btn";
import { Ic } from "../../components/ui/Icons";

export function FolderView({ folder, outputs, onUpload, onGenerate, onOpenOutput }) {
  return (
    <div>
      <div className="folder-view-header">
        <div>
          <div className="folder-view-title">{folder.name}</div>
          <div className="folder-view-sub">{folder.files} files · last edited {folder.edited}</div>
        </div>
        <div className="folder-view-actions">
          <Btn variant="secondary" onClick={onUpload}><Ic n="upload" s={14}/> Upload files</Btn>
          <Btn variant="primary" onClick={onGenerate}><Ic n="sparkles" s={14}/> Generate output</Btn>
        </div>
      </div>

      <div className="slabel gap-12">SOURCE FILES</div>
      <div className="gap-28">
        <div className="source-row">
          <div className="file-type-badge file-type-badge-pdf">PDF</div>
          <div className="file-info">
            <div className="file-name">Lecture_07_Subject1.pdf</div>
            <div className="file-size">2.4 MB · Uploading...</div>
            <div className="upload-bar"><div className="upload-bar-fill" style={{ width: "60%" }} /></div>
          </div>
          <Ic n="x" s={14} c="var(--muted)" />
        </div>
        
        <div className="source-row">
          <div className="file-type-badge file-type-badge-ppt">PPT</div>
          <div className="file-info">
            <div className="file-name">Chapter4_Slides.pptx</div>
            <div className="file-size">4.1 MB · Ready</div>
          </div>
          <div className="flex-center row-gap-10">
            <Ic n="check" s={14} c="var(--success)" />
            <Ic n="x" s={14} c="var(--muted)" />
          </div>
        </div>
      </div>

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

function ArtifactCard({ item, onClick }) {
  const typeMap = {
    Flashcard: { i: "flashcard", bg: "linear-gradient(135deg, #eaecff, #c3bee9)", typeBg: "rgba(140,152,228,.14)", c: "#6b77cc" },
    MCQ:       { i: "mcq",       bg: "linear-gradient(135deg, #fce4f1, #f5cae8)", typeBg: "rgba(245,202,232,.5)",  c: "#9d3a7a" },
    Summary:   { i: "summary",   bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)", typeBg: "#d1fae5",               c: "#059669" },
    FIB:       { i: "fib",       bg: "linear-gradient(135deg, #fef3c7, #fde68a)", typeBg: "#fef3c7",               c: "#db6e1b" }
  };
  const style = typeMap[item.type] || typeMap.Flashcard;

  return (
    <div className="artifact-card" onClick={onClick}>
      <div className="artifact-thumb" style={{ background: style.bg }}>
        <Ic n={style.i} s={32} c={style.c} />
      </div>
      <div className="artifact-body">
        <div className="artifact-name">{item.name}</div>
        <div className="artifact-time">Created {item.created}</div>
        
        <span className="badge" style={{ background: style.typeBg, color: style.c }}>
          {item.type}
        </span>
      </div>
    </div>
  );
}