import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { QAChat } from "./components/QAChat";
import { AchievementToast } from "./components/AchievementToast";
import { useStore } from "./store/useStore.js";

import { Dashboard } from "./pages/Dashboard";
import { Progress } from "./pages/Progress";
import { StudyFiles } from "./pages/studyfiles/StudyFiles";
import { Search } from "./pages/Search";
import { Settings } from "./pages/Settings";

export default function App() {
  const fetchFolders = useStore(s => s.fetchFolders);
  const theme        = useStore(s => s.theme);

  useEffect(() => { fetchFolders(); }, []); // eslint-disable-line

  // Keep HTML attribute in sync with persisted theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme ?? 'light');
  }, [theme]);

  return (
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
  );
}