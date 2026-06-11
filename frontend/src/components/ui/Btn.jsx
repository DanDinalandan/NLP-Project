export function Btn({ children, variant = "primary", size = "md", onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size}`}
    >
      {children}
    </button>
  );
}