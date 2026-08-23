const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { getSettings } = require('../utils/settings');
const { isOverdue, MS_PER_DAY } = require('../utils/overdue');
const { complaintsByDay, avgResolutionDays } = require('../utils/dashboardStats');

const COMPLAINTS_BY_DAY_WINDOW = 14;

// GET /api/dashboard  (admin only)
// Total complaints by status, by category, count of overdue complaints,
// a 14-day daily complaint volume series, and average resolution time.
const getDashboard = asyncHandler(async (req, res) => {
  const windowStart = new Date(Date.now() - COMPLAINTS_BY_DAY_WINDOW * MS_PER_DAY);

  const [byStatusRaw, byCategoryRaw, settings, openAndInProgress, recentComplaints, resolvedComplaints] =
    await Promise.all([
      prisma.complaint.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.complaint.groupBy({ by: ['category'], _count: { _all: true } }),
      getSettings(),
      // Only non-resolved complaints can possibly be overdue, so this keeps
      // the overdue scan cheap instead of pulling every complaint ever filed.
      prisma.complaint.findMany({
        where: { status: { not: 'RESOLVED' } },
        select: { id: true, status: true, createdAt: true },
      }),
      prisma.complaint.findMany({
        where: { createdAt: { gte: windowStart } },
        select: { createdAt: true },
      }),
      prisma.complaint.findMany({
        where: { resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
    ]);

  const byStatus = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
  byStatusRaw.forEach((row) => {
    byStatus[row.status] = row._count._all;
  });

  const byCategory = {};
  byCategoryRaw.forEach((row) => {
    byCategory[row.category] = row._count._all;
  });

  const overdueCount = openAndInProgress.filter((c) =>
    isOverdue(c, settings.overdueThresholdDays)
  ).length;

  const totalComplaints = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const avgResolution = avgResolutionDays(resolvedComplaints);

  res.json({
    totalComplaints,
    byStatus,
    byCategory,
    overdueCount,
    overdueThresholdDays: settings.overdueThresholdDays,
    complaintsByDay: complaintsByDay(recentComplaints, COMPLAINTS_BY_DAY_WINDOW),
    // Rounded to 1 decimal for display — the pure util keeps full precision for testability.
    avgResolutionDays: avgResolution === null ? null : Math.round(avgResolution * 10) / 10,
  });
});

module.exports = { getDashboard };
