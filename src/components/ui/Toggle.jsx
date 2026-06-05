export function Toggle({ checked, onChange }) {
  return (
    <label className="toggle-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="toggle-input"
      />
      <span className="toggle-track" />
      <span className="toggle-thumb" />
    </label>
  );
}