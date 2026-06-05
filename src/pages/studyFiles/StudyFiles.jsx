import { useState }       from "react";
import { FolderView }     from "./FolderView.jsx";
import { UploadModal }    from "./UploadModal.jsx";
import { GenerateModal }  from "./GenerateModal.jsx";
import { Flashcards }     from "./outputs/Flashcards.jsx";
import { MCQ }            from "./outputs/MCQ.jsx";
import { FillInBlanks }   from "./outputs/FIB.jsx";
import { SummaryPDF }     from "./outputs/SummaryPDF.jsx";
import { Badge }          from "../../components/ui/Badge.jsx";
import { Btn }            from "../../components/ui/Btn.jsx";
import { Card }           from "../../components/ui/Card.jsx";
import { Ic }             from "../../components/ui/Icons.jsx";
import { SLabel }         from "../../components/ui/SLabel.jsx";
import { useStore }       from "../../store/useStore.js";

const OUTPUT_VIEWERS = {
  Flashcard: Flashcards,
  MCQ:       MCQ,
  FIB:       FillInBlanks,
  Summary:   SummaryPDF,
};

export function StudyFiles() {
  const [view,         setView]   = useState("browser");
  const [activeFolder, setFolder] = useState(null);
  const [activeOutput, setOutput] = useState(null);
  const [showUpload,   setUpload] = useState(false);
  const [showGen,      setGen]    = useState(false);

  // Pull the files dictionary directly from the Zustand global store
  const files = useStore(state => state.files);

  const openFolder = folder => { setFolder(folder); setView("folder"); };
  const openOutput = output => { setOutput(output); setView("output"); };
  const backTo     = dest   => { setView(dest); setOutput(null); };

  const OutputViewer = activeOutput
    ? (OUTPUT_VIEWERS[activeOutput.type] ?? Flashcards)
    : null;

  return (
    <>
      {/* Modals */}
      {showUpload && (
        <UploadModal folder={activeFolder} onClose={() => setUpload(false)} />
      )}
      {showGen && (
        <GenerateModal folder={activeFolder} onClose={() => setGen(false)} />
      )}

      {/* Breadcrumb */}
      {view !== "browser" && (
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => backTo("browser")}>
            Study Files
          </button>
          {activeFolder && (
            <>
              <Ic n="cR" s={13} />
              <span
                className={view === "output" ? "breadcrumb-link" : "breadcrumb-current"}
                onClick={() => view === "output" && backTo("folder")}
                style={{ cursor: view === "output" ? "pointer" : "default" }}
              >
                {activeFolder.name}
              </span>
            </>
          )}
          {activeOutput && (
            <>
              <Ic n="cR" s={13} />
              <span className="breadcrumb-current">{activeOutput.name}</span>
            </>
          )}
        </div>
      )}

      {/* Views */}
      {view === "browser" && (
        <FolderBrowser onOpenFolder={openFolder} onNewFolder={() => setUpload(true)} />
      )}

      {view === "folder" && activeFolder && (
        <FolderView
          folder={activeFolder}
          // Dynamically pass only the files that belong to the active folder
          outputs={files[activeFolder.id] ?? []} 
          onUpload={() => setUpload(true)}
          onGenerate={() => setGen(true)}
          onOpenOutput={openOutput}
        />
      )}

      {view === "output" && OutputViewer && <OutputViewer />}
    </>
  );
}

/* ── Folder browser ────────────────────────────────────────── */
function FolderBrowser({ onOpenFolder, onNewFolder }) {
  // Read folders from the global store, not mockData
  const folders = useStore(state => state.folders); 

  return (
    <>
      <div className="section-header gap-18">
        <SLabel>All Folders</SLabel>
        <Btn variant="primary" size="sm" onClick={onNewFolder}>
          <Ic n="plus" s={13} /> New folder
        </Btn>
      </div>
      <div className="folder-grid">
        {folders.map(f => (
          <FolderCard key={f.id} folder={f} onClick={() => onOpenFolder(f)} />
        ))}
        <NewFolderCard onClick={onNewFolder} />
      </div>
    </>
  );
}

function FolderCard({ folder, onClick }) {
  const bc = folder.pub
    ? { bg: "#d1fae5", cl: "#059669" }
    : { bg: "rgba(140,152,228,.14)", cl: "#6b77cc" };

  return (
    <Card onClick={onClick} className="folder-card-inner">
      <div className="folder-icon-wrap">
        <Ic n="folder" s={20} />
      </div>
      <div className="folder-name">{folder.name}</div>
      <div className="folder-meta">{folder.files} files · last edited {folder.edited}</div>
      <Badge bg={bc.bg} cl={bc.cl}>{folder.pub ? "Public" : "Private"}</Badge>
    </Card>
  );
}

function NewFolderCard({ onClick }) {
  return (
    <div className="new-folder-card" onClick={onClick}>
      <Ic n="plus" s={22} />
      <div className="new-folder-label">New folder</div>
    </div>
  );
}