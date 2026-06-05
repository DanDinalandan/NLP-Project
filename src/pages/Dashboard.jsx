import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore.js";
import { Badge }  from "../components/ui/Badge.jsx";
import { Card }   from "../components/ui/Card.jsx";
import { Ic }     from "../components/ui/Icons.jsx";
import { SLabel } from "../components/ui/SLabel.jsx";
import { RECENTS } from "../data/mockData.js";

const RECENT_TYPES = {
  Flashcard: { i: "flashcard", bg: "linear-gradient(135deg, #eaecff, #c3bee9)", typeBg: "rgba(140,152,228,.14)", c: "#6b77cc" },
  MCQ:       { i: "mcq",       bg: "linear-gradient(135deg, #fce4f1, #f5cae8)", typeBg: "rgba(245,202,232,.5)",  c: "#9d3a7a" },
  Summary:   { i: "summary",   bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)", typeBg: "#d1fae5",               c: "#059669" },
  FIB:       { i: "fib",       bg: "linear-gradient(135deg, #fef3c7, #fde68a)", typeBg: "#fef3c7",               c: "#b45309" },
  QA:        { i: "qa",        bg: "linear-gradient(135deg, #e0daf5, #c3bee9)", typeBg: "rgba(140,152,228,.14)", c: "var(--text2)" }
};

export function Dashboard() {
  const navigate = useNavigate();
  const user = useStore(state => state.user);
  const folders = useStore(state => state.folders);

  return (
    <>
      <UserBanner user={user} />

      {/* Folders */}
      <div className="section-header">
        <SLabel>My Folders</SLabel>
        <button className="section-action" onClick={() => navigate("/studyfiles")}>
          + New folder
        </button>
      </div>
      <div className="folders-grid gap-28">
        {folders.map(f => (
          <FolderCard key={f.id} folder={f} onClick={() => navigate("/studyfiles")} />
        ))}
        <NewFolderCard onClick={() => navigate("/studyfiles")} />
      </div>

      {/* Recents */}
      <div className="section-header">
        <SLabel>Recently Viewed</SLabel>
        <button className="section-action" onClick={() => navigate("/studyfiles")}>
          See all →
        </button>
      </div>
      <div className="recents-grid">
        {RECENTS.map(r => {
          const style = RECENT_TYPES[r.type] || RECENT_TYPES.Flashcard;

          return (
            <div key={r.id} className="recent-card" onClick={() => navigate(`/studyfiles`)}>
              <div className="recent-thumb" style={{ background: style.bg }}>
                <Ic n={style.i} s={32} c={style.c} />
              </div>
              <div className="recent-body">
                <div className="recent-name">{r.name}</div>
                <div className="recent-time">{r.time}</div>
              </div>
              <div className="recent-footer">
                <Badge bg={style.typeBg} cl={style.c}>{r.type}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── user ──────────────────────────────────────────────────── */
function UserBanner({ user }) {
  const pct = (user.xp / user.xpMax) * 100;
  
  return (
    <div className="user-banner gap-28">
      <div className="user-text">
        <div className="user-name">Welcome back, {user.firstName}!</div>
        <div className="user-sub">
          You&rsquo;re on a {user.streak}-day streak. Keep studying to level up!
        </div>
        <div className="user-xp">
          <span className="user-xp-label">XP progress</span>
          <div className="user-xp-track">
            {/* Dynamic width MUST stay inline */}
            <div className="user-xp-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="user-xp-val">{user.xp}/{user.xpMax}</span>
        </div>
      </div>

      <div className="user-stats">
        {[["12", "Level"], [`${user.streak}`, "Day Streak"], [`${user.accuracy}%`, "Accuracy"]].map(([v, l]) => (
          <div key={l} className="stat-pill">
            <div className="stat-pill-val">{v}</div>
            <div className="stat-pill-lbl">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Folder card  ─────────────────────────────── */
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
      <div className="new-folder-sub">Create a folder</div>
    </div>
  );
}