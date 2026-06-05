import { useState } from "react";
import { Badge }    from "../components/ui/Badge.jsx";
import { Ic }       from "../components/ui/Icons.jsx";
import { SLabel }   from "../components/ui/SLabel.jsx";
import { SEARCH_RES } from "../data/mockData.js";

const RESULT_TYPES = {
  Flashcard: { i: "flashcard", bg: "linear-gradient(135deg, #eaecff, #c3bee9)", typeBg: "rgba(140,152,228,.14)", c: "#6b77cc" },
  MCQ:       { i: "mcq",       bg: "linear-gradient(135deg, #fce4f1, #f5cae8)", typeBg: "rgba(245,202,232,.5)",  c: "#9d3a7a" },
  Summary:   { i: "summary",   bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)", typeBg: "#d1fae5",               c: "#059669" },
  FIB:       { i: "fib",       bg: "linear-gradient(135deg, #fef3c7, #fde68a)", typeBg: "#fef3c7",               c: "#b45309" },
  QA:        { i: "qa",        bg: "linear-gradient(135deg, #e0daf5, #c3bee9)", typeBg: "rgba(140,152,228,.14)", c: "var(--text2)" }
};

export function Search() {
  const [mode, setMode] = useState("Files");
  const [q, setQ]       = useState("");

  const filtered = SEARCH_RES.filter(r =>
    r.title.toLowerCase().includes(q.toLowerCase()) ||
    r.by.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <div className="section-header">
        <SLabel>Search Public Files &amp; Users</SLabel>
        <span className="section-header-sub">{filtered.length} results</span>
      </div>

      {/* Search bar */}
      <div className="search-bar-big gap-14">
        <Ic n="search" s={16} c="var(--muted)" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search for study materials, folders, users..."
        />
      </div>

      {/* Mode toggles */}
      <div className="search-toggles gap-20">
        {["Files", "Users"].map(m => (
          <button
            key={m}
            className={`search-toggle ${mode === m ? "active" : ""}`}
            onClick={() => setMode(m)}
          >
            <Ic n={m === "Files" ? "files" : "users"} s={13} />
            {m}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="empty-outputs mt-12">
          <Ic n="search" s={32} c="var(--lav)" />
          <div className="empty-outputs-title">No results found</div>
          <div className="empty-outputs-sub">Try a different search term</div>
        </div>
      ) : (
        filtered.map(r => {
          const style = RESULT_TYPES[r.type] || RESULT_TYPES.Flashcard;

          return (
            <div key={r.id} className="result-card">
              <div 
                className="result-thumb" 
                style={{ background: style.bg }}
              >
                <Ic n={style.i} s={20} c={style.c} />
              </div>
              <div className="result-info">
                <div className="result-name">{r.title}</div>
                <div className="result-meta">{r.by}</div>
              </div>
              <div className="result-badges">
                <Badge bg={style.typeBg} cl={style.c}>{r.type}</Badge>
                <Badge bg="#d1fae5" cl="#059669">Public</Badge>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}