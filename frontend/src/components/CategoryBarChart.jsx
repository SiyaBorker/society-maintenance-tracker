import { categoryLabel } from '../utils/constants';

// A small, dependency-free horizontal bar chart for "complaints by category".
// Single sequential hue (magnitude, not identity) per the project's chart
// guidelines — categories aren't compared across other charts here, so one
// hue keeps the read to "which category has the most", not "which color is
// which category".
const BAR_COLOR = '#0d9488';
const TRACK_COLOR = '#f1f5f9';

export default function CategoryBarChart({ data }) {
  const entries = Object.entries(data).filter(([, count]) => count > 0);
  if (entries.length === 0) return <p className="muted">No complaints yet.</p>;

  const max = Math.max(...entries.map(([, count]) => count));
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);

  return (
    <div className="bar-chart" role="img" aria-label="Complaints by category">
      {sorted.map(([category, count]) => {
        const pct = max === 0 ? 0 : (count / max) * 100;
        return (
          <div className="bar-chart__row" key={category}>
            <span className="bar-chart__label">{categoryLabel(category)}</span>
            <div className="bar-chart__track" style={{ background: TRACK_COLOR }}>
              <div
                className="bar-chart__fill"
                style={{ width: `${pct}%`, background: BAR_COLOR }}
              />
            </div>
            <span className="bar-chart__value">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
