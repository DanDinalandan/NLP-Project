import { useEffect } from "react";
import { useStore } from "../store/useStore.js";

const AUTO_DISMISS_MS = 5000;

export function AchievementToast() {
  const queue   = useStore(s => s.achievementQueue);
  const dismiss = useStore(s => s.dismissAchievement);

  const current = queue[0];

  // Auto-dismiss the current toast after 5 s.
  // Re-runs whenever the front of the queue changes.
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;

  return (
    <div className="ach-toast-wrap" role="alert" aria-live="polite">
      <div className="ach-toast">
        <div className="ach-toast-icon">{current.icon ?? '🏆'}</div>
        <div className="ach-toast-body">
          <div className="ach-toast-header">Achievement Unlocked!</div>
          <div className="ach-toast-name">{current.label}</div>
          <div className="ach-toast-desc">{current.desc}</div>
          <div className="ach-toast-xp">+{current.xp} XP</div>
        </div>
        <button className="ach-toast-close" onClick={dismiss} aria-label="Dismiss">✕</button>
      </div>

      {/* Show a count badge if more are queued */}
      {queue.length > 1 && (
        <div className="ach-toast-more">+{queue.length - 1} more</div>
      )}
    </div>
  );
}
