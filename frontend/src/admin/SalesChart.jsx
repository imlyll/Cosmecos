import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDay, formatPrice } from '../lib/format';

// Single-series magnitude chart. Bar colour validated with the dataviz palette checker
// (lightness band, chroma floor, >= 3:1 against the white card surface).
const BAR = '#b0604c';
const GRID = '#ede5dc';
const HEIGHT = 240;
const PAD = { top: 16, right: 8, bottom: 28, left: 52 };

/** Fills the last `days` UTC days (the API groups sales by UTC date) so empty days show as zero. */
function fillDays(data, days) {
  const byDate = new Map(data.map((d) => [d.date, d]));
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, day: d, revenue: byDate.get(key)?.revenue || 0, orders: byDate.get(key)?.orders || 0 });
  }
  return out;
}

function niceMax(v) {
  if (v <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].find((s) => s * pow >= v) * pow;
}

// Bar with a 4px rounded top, anchored square on the baseline.
function barPath(x, y, w, h) {
  if (h <= 0) return '';
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

const shortDate = (d) => formatDay(d, { year: false, utc: true });

export default function SalesChart({ data = [], days = 30 }) {
  const { t } = useTranslation();
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const series = useMemo(() => fillDays(data, days), [data, days]);
  const max = niceMax(Math.max(...series.map((d) => d.revenue)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const slot = innerW / series.length;
  const gap = 2; // surface gap between adjacent bars
  const barW = Math.max(1, slot - gap);
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const labelEvery = width < 480 ? 10 : 5;
  const total = series.reduce((s, d) => s + d.revenue, 0);

  const hovered = hover != null ? series[hover] : null;
  const tipLeft = hovered ? Math.min(Math.max(PAD.left + slot * hover + slot / 2, 80), width - 80) : 0;

  return (
    <div>
      <div ref={wrapRef} className="relative" onMouseLeave={() => setHover(null)}>
        <svg width={width} height={HEIGHT} role="img" aria-label={t('admin.chart.aria', { days, total: formatPrice(total) })}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
              <text x={PAD.left - 10} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-taupe text-[11px]">
                {t >= 1000 ? `$${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : `$${t}`}
              </text>
            </g>
          ))}
          {series.map((d, i) => {
            const x = PAD.left + slot * i + gap / 2;
            const top = y(d.revenue);
            return (
              <g key={d.date}>
                <path d={barPath(x, top, barW, PAD.top + innerH - top)} fill={BAR} opacity={hover == null || hover === i ? 1 : 0.45} />
                {i % labelEvery === (series.length - 1) % labelEvery && (
                  <text x={x + barW / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-taupe text-[11px]">
                    {shortDate(d.day)}
                  </text>
                )}
                {/* Hit target: the full column, much larger than the bar itself */}
                <rect
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={-1}
                />
              </g>
            );
          })}
          <line x1={PAD.left} x2={width - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="#d8cfc5" />
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 border border-line bg-white px-3 py-2 text-xs shadow-lg"
            style={{ left: tipLeft }}
          >
            <p className="text-taupe">{formatDay(hovered.day, { year: false, weekday: true, utc: true })}</p>
            <p className="mt-0.5 font-medium text-ink">{formatPrice(hovered.revenue)}</p>
            <p className="text-taupe">
              {t('admin.chart.orders', { count: hovered.orders })}
            </p>
          </div>
        )}
      </div>

      <details className="mt-3 text-xs text-taupe">
        <summary className="cursor-pointer select-none hover:text-ink">{t('admin.chart.viewTable')}</summary>
        <div className="mt-2 max-h-60 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-1 font-medium">{t('admin.chart.date')}</th>
                <th className="py-1 text-right font-medium">{t('admin.chart.orders')}</th>
                <th className="py-1 text-right font-medium">{t('admin.chart.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {series.filter((d) => d.orders > 0).map((d) => (
                <tr key={d.date} className="border-t border-line">
                  <td className="py-1">{shortDate(d.day)}</td>
                  <td className="py-1 text-right">{d.orders}</td>
                  <td className="py-1 text-right">{formatPrice(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
