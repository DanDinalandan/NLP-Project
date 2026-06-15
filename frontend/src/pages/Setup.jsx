import { useEffect, useRef, useState } from "react";
import { settingsApi } from "../api/settings.js";
import { useStore }    from "../store/useStore.js";

const MODELS = [
  { id: "llama3.2:3b", label: "Llama 3.2 3B",  size: "~2 GB", minRam: 8,  tag: "Recommended for 8 GB RAM" },
  { id: "llama3.1:8b", label: "Llama 3.1 8B",  size: "~5 GB", minRam: 16, tag: "Best quality — 16 GB+ RAM" },
  { id: "phi3:mini",   label: "Phi-3 Mini",     size: "~2 GB", minRam: 6,  tag: "Lightweight — low-RAM devices" },
];

export function Setup({ onDone }) {
  const dismissSetup = useStore(s => s.dismissSetup);

  const [step,        setStep]       = useState(0); // 0 welcome 1 ollama 2 model 3 done
  const [ollamaOk,    setOllamaOk]   = useState(false);
  const [ramGb,       setRamGb]      = useState(0);
  const [recommended, setRecommended] = useState("llama3.2:3b");
  const [existingModels, setExistingModels] = useState([]);

  const [selectedModel, setSelectedModel] = useState(null);
  const [pullJobId,      setPullJobId]      = useState(null);
  const [pullProgress,   setPullProgress]   = useState(0);
  const [pullStatus,     setPullStatus]     = useState("idle"); // idle starting downloading done error
  const [pullError,      setPullError]      = useState("");

  const [installJobId,   setInstallJobId]   = useState(null);
  const [installProgress,setInstallProgress]= useState(0);
  // idle | downloading | installing | done | error
  const [installStatus,  setInstallStatus]  = useState("idle");
  const [installError,   setInstallError]   = useState("");

  const pollRef     = useRef(null);
  const installPoll = useRef(null);

  // ── Check Ollama status ────────────────────────────────────
  const checkOllama = async () => {
    try {
      const res = await settingsApi.getOllamaStatus();
      setOllamaOk(res.running);
      setRamGb(res.ram_gb ?? 0);
      setRecommended(res.recommended_model ?? "llama3.2:3b");
      setExistingModels(res.models ?? []);
      if (!selectedModel) setSelectedModel(res.recommended_model ?? "llama3.2:3b");
      return res;
    } catch { return null; }
  };

  useEffect(() => { checkOllama(); }, []);

  // ── Poll Ollama every 3 s while on the install step ────────
  useEffect(() => {
    if (step !== 1) return;
    const t = setInterval(checkOllama, 3000);
    return () => clearInterval(t);
  }, [step]);

  // ── Poll pull progress ─────────────────────────────────────
  useEffect(() => {
    if (!pullJobId) return;
    pollRef.current = setInterval(async () => {
      try {
        const s = await settingsApi.getPullStatus(pullJobId);
        setPullProgress(s.progress ?? 0);
        setPullStatus(s.status);
        if (s.status === "done") {
          clearInterval(pollRef.current);
          await checkOllama();
        }
        if (s.status === "error") {
          clearInterval(pollRef.current);
          setPullError(s.error || "Download failed.");
        }
      } catch { /* backend not ready yet */ }
    }, 1500);
    return () => clearInterval(pollRef.current);
  }, [pullJobId]);

  const startPull = async () => {
    if (!selectedModel) return;
    setPullStatus("starting");
    setPullError("");
    try {
      const res = await settingsApi.pullModel(selectedModel);
      setPullJobId(res.job_id);
    } catch {
      setPullStatus("error");
      setPullError("Could not start the download. Make sure Ollama is running.");
    }
  };

  // ── Poll install progress ──────────────────────────────────
  useEffect(() => {
    if (!installJobId) return;
    installPoll.current = setInterval(async () => {
      try {
        const s = await settingsApi.getInstallStatus(installJobId);
        setInstallProgress(s.progress ?? 0);
        setInstallStatus(s.status);
        if (s.status === "done") {
          clearInterval(installPoll.current);
          // Ollama just installed — give it a moment to start then re-check
          setTimeout(checkOllama, 2500);
        }
        if (s.status === "error") {
          clearInterval(installPoll.current);
          setInstallError(s.error || "Installation failed.");
        }
      } catch { /* backend not ready yet */ }
    }, 1000);
    return () => clearInterval(installPoll.current);
  }, [installJobId]);

  const startInstall = async () => {
    setInstallStatus("downloading");
    setInstallProgress(0);
    setInstallError("");
    try {
      const res = await settingsApi.installOllama();
      setInstallJobId(res.job_id);
    } catch {
      setInstallStatus("error");
      setInstallError("Could not start the installer. Make sure you are connected to the internet.");
    }
  };

  const openOllamaSite = () => {
    try {
      import("@tauri-apps/plugin-shell").then(m => m.open("https://ollama.com/download"));
    } catch {
      window.open("https://ollama.com/download", "_blank");
    }
  };

  const finish = () => {
    dismissSetup();
    onDone();
  };

  const skip = () => {
    dismissSetup();
    onDone();
  };

  // ── Auto-advance: if Ollama is running and has models, skip to done ──
  useEffect(() => {
    if (step === 0) return;
    if (ollamaOk && existingModels.length > 0 && step < 3) {
      setStep(3);
    }
  }, [ollamaOk, existingModels]);

  return (
    <div className="setup-shell">
      <div className="setup-card">

        {/* Step indicators */}
        <div className="setup-steps">
          {["Welcome", "Ollama", "AI Model", "Ready"].map((label, i) => (
            <div key={i} className={`setup-step-dot${step === i ? " active" : step > i ? " done" : ""}`}>
              <div className="setup-dot-circle">{step > i ? "✓" : i + 1}</div>
              <div className="setup-dot-label">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div className="setup-body">
            <div className="setup-icon">📚</div>
            <h1 className="setup-title">Welcome to ReviewBot</h1>
            <p className="setup-sub">
              Your offline AI study companion. Upload notes, generate flashcards and quizzes,
              and chat with your own materials — all on your machine, no internet required.
            </p>
            <p className="setup-sub" style={{ marginTop: 8 }}>
              This setup takes about 5 minutes and only happens once.
            </p>
            <button className="setup-btn-primary" onClick={() => setStep(1)}>
              Get started →
            </button>
            <button className="setup-btn-skip" onClick={skip}>
              Skip setup (manual mode only)
            </button>
          </div>
        )}

        {/* ── Step 1: Install Ollama ── */}
        {step === 1 && (
          <div className="setup-body">
            <div className="setup-icon">{ollamaOk ? "✅" : "🤖"}</div>
            <h1 className="setup-title">
              {ollamaOk ? "Ollama is ready!" : "Install Ollama"}
            </h1>

            {/* Already running */}
            {ollamaOk && (
              <>
                <p className="setup-sub">
                  ReviewBot detected Ollama running on your machine. You&apos;re ready to download an AI model.
                </p>
                <button className="setup-btn-primary" onClick={() => setStep(2)}>
                  Continue →
                </button>
              </>
            )}

            {/* Not running — idle (show install button) */}
            {!ollamaOk && installStatus === "idle" && (
              <>
                <p className="setup-sub">
                  Ollama runs AI models locally — no cloud, no subscriptions, fully private.
                  ReviewBot will download and install it automatically. A Windows security
                  prompt may appear; click <strong>Yes</strong> to allow it.
                </p>
                <button className="setup-btn-primary" onClick={startInstall}>
                  Install Ollama automatically →
                </button>
                <button className="setup-btn-skip" onClick={openOllamaSite}>
                  Install manually instead
                </button>
                <button className="setup-btn-skip" onClick={skip}>
                  Skip — use manual mode only
                </button>
              </>
            )}

            {/* Downloading */}
            {!ollamaOk && (installStatus === "downloading") && (
              <>
                <p className="setup-sub">Downloading Ollama installer…</p>
                <div className="setup-progress-wrap">
                  <div className="setup-progress-label">
                    Downloading… {installProgress}%
                  </div>
                  <div className="setup-progress-track">
                    <div className="setup-progress-fill" style={{ width: `${installProgress}%` }} />
                  </div>
                  <div className="setup-progress-hint">~110 MB · please keep this window open</div>
                </div>
              </>
            )}

            {/* Installing */}
            {!ollamaOk && installStatus === "installing" && (
              <>
                <p className="setup-sub">
                  Installing Ollama… A Windows security prompt may appear — click <strong>Yes</strong>.
                </p>
                <div className="setup-polling-hint" style={{ justifyContent: "center" }}>
                  <span className="setup-spinner" /> Installing silently, please wait…
                </div>
              </>
            )}

            {/* Install done — waiting for Ollama to start */}
            {!ollamaOk && installStatus === "done" && (
              <>
                <div className="setup-success-msg">✓ Ollama installed! Waiting for it to start…</div>
                <div className="setup-polling-hint" style={{ justifyContent: "center", marginTop: 12 }}>
                  <span className="setup-spinner" /> Detecting Ollama…
                </div>
              </>
            )}

            {/* Install error */}
            {!ollamaOk && installStatus === "error" && (
              <>
                <div className="setup-error-msg">{installError}</div>
                <button className="setup-btn-primary" onClick={startInstall}>
                  Try again
                </button>
                <button className="setup-btn-skip" onClick={openOllamaSite}>
                  Install manually instead
                </button>
                <button className="setup-btn-skip" onClick={skip}>
                  Skip — use manual mode only
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Step 2: Download model ── */}
        {step === 2 && (
          <div className="setup-body">
            <div className="setup-icon">🧠</div>
            <h1 className="setup-title">Download an AI Model</h1>
            <p className="setup-sub">
              ReviewBot detected <strong>{ramGb} GB</strong> of RAM on your machine.
              {ramGb < 8
                ? " Your RAM is limited — try Phi-3 Mini for the lightest experience."
                : " The recommended model for your system is highlighted below."}
            </p>

            <div className="setup-model-list">
              {MODELS.filter(m => m.minRam <= ramGb || ramGb === 0).map(m => (
                <button
                  key={m.id}
                  className={`setup-model-card${selectedModel === m.id ? " selected" : ""}${m.id === recommended ? " recommended" : ""}`}
                  onClick={() => setSelectedModel(m.id)}
                >
                  <div className="setup-model-name">{m.label}</div>
                  <div className="setup-model-meta">{m.size} · {m.tag}</div>
                  {m.id === recommended && <div className="setup-model-badge">Recommended</div>}
                </button>
              ))}
            </div>

            {pullStatus === "idle" && (
              <button className="setup-btn-primary" onClick={startPull} disabled={!selectedModel}>
                Download {selectedModel} →
              </button>
            )}

            {(pullStatus === "starting" || pullStatus === "downloading") && (
              <div className="setup-progress-wrap">
                <div className="setup-progress-label">
                  Downloading {selectedModel}… {pullProgress}%
                </div>
                <div className="setup-progress-track">
                  <div className="setup-progress-fill" style={{ width: `${pullProgress}%` }} />
                </div>
                <div className="setup-progress-hint">
                  This may take a few minutes depending on your connection speed.
                </div>
              </div>
            )}

            {pullStatus === "done" && (
              <>
                <div className="setup-success-msg">✓ {selectedModel} downloaded successfully!</div>
                <button className="setup-btn-primary" onClick={() => setStep(3)}>
                  Continue →
                </button>
              </>
            )}

            {pullStatus === "error" && (
              <>
                <div className="setup-error-msg">{pullError}</div>
                <button className="setup-btn-primary" onClick={startPull}>
                  Try again
                </button>
              </>
            )}

            <button className="setup-btn-skip" onClick={skip}>
              Skip — I&apos;ll set up the model later
            </button>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 3 && (
          <div className="setup-body">
            <div className="setup-icon">🎉</div>
            <h1 className="setup-title">You&apos;re all set!</h1>
            <p className="setup-sub">
              ReviewBot is ready to go. Upload your notes, generate study materials,
              and start mastering your subjects.
            </p>
            <div className="setup-checklist">
              <div className="setup-check-item">✓ Ollama running locally</div>
              {existingModels.length > 0 && (
                <div className="setup-check-item">✓ AI model ready: {existingModels[0]}</div>
              )}
              <div className="setup-check-item">✓ No internet required to study</div>
            </div>
            <button className="setup-btn-primary" onClick={finish}>
              Start studying →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
