const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * A complaint is overdue when it is not yet Resolved and it has been open
 * for longer than the configurable threshold (in days), measured from
 * createdAt to now.
 *
 * Kept as a pure function (no DB/Date.now() side effects hidden inside a
 * class) so it's trivially unit-testable and reusable both for the single
 * complaint view and for list/dashboard aggregation.
 */
function isOverdue(complaint, thresholdDays, now = new Date()) {
  if (complaint.status === 'RESOLVED') return false;
  const ageMs = now.getTime() - new Date(complaint.createdAt).getTime();
  return ageMs > thresholdDays * MS_PER_DAY;
}

function daysOpen(complaint, now = new Date()) {
  const ageMs = now.getTime() - new Date(complaint.createdAt).getTime();
  return Math.floor(ageMs / MS_PER_DAY);
}

/** Adds `isOverdue` and `daysOpen` computed fields to a complaint (or list). */
function withOverdueFlag(complaint, thresholdDays, now = new Date()) {
  return {
    ...complaint,
    isOverdue: isOverdue(complaint, thresholdDays, now),
    daysOpen: daysOpen(complaint, now),
  };
}

function withOverdueFlags(complaints, thresholdDays, now = new Date()) {
  return complaints.map((c) => withOverdueFlag(c, thresholdDays, now));
}

module.exports = { isOverdue, daysOpen, withOverdueFlag, withOverdueFlags, MS_PER_DAY };
