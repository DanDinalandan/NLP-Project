import { useState, useEffect, useRef } from "react";

export function useTimer(initialSeconds = 120, running = true) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const ref = useRef(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setSeconds(v => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  const reset = () => setSeconds(initialSeconds);
  const stop  = () => clearInterval(ref.current);

  const mins      = String(Math.floor(seconds / 60));
  const secs      = String(seconds % 60).padStart(2, "0");
  const formatted = `${mins}:${secs}`;

  return { seconds, formatted, reset, stop };
}