// Simple hash of a string → integer
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

// Generate a GitHub-style 5×5 identicon (mirrored, so left 3 cols define all 5)
function buildIdenticon(seed) {
  const h = hash(seed || 'user');
  const grid = [];
  for (let row = 0; row < 5; row++) {
    const rowBits = [];
    for (let col = 0; col < 3; col++) {
      rowBits.push((h >> (row * 3 + col)) & 1);
    }
    // Mirror: [0,1,2,1,0]
    grid.push([rowBits[0], rowBits[1], rowBits[2], rowBits[1], rowBits[0]]);
  }
  return grid;
}

// Pick two hue-shifted colors from the seed
function identiconColors(seed) {
  const h = hash(seed || 'user');
  const hue1 = h % 360;
  const hue2 = (hue1 + 160) % 360;
  return {
    fg: `hsl(${hue1}, 60%, 52%)`,
    bg: `hsl(${hue2}, 30%, 92%)`,
  };
}

export function Avatar({ letter = "N", size = 32, onClick, className = "", seed }) {
  // If a seed is provided, render identicon; otherwise fall back to letter
  if (seed) {
    const grid   = buildIdenticon(seed);
    const colors = identiconColors(seed);
    const cell   = size / 5;

    return (
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ borderRadius: '50%', cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }}
        onClick={onClick}
        className={className}
      >
        <rect width={size} height={size} fill={colors.bg} />
        {grid.map((row, r) =>
          row.map((on, c) =>
            on ? (
              <rect
                key={`${r}-${c}`}
                x={c * cell} y={r * cell}
                width={cell} height={cell}
                fill={colors.fg}
              />
            ) : null
          )
        )}
      </svg>
    );
  }

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
