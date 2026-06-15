export function Btn({ children, variant = "primary", size = "md", onClick, disabled, type = "button", title }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`btn btn-${variant} btn-${size}`}
    >
      {children}
    </button>
  );
}