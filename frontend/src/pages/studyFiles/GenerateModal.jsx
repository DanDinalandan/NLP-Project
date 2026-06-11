import { useState, useEffect } from "react";
import { Ic }        from "../../components/ui/Icons";
import { Btn }       from "../../components/ui/Btn";
import { Toggle }    from "../../components/ui/Toggle";
import { PillGroup } from "../../components/ui/PillGroup";
import { useStore }  from "../../store/useStore.js";
import { settingsApi } from "../../api/settings.js";

export function GenerateModal({ folder, onClose }) {
  const [type,     setType]   = useState("Flashcards");
  const [diff,     setDiff]   = useState("Easy");
  const [cards,    setCards]  = useState("10");
  const [kw,       setKw]     = useState(true);
  const [busy,     setBusy]   = useState(false);
  // null = checking, true = running, false = not detected
  const [ollamaOk, setOllama] = useState(null);

  const triggerGenerate = useStore(s => s.triggerGenerate);
  const sourceFiles     = useStore(s => s.sourceFiles[folder?.id] ?? []);

  // Check Ollama status when the modal opens
  useEffect(() => {
    settingsApi.getOllamaStatus()
      .then(res => setOllama(res?.running === true))
      .catch(() => setOllama(false));
  }, []);

  const handleGenerate = async () => {
    if (!folder || !ollamaOk) return;
    setBusy(true);
    try {
      await triggerGenerate(folder.id);
    } finally {
      setBusy(false);
      onClose();
    }
  };

  const canGenerate = !!ollamaOk && !busy && sourceFiles.length > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-box-large" onClick={e => e.stopPropagation()}>
        <div className="modal-body">
          <div className="stepper">
            <div className="step done"><div className="step-dot"><Ic n="check" s={12}/></div> Upload files</div>
            <div className="step-line"></div>
            <div className="step cur"><div className="step-dot">2</div> Generate</div>
          </div>

          {/* Ollama status bar */}
          {ollamaOk === null && (
            <div className="ollama-status-bar ollama-checking">
              <Ic n="clock" s={14} /> Checking Ollama status…
            </div>
          )}
          {ollamaOk === false && (
            <div className="ollama-status-bar ollama-error">
              <Ic n="hint" s={14} />
              Ollama is not running. Start Ollama on your machine to enable AI generation.
            </div>
          )}
          {ollamaOk === true && (
            <div className="ollama-status-bar ollama-ok">
              <Ic n="check" s={14} /> Ollama detected — ready to generate
            </div>
          )}

          <div className="generate-grid">
            {/* Left Col: Upload Zone */}
            <div>
              <div className="drop-zone gap-20">
                <div className="drop-icon"><Ic n="upload" s={28} /></div>
                <div className="drop-title">Drop your files here</div>
                <div className="drop-sub">or click to browse from your device</div>
                <div className="format-pills">
                  {["PDF", "TXT", "PPTX", "CSV"].map(f => (
                    <div key={f} className="format-pill">{f}</div>
                  ))}
                </div>
              </div>
              <div className="slabel gap-8">UPLOADED FILES</div>
              {sourceFiles.length === 0 && (
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>No files uploaded yet.</div>
              )}
              {sourceFiles.map(f => (
                <div key={f.id} className="source-row">
                  <div className="file-type-badge file-type-badge-pdf">{f.file_type?.toUpperCase()}</div>
                  <div className="file-info">
                    <div className="file-name">{f.original_name}</div>
                    <div className="file-size">{f.status === 'pending' ? 'Ready' : f.status}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Col: Output Options */}
            <div>
              <div className="slabel gap-8">CHOOSE OUTPUT TYPE</div>
              <div className="output-type-grid">
                <TypeCard t="Flashcards"    i="flashcard" d="Key terms with context-aware definitions"  s={type} set={setType} />
                <TypeCard t="MCQ"           i="mcq"       d="Multiple choice questions from content"    s={type} set={setType} />
                <TypeCard t="Fill-in-blanks"i="fib"       d="Critical keywords removed from sentences"  s={type} set={setType} />
                <TypeCard t="Summary PDF"   i="summary"   d="Abstractive summary with bullet points"    s={type} set={setType} />
              </div>

              <div className="slabel gap-8">OPTIONS</div>
              <div className="card options-card gap-20">
                <div className="opt-row">
                  <div className="opt-label">Number of cards</div>
                  <PillGroup options={["10", "20", "30"]} value={cards} onChange={setCards} />
                </div>
                <div className="opt-row">
                  <div className="opt-label">Difficulty</div>
                  <PillGroup options={["Easy", "Medium", "Hard"]} value={diff} onChange={setDiff} />
                </div>
                <div className="opt-row">
                  <div className="opt-label">Extract keywords</div>
                  <Toggle checked={kw} onChange={() => setKw(!kw)} />
                </div>
              </div>

              <div className="flex-end-row">
                <Btn variant="ghost" onClick={onClose}>Back</Btn>
                <Btn
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  title={
                    !ollamaOk     ? "Ollama must be running to generate" :
                    !sourceFiles.length ? "Upload at least one file first" : undefined
                  }
                >
                  <Ic n="sparkles" s={14} />
                  {busy ? 'Starting…' : ollamaOk === null ? 'Checking…' : 'Generate'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeCard({ t, i, d, s, set }) {
  return (
    <div className={`output-type-card${s === t ? " selected" : ""}`} onClick={() => set(t)}>
      <div className="output-type-header">
        <Ic n={i} s={16} c={s === t ? "var(--blue)" : "var(--lav)"} /> {t}
      </div>
      <div className="output-type-desc">{d}</div>
    </div>
  );
}
