export function ProgressBar({ pct, h = 8 }) {
  return (
    <div className="progress-track" style={{ height: h }}>
      <div className="progress-fill" style={{ width: `${pct}%`, height: h }} />
    </div>
  );
}