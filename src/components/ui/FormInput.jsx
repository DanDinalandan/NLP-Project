export function FormInput({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input"
      />
    </div>
  );
}