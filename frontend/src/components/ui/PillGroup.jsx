export function PillGroup({ options, value, onChange }) {
  return (
    <div className="pill-group">
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`pill-btn ${value === o ? "pill-active" : ""}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}