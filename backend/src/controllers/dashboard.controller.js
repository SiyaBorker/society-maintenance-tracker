const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { getSettings } = require('../utils/settings');
const { isOverdue } = require('../utils/overdue');

// GET /api/dashboard  (admin only)
// Total complaints by status, by category, and count of overdue complaints.
const getDashboard = asyncHandler(async (req, res) => {
  const [byStatusRaw, byCategoryRaw, settings, openAndInProgress] = await Promise.all([
    prisma.complaint.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.complaint.groupBy({ by: ['category'], _count: { _all: true } }),
    getSettings(),
    // Only non-resolved complaints can possibly be overdue, so this keeps
    // the overdue scan cheap instead of pulling every complaint ever filed.
    prisma.complaint.findMany({
      where: { status: { not: 'RESOLVED' } },
      select: { id: true, status: true, createdAt: true },
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

  res.json({
    totalComplaints,
    byStatus,
    byCategory,
    overdueCount,
    overdueThresholdDays: settings.overdueThresholdDays,
  });
});

module.exports = { getDashboard };
