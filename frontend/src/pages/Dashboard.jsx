import { useNavigate } from "react-router-dom";
import { useStore, getFolderMasteryPct } from "../store/useStore.js";
import { getLevelTitle } from "../data/gamification.js";
import { Badge }  from "../components/ui/Badge.jsx";
import { Card }   from "../components/ui/Card.jsx";
import { Ic }     from "../components/ui/Icons.jsx";
import { SLabel } from "../components/ui/SLabel.jsx";

export function Dashboard() {
  const navigate      = useNavigate();
  const user          = useStore(s => s.user);
  const folders       = useStore(s => s.folders);
  const masteredCards = useStore(s => s.masteredCards);
  const masteredMCQs  = useStore(s => s.masteredMCQs);
  const flashcards    = useStore(s => s.flashcards);
  const mcqs          = useStore(s => s.mcqs);

  const foldersWithMastery = folders.map(f => ({
    ...f,
    mastery: getFolderMasteryPct({ masteredCards, masteredMCQs, flashcards, mcqs }, f.id),
  }));

  const openFolder = (folder) => {
    useStore.setState({ pendingFolderOpen: folder.id });
    navigate('/studyfiles');
  };

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
        {foldersWithMastery.map(f => (
          <FolderCard key={f.id} folder={f} onClick={() => openFolder(f)} />
        ))}
        <NewFolderCard onClick={() => navigate("/studyfiles")} />
      </div>

      {/* Recent folders */}
      {foldersWithMastery.length > 0 && (
        <>
          <div className="section-header">
            <SLabel>Recently Edited</SLabel>
            <button className="section-action" onClick={() => navigate("/studyfiles")}>
              See all →
            </button>
          </div>
          <div className="recents-grid">
            {foldersWithMastery.slice(-3).reverse().map(f => (
              <div key={f.id} className="recent-card" onClick={() => openFolder(f)}>
                <div className="recent-thumb" style={{ background: "linear-gradient(135deg,#eaecff,#c3bee9)" }}>
                  <Ic n="folder" s={32} c="#6b77cc" />
                </div>
                <div className="recent-body">
                  <div className="recent-name">{f.name}</div>
                  <div className="recent-time">{f.files} file{f.files !== 1 ? 's' : ''} · {f.edited}</div>
                </div>
                <div className="recent-footer">
                  <Badge bg="rgba(140,152,228,.14)" cl="#6b77cc">
                    {f.outputCount > 0 ? `${f.outputCount} outputs` : 'No outputs yet'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ── User banner ─────────────────────────────────────────── */
function UserBanner({ user }) {
  const pct        = Math.min(100, (user.xp / (user.xpMax || 1)) * 100);
  const levelTitle = getLevelTitle(user.level);

  return (
    <div className="user-banner gap-28">
      <div className="user-text">
        <div className="user-name">Welcome back, {user.firstName}!</div>
        <div className="user-title-row">
          <span className="user-level-badge">Lv.{user.level}</span>
          <span className="user-level-title">{levelTitle}</span>
        </div>
        <div className="user-sub">
          You&rsquo;re on a {user.streak}-day streak. Keep studying to level up!
        </div>
        <div className="user-xp">
          <span className="user-xp-label">XP progress</span>
          <div className="user-xp-track">
            <div className="user-xp-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="user-xp-val">{user.xp}/{user.xpMax}</span>
        </div>
      </div>

      <div className="user-stats">
        {[
          [`${user.level}`, "Level"],
          [`${user.streak}`, "Day Streak"],
          [`${user.accuracy}%`, "Accuracy"],
        ].map(([v, l]) => (
          <div key={l} className="stat-pill">
            <div className="stat-pill-val">{v}</div>
            <div className="stat-pill-lbl">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Folder card ─────────────────────────────────────────── */
function FolderCard({ folder, onClick }) {
  const bc = folder.pub
    ? { bg: "#d1fae5", cl: "#059669" }
    : { bg: "rgba(140,152,228,.14)", cl: "#6b77cc" };

  const mastery   = folder.mastery;
  const mastColor = mastery === null ? 'var(--lav)'
                  : mastery >= 100   ? '#059669'
                  : mastery >= 95    ? '#10b981'
                  : 'var(--blue)';

  return (
    <Card onClick={onClick} className="folder-card-inner">
      <div className="folder-icon-wrap">
        <Ic n="folder" s={20} />
      </div>
      <div className="folder-name">{folder.name}</div>
      <div className="folder-meta">{folder.files} files · last edited {folder.edited}</div>
      <Badge bg={bc.bg} cl={bc.cl}>{folder.pub ? "Public" : "Private"}</Badge>

      {/* Mastery mini-bar */}
      <div className="folder-mastery-wrap">
        <div className="folder-mastery-track">
          <div
            className="folder-mastery-fill"
            style={{ width: `${mastery ?? 0}%`, background: mastColor }}
          />
        </div>
        <span className="folder-mastery-label" style={{ color: mastColor }}>
          {mastery === null ? 'No data' : `${mastery}% mastered`}
        </span>
      </div>
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
