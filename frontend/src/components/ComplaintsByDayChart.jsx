import { format } from 'date-fns';

// Parsing "YYYY-MM-DD" via `new Date(str)` reads it as UTC midnight, which
// can render as the previous day once date-fns formats it in the viewer's
// local timezone. Appending a local-time suffix keeps the calendar day the
// backend intended regardless of the viewer's offset.
const parseDateOnly = (dateStr) => new Date(`${dateStr}T00:00:00`);

// A small, dependency-free line chart for "complaints raised per day".
// Same single sequential hue as CategoryBarChart — this is a magnitude
// series (count over time), not a categorical comparison.
const LINE_COLOR = '#2a78d6';

const WIDTH = 560;
const HEIGHT = 140;
const PADDING = 24;

export default function ComplaintsByDayChart({ data }) {
  if (!data || data.length === 0) return <p className="muted">No data yet.</p>;

  const max = Math.max(1, ...data.map((d) => d.count));
  const stepX = data.length > 1 ? (WIDTH - PADDING * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = PADDING + i * stepX;
    const y = HEIGHT - PADDING - (d.count / max) * (HEIGHT - PADDING * 2);
    return { x, y, count: d.count, date: d.date };
  });

  const linePath = points.map((p) => `${p.x},${p.y}`).join(' ');
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="sparkline-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Complaints raised per day over the last ${data.length} days, ${total} total`}
      >
        <polyline points={linePath} fill="none" stroke={LINE_COLOR} strokeWidth="2" />
        {points.map((p) => (
          <circle key={p.date} cx={p.x} cy={p.y} r="3" fill={LINE_COLOR}>
            <title>{`${format(parseDateOnly(p.date), 'd MMM')}: ${p.count}`}</title>
          </circle>
        ))}
      </svg>
      <div className="sparkline-chart__axis">
        <span>{format(parseDateOnly(data[0].date), 'd MMM')}</span>
        <span>{format(parseDateOnly(data[data.length - 1].date), 'd MMM')}</span>
      </div>
    </div>
  );
}
