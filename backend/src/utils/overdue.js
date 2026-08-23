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

/**
 * Auto-escalates the *displayed* priority for complaints left open well past
 * the overdue threshold: LOW -> MEDIUM once overdue, MEDIUM -> HIGH once open
 * more than 2x the threshold, HIGH stays HIGH. Purely derived (like
 * isOverdue) — never written back to the database. The stored `priority`
 * field always remains whatever the admin explicitly set; this is only for
 * display so the frontend can flag "this needs attention even though it's
 * still marked Low/Medium".
 */
function effectivePriority(complaint, thresholdDays, now = new Date()) {
  if (complaint.status === 'RESOLVED') return complaint.priority;

  const ageMs = now.getTime() - new Date(complaint.createdAt).getTime();
  const thresholdMs = thresholdDays * MS_PER_DAY;

  if (complaint.priority === 'MEDIUM' && ageMs > thresholdMs * 2) return 'HIGH';
  if (complaint.priority === 'LOW' && ageMs > thresholdMs) return 'MEDIUM';
  return complaint.priority;
}

/** Adds `isOverdue`, `daysOpen`, and `effectivePriority` computed fields to a complaint (or list). */
function withOverdueFlag(complaint, thresholdDays, now = new Date()) {
  return {
    ...complaint,
    isOverdue: isOverdue(complaint, thresholdDays, now),
    daysOpen: daysOpen(complaint, now),
    effectivePriority: effectivePriority(complaint, thresholdDays, now),
  };
}

function withOverdueFlags(complaints, thresholdDays, now = new Date()) {
  return complaints.map((c) => withOverdueFlag(c, thresholdDays, now));
}

module.exports = {
  isOverdue,
  daysOpen,
  effectivePriority,
  withOverdueFlag,
  withOverdueFlags,
  MS_PER_DAY,
};
