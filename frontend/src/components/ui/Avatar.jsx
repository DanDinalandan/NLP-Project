export function Avatar({ letter = "N", size = 32, onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={`avatar ${onClick ? "avatar-clickable" : ""} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {letter}
    </div>
  );
}