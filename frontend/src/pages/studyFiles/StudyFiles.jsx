import { useState, useEffect } from "react";
import { FolderView }     from "./FolderView.jsx";
import { UploadModal }    from "./UploadModal.jsx";
import { NewFolderModal } from "./NewFolderModal.jsx";
import { GenerateModal }  from "./GenerateModal.jsx";
import { FlashcardList }  from "./outputs/FlashcardList.jsx";
import { MCQList }        from "./outputs/MCQList.jsx";
import { FIBList }        from "./outputs/FIBList.jsx";
import { ContentViewer }  from "./outputs/ContentViewer.jsx";
import { Badge }          from "../../components/ui/Badge.jsx";
import { Btn }            from "../../components/ui/Btn.jsx";
import { Card }           from "../../components/ui/Card.jsx";
import { Ic }             from "../../components/ui/Icons.jsx";
import { SLabel }         from "../../components/ui/SLabel.jsx";
import { useStore }       from "../../store/useStore.js";

const OUTPUT_VIEWERS = {
  Flashcard: FlashcardList,
  MCQ:       MCQList,
  FIB:       FIBList,
  Summary:   ContentViewer,
  Reviewer:  ContentViewer,
};

export function StudyFiles() {
  const [view,          setView]     = useState("browser");
  const [activeOutput,  setOutput]   = useState(null);
  const [showUpload,    setUpload]   = useState(false);
  const [showGen,       setGen]      = useState(false);
  const [showNewFolder, setNewFolder]= useState(false);

  const files      = useStore(s => s.files);
  const folders    = useStore(s => s.folders);
  const fetchSrc   = useStore(s => s.fetchSourceFiles);
  const loadOutputs= useStore(s => s.loadFolderOutputs);

  // Derive activeFolder from the store so patchFolder/renameFolder updates are reflected immediately
  const storeActiveFolderId = useStore(s => s.activeFolderId);
  const activeFolder = folders.find(f => f.id === storeActiveFolderId) ?? null;

  const openFolder = async folder => {
    useStore.setState({ activeFolderId: folder.id });
    setView("folder");
    await Promise.all([fetchSrc(folder.id), loadOutputs(folder.id)]);
  };

  // On mount: if Dashboard/Sidebar set pendingFolderOpen, open that folder immediately
  useEffect(() => {
    const pending = useStore.getState().pendingFolderOpen;
    if (!pending) return;
    useStore.setState({ pendingFolderOpen: null });
    const folder = useStore.getState().folders.find(f => f.id === pending);
    if (folder) openFolder(folder);
  }, []); // eslint-disable-line

  // Auto-poll files mid-generation every 2 s — only dep is folder ID to avoid restarts
  useEffect(() => {
    if (!activeFolder?.id) return;
    const fid = activeFolder.id;
    const intervalId = setInterval(async () => {
      const srcFiles = useStore.getState().sourceFiles[fid] ?? [];
      const inProgress = srcFiles.filter(
        f => !['done', 'error', 'pending'].includes(f.status)
      );
      if (!inProgress.length) return;
      await Promise.all(inProgress.map(f =>
        useStore.getState().pollSourceFile(fid, f.id).catch(() => {})
      ));
      // Reload outputs once all files reach terminal state
      const allTerminal = (useStore.getState().sourceFiles[fid] ?? [])
        .every(f => ['done', 'error', 'pending'].includes(f.status));
      if (allTerminal) useStore.getState().loadFolderOutputs(fid);
    }, 2000);
    return () => clearInterval(intervalId);
  }, [activeFolder?.id]); // eslint-disable-line
  const openOutput = output => { setOutput(output); setView("output"); };
  const backTo     = dest   => { setView(dest); setOutput(null); };

  const OutputViewer = activeOutput
    ? (OUTPUT_VIEWERS[activeOutput.type] ?? Flashcards)
    : null;

  return (
    <>
      {/* Modals */}
      {showNewFolder && (
        <NewFolderModal
          onClose={() => setNewFolder(false)}
          onCreated={(folder) => { setNewFolder(false); openFolder(folder); }}
        />
      )}
      {showUpload && (
        <UploadModal folder={activeFolder} onClose={() => setUpload(false)} />
      )}
      {showGen && (
        <GenerateModal
          folder={activeFolder}
          onClose={() => setGen(false)}
          onUpload={() => { setGen(false); setUpload(true); }}
        />
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
        <FolderBrowser onOpenFolder={openFolder} onNewFolder={() => setNewFolder(true)} />
      )}

      {view === "folder" && activeFolder && (
        <FolderView
          folder={activeFolder}
          outputs={files[activeFolder.id] ?? []}
          onUpload={() => setUpload(true)}
          onGenerate={() => setGen(true)}
          onOpenOutput={openOutput}
          onDelete={() => backTo('browser')}
          onOutputsChanged={() => loadOutputs(activeFolder.id)}
        />
      )}

      {view === "output" && OutputViewer && (
        <OutputViewer output={activeOutput} onBack={() => backTo("folder")} />
      )}
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