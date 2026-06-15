import { useState, useEffect } from "react";
import { Ic }         from "../../components/ui/Icons";
import { Btn }        from "../../components/ui/Btn";
import { Toggle }     from "../../components/ui/Toggle";
import { useStore }   from "../../store/useStore.js";
import { settingsApi }from "../../api/settings.js";

export function GenerateModal({ folder, onClose, onUpload }) {
  const triggerGenerate = useStore(s => s.triggerGenerate);
  const sourceFilesMap  = useStore(s => s.sourceFiles);
  const allFiles        = sourceFilesMap[folder?.id] ?? [];
  // All files are selectable — Done files can be re-generated to add/refresh outputs
  const pendingFiles    = allFiles;

  // File selection — default all pending selected
  const [selectedIds, setSelectedIds] = useState(() => pendingFiles.map(f => f.id));

  // Sync if pending files change after modal opens
  useEffect(() => {
    setSelectedIds(pendingFiles.map(f => f.id));
  }, [pendingFiles.length]); // eslint-disable-line

  // Which output types to generate
  const [genFC,  setGenFC]  = useState(true);
  const [genMCQ, setGenMCQ] = useState(true);
  const [genFIB, setGenFIB] = useState(true);
  const [genSum, setGenSum] = useState(true);

  // Output options
  const [fcCount,  setFcCount]  = useState(10);
  const [fcMax,    setFcMax]    = useState(false);
  const [mcqCount, setMcqCount] = useState(10);
  const [mcqMax,   setMcqMax]   = useState(false);
  const [fibCount, setFibCount] = useState(5);
  const [fibMax,   setFibMax]   = useState(false);
  const [sumKw,    setSumKw]    = useState(true);

  const [ollamaOk, setOllama] = useState(null);
  const [busy,     setBusy]   = useState(false);

  useEffect(() => {
    settingsApi.getOllamaStatus()
      .then(res => setOllama(res?.running === true))
      .catch(() => setOllama(false));
  }, []);

  const allSelected = selectedIds.length === pendingFiles.length && pendingFiles.length > 0;
  const toggleAll   = () =>
    setSelectedIds(allSelected ? [] : pendingFiles.map(f => f.id));
  const toggleFile  = (id) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  // Rough time estimate: ~3–7 min per file
  const selCount = selectedIds.length;
  const estMin   = Math.max(2, selCount * 3);
  const estMax   = Math.max(5, selCount * 7);

  const handleGenerate = async () => {
    if (!ollamaOk || !selectedIds.length) return;
    setBusy(true);
    const options = {
      generate_flashcards: genFC,
      generate_mcqs:       genMCQ,
      generate_fibs:       genFIB,
      generate_summary:    genSum,
      flashcard_count:  fcMax  ? 50  : Math.min(50,  Math.max(1, Number(fcCount))),
      mcq_count:        mcqMax ? 50  : Math.min(50,  Math.max(1, Number(mcqCount))),
      fib_count:        fibMax ? 20  : Math.min(20,  Math.max(1, Number(fibCount))),
      summary_keywords: sumKw,
    };
    try {
      await triggerGenerate(folder.id, selectedIds, options);
    } finally {
      setBusy(false);
      onClose();
    }
  };

  const anyOutputSelected = genFC || genMCQ || genFIB || genSum;
  const canGenerate = !!ollamaOk && !busy && selectedIds.length > 0 && anyOutputSelected;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-box-large" onClick={e => e.stopPropagation()}>
        <div className="modal-body">

          {/* Ollama status */}
          {ollamaOk === null && (
            <div className="ollama-status-bar ollama-checking">
              <Ic n="clock" s={14} /> Checking Ollama…
            </div>
          )}
          {ollamaOk === false && (
            <div className="ollama-status-bar ollama-error">
              <Ic n="hint" s={14} /> Ollama is not running. Start it to enable AI generation.
            </div>
          )}
          {ollamaOk === true && (
            <div className="ollama-status-bar ollama-ok">
              <Ic n="check" s={14} /> Ollama ready
            </div>
          )}

          <div className="generate-grid">

            {/* ── Left: File selection ── */}
            <div>
              <div className="slabel gap-8">FILES TO PROCESS</div>

              {allFiles.length === 0 ? (
                <div className="gen-no-files">
                  <Ic n="upload" s={28} c="var(--lav)" />
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>No files uploaded yet.</div>
                  {onUpload && (
                    <button className="gen-upload-link" onClick={() => { onClose(); onUpload(); }}>
                      + Upload files
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="gen-files-header">
                    {pendingFiles.length > 0 && (
                      <label className="gen-select-all" style={{ flex: 1 }}>
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                        <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
                        <span className="gen-sel-count">
                          {selectedIds.length} / {pendingFiles.length} selected
                        </span>
                      </label>
                    )}
                    {onUpload && (
                      <button className="gen-upload-link" onClick={() => { onClose(); onUpload(); }}>
                        + Upload more
                      </button>
                    )}
                  </div>
                  <div className="gen-file-list">
                    {allFiles.map(f => {
                      const isFailed    = f.status === 'error';
                      const isCancelled = isFailed && f.error_message === '[Cancelled]';
                      const isDone      = f.status === 'done';
                      return (
                        <label key={f.id} className="gen-file-row">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(f.id)}
                            onChange={() => toggleFile(f.id)}
                          />
                          <span className="gen-file-ext">{f.file_type?.toUpperCase()}</span>
                          <span className="gen-file-name">{f.original_name}</span>
                          {isDone && !isFailed && (
                            <span className="gen-done-tag">Done — re-generate?</span>
                          )}
                          {isFailed && (
                            <span className="gen-done-tag" style={{ color: 'var(--danger)' }}>
                              {isCancelled ? 'Cancelled' : 'Failed'} — retry?
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </>
              )}

              {selectedIds.length > 0 && (
                <div className="gen-time-est">
                  <Ic n="clock" s={13} />
                  Est. {estMin}–{estMax} min · Your laptop will run warm
                </div>
              )}
            </div>

            {/* ── Right: Output settings ── */}
            <div>
              <div className="slabel gap-8">OUTPUT SETTINGS</div>
              {!anyOutputSelected && (
                <div className="gen-warn">Select at least one output type.</div>
              )}
              <div className="card options-card">

                <OutputTypeRow
                  label="Flashcards" icon="flashcard"
                  enabled={genFC} onToggle={() => setGenFC(v => !v)}
                >
                  <CountOption
                    value={fcCount}  onChange={setFcCount}
                    max={100} isMax={fcMax} onToggleMax={() => setFcMax(v => !v)}
                    disabled={!genFC}
                  />
                </OutputTypeRow>

                <OutputTypeRow
                  label="MCQ" icon="mcq"
                  enabled={genMCQ} onToggle={() => setGenMCQ(v => !v)}
                >
                  <CountOption
                    value={mcqCount} onChange={setMcqCount}
                    max={100} isMax={mcqMax} onToggleMax={() => setMcqMax(v => !v)}
                    disabled={!genMCQ}
                  />
                </OutputTypeRow>

                <OutputTypeRow
                  label="Fill-in-blanks" icon="fib"
                  enabled={genFIB} onToggle={() => setGenFIB(v => !v)}
                >
                  <CountOption
                    value={fibCount} onChange={setFibCount}
                    max={50} isMax={fibMax} onToggleMax={() => setFibMax(v => !v)}
                    disabled={!genFIB}
                  />
                </OutputTypeRow>

                <OutputTypeRow
                  label="Summary PDF" icon="summary"
                  enabled={genSum} onToggle={() => setGenSum(v => !v)}
                >
                  <label className="count-max-toggle" style={{ opacity: genSum ? 1 : 0.4 }}>
                    <input type="checkbox" checked={sumKw} disabled={!genSum}
                      onChange={() => setSumKw(v => !v)} />
                    Extract keywords
                  </label>
                </OutputTypeRow>

              </div>

              <div className="flex-end-row" style={{ marginTop: 20 }}>
                <Btn variant="ghost" onClick={onClose}>Back</Btn>
                <Btn
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  title={
                    !ollamaOk           ? 'Ollama must be running'          :
                    !selectedIds.length ? 'Select at least one file'        :
                    !anyOutputSelected  ? 'Select at least one output type' : undefined
                  }
                >
                  <Ic n="sparkles" s={14} />
                  {(() => {
                    if (busy)            return 'Starting…';
                    if (!ollamaOk)       return 'Checking…';
                    const outCount = [genFC, genMCQ, genFIB, genSum].filter(Boolean).length;
                    return `Generate — ${selCount} source file${selCount !== 1 ? 's' : ''}, ${outCount} output type${outCount !== 1 ? 's' : ''}`;
                  })()}
                </Btn>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function OutputTypeRow({ label, icon, enabled, onToggle, children }) {
  return (
    <div className="opt-row" style={{ opacity: enabled ? 1 : 0.5 }}>
      <label className="opt-label" style={{ cursor: 'pointer', userSelect: 'none' }}>
        <input type="checkbox" checked={enabled} onChange={onToggle} style={{ marginRight: 7 }} />
        <Ic n={icon} s={14} c={enabled ? 'var(--blue)' : 'var(--muted)'} />
        {' '}{label}
      </label>
      <div style={{ pointerEvents: enabled ? 'auto' : 'none' }}>
        {children}
      </div>
    </div>
  );
}

function CountOption({ value, onChange, max, isMax, onToggleMax, disabled }) {
  return (
    <div className="count-opt">
      <input
        className="count-input"
        type="number"
        min={1}
        max={max}
        value={isMax ? max : value}
        disabled={isMax || disabled}
        onChange={e => onChange(Math.min(max, Math.max(1, Number(e.target.value))))}
      />
      <label className="count-max-toggle">
        <input type="checkbox" checked={isMax} disabled={disabled} onChange={onToggleMax} />
        Max ({max})
      </label>
    </div>
  );
}
