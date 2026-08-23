const { MS_PER_DAY } = require('./overdue');

function toDateKey(date) {
  return date.toISOString().slice(0, 10); // 'YYYY-MM-DD', UTC
}

/**
 * Buckets complaints by the UTC calendar day they were raised on, across
 * the last `days` days including today (oldest first). Days with no
 * complaints are included as 0 rather than omitted, so the frontend can
 * chart a continuous line without gap-filling logic of its own.
 */
function complaintsByDay(complaints, days = 14, now = new Date()) {
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const counts = new Map();
  for (let i = days - 1; i >= 0; i--) {
    counts.set(toDateKey(new Date(startOfToday.getTime() - i * MS_PER_DAY)), 0);
  }

  complaints.forEach((c) => {
    const key = toDateKey(new Date(c.createdAt));
    if (counts.has(key)) {
      counts.set(key, counts.get(key) + 1);
    }
  });

  return Array.from(counts, ([date, count]) => ({ date, count }));
}

/**
 * Average number of days between creation and resolution, across all
 * resolved complaints passed in (complaints without a resolvedAt are
 * ignored). Null if none are resolved yet — there's no meaningful average
 * of zero data points.
 */
function avgResolutionDays(complaints) {
  const resolved = complaints.filter((c) => c.resolvedAt);
  if (resolved.length === 0) return null;

  const totalDays = resolved.reduce((sum, c) => {
    const ms = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
    return sum + ms / MS_PER_DAY;
  }, 0);

  return totalDays / resolved.length;
}

module.exports = { complaintsByDay, avgResolutionDays };
