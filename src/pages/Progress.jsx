import { Btn }        from "../components/ui/Btn.jsx";
import { Card }       from "../components/ui/Card.jsx";
import { Ic }         from "../components/ui/Icons.jsx";
import { SLabel }     from "../components/ui/SLabel.jsx";
import { STATS, ACTIVITY, ACC_TYPES, BADGES } from "../data/mockData.js";
import { useStore }   from "../store/useStore.js";

export function Progress() {
  const user = useStore((state) => state.user);
  const addXp = useStore((state) => state.addXp);
  const masteryData = useStore((state) => state.masteryData);

  return (
    <>
      <SLabel className="gap-18">Overview</SLabel>

      {/* Stat tiles */}
      <div className="stats-grid">
        {STATS.map(s => <StatTile key={s.label} stat={s} />)}
      </div>

      {/* ── XP Bar ── */}
      <Card className="card-flat">
        <div className="xp-header">
          <div>
            <span>Level {user.level} → {user.level + 1}</span>
            <span className="xp-val">{user.xp} / {user.xpMax} XP</span>
          </div>
          
          <Btn variant="primary" size="sm" onClick={() => addXp(150)}>
            +150 XP
          </Btn>
        </div>

        <div className="progress-track progress-track-full progress-track-lg">
          <div 
            className="progress-fill" 
            style={{ width: `${(user.xp / user.xpMax) * 100}%` }} 
          />
        </div>
      </Card>

      {/* Activity heatmap */}
      <Card className="gap-20">
        <SLabel className="gap-14">Activity — Last 4 Weeks</SLabel>
        <div className="heatmap-grid">
          {ACTIVITY.map((v, i) => (
            <div
              key={i}
              className="hm-cell"
              style={{ background: ["#F7E6A1", "#F5C1E6", "#B5E4F5", "#a7f3d0"][v] }}
            />
          ))}
        </div>
        <div className="hm-legend">
          <span>Less</span>
          {["#F7E6A1", "#F5C1E6", "#B5E4F5", "#a7f3d0"].map((c, i) => (
            <div key={i} className="hm-legend-box" style={{ background: c }} />
          ))}
          <span>More</span>
        </div>
      </Card>

      {/* ── Topic Mastery ── */}
      <Card className="gap-20">
        <SLabel className="gap-12">TOPIC MASTERY</SLabel>
        <div className="mastery-list">
          {masteryData.map(item => {
            const pct = Math.round((item.score / item.total) * 100);
            
            const typeColors = {
              "Flashcard": "var(--blue)",
              "MCQ": "#F296D8",
              "FIB": "#F7DE77",
              "Summary": "#059669",
              "QA": "var(--text2)"
            };
            const color = typeColors[item.type] || "var(--blue)";

            return (
              <div key={item.id} className="mastery-row">
                <div className="mastery-header">
                  <span>{item.name}</span>
                  <span style={{ color }}>{pct}% ({item.score}/{item.total})</span>
                </div>
                
                <div className="progress-track-full progress-track-md">
                  <div 
                    className="fc-fill"
                    style={{ 
                      width: `${pct}%`, 
                      background: color 
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Accuracy + Badges */}
      <div className="bottom-two">
        <AccuracyCard />
        <BadgesCard />
      </div>
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

function AccuracyCard() {
  return (
    <Card>
      <div className="acc-list">
        {ACC_TYPES.map(acc => {
          const typeColors = {
            "Flashcards": "var(--blue)",
            "MCQ": "#F296D8",
            "Fill-in-blank": "#F7DE77"
          };
          const barColor = typeColors[acc.label] || "var(--blue)";

          return (
            <div key={acc.label} className="acc-row">
              <div className="acc-name">
                <Ic n={acc.icon} s={16} c={barColor} />
                {acc.label}
              </div>
              <div className="progress-track-full acc-track">
                <div className="fc-fill" style={{ width: `${acc.pct}%`, background: barColor }} />
              </div>
              <div className="acc-pct" style={{ color: barColor }}>{acc.pct}%</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BadgesCard() {
  return (
    <Card>
      <SLabel className="gap-14">Badges Earned</SLabel>
      <div className="badges-wrap">
        {BADGES.map(b => (
          <div key={b.n} className={`badge-item ${!b.ok ? "badge-locked" : ""}`}>
            <div className="badge-circle">{b.e}</div>
            <div className="badge-name">{b.n}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}