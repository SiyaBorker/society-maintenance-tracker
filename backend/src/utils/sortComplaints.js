const PRIORITY_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1 };

/**
 * Admin list view ordering: overdue complaints first (the brief requires
 * these "surface at the top"), then by priority (High > Medium > Low),
 * then newest first. Overdue is a computed value (createdAt + configurable
 * threshold), not a DB column, so this final sort happens in application
 * code after the DB query rather than in SQL — perfectly fine at the data
 * volumes a single society's complaints will ever reach.
 */
function sortForAdminView(complaints) {
  return [...complaints].sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    const pr = (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0);
    if (pr !== 0) return pr;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

module.exports = { sortForAdminView, PRIORITY_RANK };
