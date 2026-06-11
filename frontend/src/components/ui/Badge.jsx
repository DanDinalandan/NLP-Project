export function Badge({ children, bg = "rgba(140,152,228,.14)", cl = "#6b77cc" }) {
  return (
    <span className="badge" style={{ background: bg, color: cl }}>
      {children}
    </span>
  );
}