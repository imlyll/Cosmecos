/** Controlled dual-thumb price slider on a thin dark track with peach thumbs. */
export default function PriceRange({ min, max, value, onChange, step = 1 }) {
  const [lo, hi] = value;
  const span = Math.max(1, max - min);
  const left = ((lo - min) / span) * 100;
  const right = 100 - ((hi - min) / span) * 100;

  return (
    <div className="relative h-5">
      <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-line" />
      <div className="absolute top-1/2 h-px -translate-y-1/2 bg-ink" style={{ left: `${left}%`, right: `${right}%` }} />
      <input
        type="range"
        aria-label="Minimum price"
        min={min}
        max={max}
        step={step}
        value={lo}
        onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])}
        className="range-thumb absolute inset-0 w-full"
      />
      <input
        type="range"
        aria-label="Maximum price"
        min={min}
        max={max}
        step={step}
        value={hi}
        onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
        className="range-thumb absolute inset-0 w-full"
      />
    </div>
  );
}
