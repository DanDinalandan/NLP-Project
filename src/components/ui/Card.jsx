export function Card({ children, onClick, className = "", style: sx }) {
  const clickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={`card ${clickable ? "card-clickable" : ""} ${className}`}
      style={sx}
    >
      {children}
    </div>
  );
}