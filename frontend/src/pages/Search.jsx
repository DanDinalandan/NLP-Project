import { useState, useEffect } from "react";
import { Badge }      from "../components/ui/Badge.jsx";
import { Btn }        from "../components/ui/Btn.jsx";
import { Ic }         from "../components/ui/Icons.jsx";
import { SLabel }     from "../components/ui/SLabel.jsx";
import { searchApi }  from "../api/search.js";
import { useStore }   from "../store/useStore.js";

const RESULT_TYPES = {
  Flashcard: { i: "flashcard", bg: "linear-gradient(135deg, #eaecff, #c3bee9)", typeBg: "rgba(140,152,228,.14)", c: "#6b77cc" },
  MCQ:       { i: "mcq",       bg: "linear-gradient(135deg, #fce4f1, #f5cae8)", typeBg: "rgba(245,202,232,.5)",  c: "#9d3a7a" },
  Summary:   { i: "summary",   bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)", typeBg: "#d1fae5",               c: "#059669" },
  FIB:       { i: "fib",       bg: "linear-gradient(135deg, #fef3c7, #fde68a)", typeBg: "#fef3c7",               c: "#b45309" },
  QA:        { i: "qa",        bg: "linear-gradient(135deg, #e0daf5, #c3bee9)", typeBg: "rgba(140,152,228,.14)", c: "var(--text2)" },
};

function normalizeResult(r) {
  return {
    id:    r.id,
    title: r.folder_name ?? r.title ?? r.name ?? 'Untitled',
    by:    r.author ?? r.username ?? r.by ?? '',
    type:  'Reviewer',
    time:  r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
  };
}

export function Search() {
  const [mode,      setMode]    = useState("Files");
  const [q,         setQ]       = useState("");
  const [results,   setResults] = useState([]);
  const [loading,   setLoading] = useState(false);
  const [error,     setError]   = useState(null);
  const [online,    setOnline]  = useState(navigator.onLine);
  const [dlBusy,    setDlBusy]  = useState(null); // reviewer id being downloaded

  const unlockAchievement = useStore(s => s.unlockAchievement);

  const downloadReviewer = async (r) => {
    setDlBusy(r.id);
    try {
      const data = await searchApi.getContent(r.id);
      const content = data.content_markdown ?? '';
      const blob = new Blob([content], { type: 'text/markdown' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `${(data.folder_name ?? r.title ?? 'reviewer').replace(/\s+/g, '_')}.md`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      unlockAchievement('download_reviewer');
    } catch {
      // silently ignore — network may be flaky
    } finally {
      setDlBusy(null);
    }
  };

  // Track network status
  useEffect(() => {
    const onOnline  = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Debounced search — fires 400 ms after the user stops typing
  useEffect(() => {
    if (!online || !q.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchApi.search(q);
        setResults(Array.isArray(data) ? data.map(normalizeResult) : []);
      } catch {
        setError("Could not reach the server. Check your connection.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [q, online]);

  const showEmpty = online && q.trim() && !loading && results.length === 0 && !error;

  return (
    <>
      <div className="section-header">
        <SLabel>Search Public Files &amp; Users</SLabel>
        <span className="section-header-sub">
          {online && results.length > 0 && `${results.length} result${results.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Offline banner */}
      {!online && (
        <div className="search-offline-banner gap-14">
          <Ic n="shield" s={15} />
          You&rsquo;re offline — connect to the internet to search public study materials.
        </div>
      )}

      {/* Search bar */}
      <div className={`search-bar-big gap-14${!online ? ' search-bar-disabled' : ''}`}>
        <Ic n="search" s={16} c="var(--muted)" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={online ? "Search for study materials, folders, users..." : "Go online to search…"}
          disabled={!online}
        />
        {loading && <span className="search-loading-hint">Searching…</span>}
      </div>

      {/* Mode toggles */}
      <div className="search-toggles gap-20">
        {["Files", "Users"].map(m => (
          <button
            key={m}
            className={`search-toggle${mode === m ? " active" : ""}`}
            onClick={() => setMode(m)}
          >
            <Ic n={m === "Files" ? "files" : "users"} s={13} />
            {m}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="search-error-msg gap-20">
          <Ic n="hint" s={14} /> {error}
        </div>
      )}

      {/* Empty state */}
      {showEmpty && (
        <div className="empty-outputs mt-12">
          <Ic n="search" s={32} c="var(--lav)" />
          <div className="empty-outputs-title">No results found</div>
          <div className="empty-outputs-sub">Try a different search term</div>
        </div>
      )}

      {/* Offline idle state */}
      {!online && !q && (
        <div className="search-offline-idle">
          <Ic n="search" s={36} c="var(--lav)" />
          <div className="search-offline-title">You&rsquo;re offline</div>
          <div className="search-offline-sub">
            Public search requires an internet connection. Your local files are still available in Study Files.
          </div>
        </div>
      )}

      {/* Results list */}
      {results.map(r => {
        const style = RESULT_TYPES[r.type] || RESULT_TYPES.Summary;
        return (
          <div key={r.id} className="result-card">
            <div className="result-thumb" style={{ background: style.bg }}>
              <Ic n={style.i} s={20} c={style.c} />
            </div>
            <div className="result-info">
              <div className="result-name">{r.title}</div>
              {r.by   && <div className="result-meta">by {r.by}</div>}
              {r.time && <div className="result-meta">{r.time}</div>}
            </div>
            <div className="result-badges">
              <Badge bg={style.typeBg} cl={style.c}>{r.type}</Badge>
              <Badge bg="#d1fae5" cl="#059669">Public</Badge>
            </div>
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => downloadReviewer(r)}
              disabled={dlBusy === r.id}
              title="Download as Markdown"
            >
              <Ic n="download" s={13} />
              {dlBusy === r.id ? '…' : 'Download'}
            </Btn>
          </div>
        );
      })}
    </>
  );
}
