import { useEffect, useState, Component } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#c0392b' }}>
          <strong>App crashed — open DevTools (F12) Console for the full trace.</strong>
          <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap', fontSize: 13 }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 16px' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { QAChat } from "./components/QAChat";
import { AchievementToast } from "./components/AchievementToast";
import { Setup } from "./pages/Setup";
import { useStore } from "./store/useStore.js";
import { settingsApi } from "./api/settings.js";

import { Dashboard } from "./pages/Dashboard";
import { Progress } from "./pages/Progress";
import { StudyFiles } from "./pages/studyfiles/StudyFiles";
import { Search } from "./pages/Search";
import { Settings } from "./pages/Settings";

export default function App() {
  const fetchFolders    = useStore(s => s.fetchFolders);
  const loadUserProfile = useStore(s => s.loadUserProfile);
  const doCheckin       = useStore(s => s.doCheckin);
  const theme           = useStore(s => s.theme);
  const setupDismissed  = useStore(s => s.setupDismissed);

  // null = checking, true = show wizard, false = skip wizard
  const [showSetup, setShowSetup] = useState(null);

  useEffect(() => {
    fetchFolders();
    loadUserProfile();
    doCheckin();
  }, []); // eslint-disable-line

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme ?? 'light');
  }, [theme]);

  // Decide whether to show the setup wizard on launch
  useEffect(() => {
    if (setupDismissed) { setShowSetup(false); return; }
    settingsApi.getOllamaStatus()
      .then(res => {
        // Skip wizard if Ollama is already running with at least one model
        const ready = res?.running && res?.models?.length > 0;
        setShowSetup(!ready);
      })
      .catch(() => setShowSetup(true)); // backend not up yet — show wizard
  }, []); // eslint-disable-line

  // Still checking — render nothing to avoid flash
  if (showSetup === null) return null;

  if (showSetup) return <Setup onDone={() => setShowSetup(false)} />;

  return (
    <ErrorBoundary>
    <div className="app-shell">
      <Sidebar />

      <div className="app-main">
        <Topbar />

        <main className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/studyfiles/*" element={<StudyFiles />} />
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>

    <QAChat />
    <AchievementToast />

    </div>
    </ErrorBoundary>
  );
}