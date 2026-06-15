import { Card }       from "../components/ui/Card.jsx";
import { Ic }         from "../components/ui/Icons.jsx";
import { SLabel }     from "../components/ui/SLabel.jsx";
import { ACHIEVEMENTS }               from "../data/gamification.js";
import { useStore, getFolderMasteryPct } from "../store/useStore.js";
import { getLevelTitle, xpForLevel }     from "../data/gamification.js";

export function Progress() {
  const user               = useStore(s => s.user);
  const earnedAchievements = useStore(s => s.earnedAchievements);
  const reviewSessionCount = useStore(s => s.reviewSessionCount);
  const reviewerCount      = useStore(s => s.reviewerCount);
  const totalTermsMastered = useStore(s => s.totalTermsMastered);

  // Stable slice selectors — no new arrays created inside selector
  const folders       = useStore(s => s.folders);
  const masteredCards = useStore(s => s.masteredCards);
  const masteredMCQs  = useStore(s => s.masteredMCQs);
  const flashcardsMap = useStore(s => s.flashcards);
  const mcqsMap       = useStore(s => s.mcqs);

  const foldersWithMastery = folders.map(f => ({
    ...f,
    mastery: getFolderMasteryPct({ masteredCards, masteredMCQs, flashcards: flashcardsMap, mcqs: mcqsMap }, f.id),
  }));

  // Real stats derived from store
  const totalFc  = Object.values(flashcardsMap).reduce((s, arr) => s + arr.length, 0);
  const totalMcq = Object.values(mcqsMap).reduce((s, arr) => s + arr.length, 0);
  const mastFc   = Object.values(masteredCards).reduce((s, obj) => s + Object.keys(obj).length, 0);
  const mastMcq  = Object.values(masteredMCQs).reduce((s, obj) => s + Object.keys(obj).length, 0);
  const fcPct    = totalFc  > 0 ? Math.round((mastFc  / totalFc)  * 100) : 0;
  const mcqPct   = totalMcq > 0 ? Math.round((mastMcq / totalMcq) * 100) : 0;

  const stats = [
    { label: "Level",            val: `${user.level}`,           sub: getLevelTitle(user.level) },
    { label: "Terms Mastered",   val: `${totalTermsMastered}`,   sub: `${totalFc + totalMcq} total terms` },
    { label: "Review Sessions",  val: `${reviewSessionCount}`,   sub: `${reviewerCount} reviewers created` },
    { label: "Folders",          val: `${folders.length}`,       sub: `${folders.filter(f => f.outputCount > 0).length} with outputs` },
  ];

  const levelTitle = getLevelTitle(user.level);
  const xpMax      = user.xpMax ?? xpForLevel(user.level);
  const xpPct      = Math.min(100, Math.round((user.xp / xpMax) * 100));

  const earnedCount = ACHIEVEMENTS.filter(a => earnedAchievements[a.id]).length;
  const isOnline    = navigator.onLine; // only used for the sharing notice

  return (
    <>
      <SLabel className="gap-18">Overview</SLabel>

      {/* Offline XP notice */}
      {!isOnline && (
        <div className="offline-xp-notice gap-14">
          <Ic n="shield" s={14} />
          You&rsquo;re offline — search and public sharing are unavailable, but everything else works normally.
        </div>
      )}

      {/* Stat tiles */}
      <div className="stats-grid">
        {stats.map(s => <StatTile key={s.label} stat={s} />)}
      </div>

      {/* ── XP / Level bar ── */}
      <Card className="card-flat">
        <div className="xp-header">
          <div className="xp-level-info">
            <span className="xp-level-num">Lv.{user.level}</span>
            <span className="xp-level-title">{levelTitle}</span>
            <span className="xp-level-arrow">→</span>
            <span className="xp-level-num xp-level-next">Lv.{Math.min(100, user.level + 1)}</span>
          </div>
          <span className="xp-val">{user.xp} / {xpMax} XP</span>
        </div>
        <div className="progress-track progress-track-full progress-track-lg">
          <div className="progress-fill" style={{ width: `${xpPct}%` }} />
        </div>
        <div className="xp-rule-hint">
          +1 XP per 5 terms mastered · +5 XP at 95% folder mastery · +10 XP at 100% · online only
        </div>
      </Card>

      {/* ── Quick stats ── */}
      <div className="quick-stats-row gap-20">
        <div className="quick-stat-pill">
          <div className="quick-stat-val">{totalTermsMastered}</div>
          <div className="quick-stat-lbl">Terms mastered</div>
        </div>
        <div className="quick-stat-pill">
          <div className="quick-stat-val">{reviewSessionCount}</div>
          <div className="quick-stat-lbl">Review sessions</div>
        </div>
        <div className="quick-stat-pill">
          <div className="quick-stat-val">{reviewerCount}</div>
          <div className="quick-stat-lbl">Reviewers created</div>
        </div>
        <div className="quick-stat-pill">
          <div className="quick-stat-val">{earnedCount} / {ACHIEVEMENTS.length}</div>
          <div className="quick-stat-lbl">Achievements</div>
        </div>
      </div>


      {/* ── Folder Mastery ── */}
      {foldersWithMastery.length > 0 && (
        <Card className="gap-20">
          <SLabel className="gap-12">FOLDER MASTERY</SLabel>
          <div className="mastery-list">
            {foldersWithMastery.map(folder => {
              const pct    = folder.mastery;
              const color  = pct === null ? 'var(--muted)'
                           : pct >= 100  ? '#059669'
                           : pct >= 95   ? '#10b981'
                           : 'var(--blue)';
              return (
                <div key={folder.id} className="mastery-row">
                  <div className="mastery-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Ic n="folder" s={13} c="var(--muted)" />
                      {folder.name}
                    </span>
                    <span style={{ color, fontWeight: 700 }}>
                      {pct === null ? '—' : `${pct}%`}
                    </span>
                  </div>
                  <div className="progress-track-full progress-track-md">
                    <div className="fc-fill" style={{ width: `${pct ?? 0}%`, background: color }} />
                  </div>
                  {pct === null && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      No outputs generated yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Achievements ── */}
      <Card className="gap-20">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SLabel className="gap-12">ACHIEVEMENTS</SLabel>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {earnedCount} / {ACHIEVEMENTS.length} unlocked
          </span>
        </div>
        <div className="achievements-grid">
          {ACHIEVEMENTS.map(ach => {
            const earned = !!earnedAchievements[ach.id];
            return (
              <div key={ach.id} className={`ach-card${earned ? ' ach-card--earned' : ' ach-card--locked'}`}>
                <div className="ach-card-icon">{ach.icon}</div>
                <div className="ach-card-body">
                  <div className="ach-card-name">{ach.label}</div>
                  <div className="ach-card-desc">{ach.desc}</div>
                  <div className="ach-card-xp">+{ach.xp} XP</div>
                </div>
                {earned && <div className="ach-card-check">✓</div>}
              </div>
            );
          })}
        </div>
      </Card>


      {/* Accuracy */}
      <AccuracyCard fcPct={fcPct} mcqPct={mcqPct} />
    </>
  );
}

function StatTile({ stat }) {
  return (
    <Card className="stat-tile">
      <SLabel>{stat.label}</SLabel>
      <div className="stat-val">{stat.val}</div>
      <div className="stat-sub">{stat.sub}</div>
    </Card>
  );
}

function AccuracyCard({ fcPct, mcqPct }) {
  const types = [
    { label: "Flashcards", pct: fcPct,  icon: "flashcard", color: "var(--blue)" },
    { label: "MCQ",        pct: mcqPct, icon: "mcq",       color: "#F296D8"     },
  ];
  return (
    <Card>
      <SLabel className="gap-12">MASTERY BY TYPE</SLabel>
      <div className="acc-list">
        {types.map(acc => (
          <div key={acc.label} className="acc-row">
            <div className="acc-name">
              <Ic n={acc.icon} s={16} c={acc.color} />
              {acc.label}
            </div>
            <div className="progress-track-full acc-track">
              <div className="fc-fill" style={{ width: `${acc.pct}%`, background: acc.color }} />
            </div>
            <div className="acc-pct" style={{ color: acc.color }}>{acc.pct}%</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
