const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getSettings } = require('../utils/settings');
const { withOverdueFlag, withOverdueFlags } = require('../utils/overdue');
const { sortForAdminView } = require('../utils/sortComplaints');
const { sendComplaintStatusEmail } = require('../services/notificationService');

const HISTORY_ORDER = { orderBy: { timestamp: 'asc' } };

// POST /api/complaints  (resident)
const createComplaint = asyncHandler(async (req, res) => {
  const { category, description } = req.body;

  const photoUrl = req.file ? req.file.path : null;
  const photoPublicId = req.file ? req.file.filename : null;

  const complaint = await prisma.complaint.create({
    data: {
      category,
      description,
      photoUrl,
      photoPublicId,
      residentId: req.user.id,
      history: {
        create: {
          status: 'OPEN',
          note: 'Complaint raised by resident',
          actorId: req.user.id,
          actorRole: req.user.role,
        },
      },
    },
    include: { history: HISTORY_ORDER },
  });

  const settings = await getSettings();
  res.status(201).json({ complaint: withOverdueFlag(complaint, settings.overdueThresholdDays) });
});

// GET /api/complaints
// Resident: only their own complaints.
// Admin: all complaints, filterable by category / status / date range,
// sorted overdue-first (see sortForAdminView).
const listComplaints = asyncHandler(async (req, res) => {
  const { category, status, dateFrom, dateTo, page = 1, limit = 50 } = req.query;

  const where = {};
  if (req.user.role === 'RESIDENT') {
    where.residentId = req.user.id;
  }
  if (category) where.category = category;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const take = Math.min(Number(limit) || 50, 200);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [total, complaints] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      include: {
        history: HISTORY_ORDER,
        resident: { select: { id: true, name: true, email: true, flatNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  const settings = await getSettings();
  let withFlags = withOverdueFlags(complaints, settings.overdueThresholdDays);

  if (req.user.role === 'ADMIN') {
    withFlags = sortForAdminView(withFlags);
  }

  res.json({
    complaints: withFlags,
    pagination: { total, page: Number(page) || 1, limit: take },
  });
});

// GET /api/complaints/:id
const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: req.params.id },
    include: {
      history: HISTORY_ORDER,
      resident: { select: { id: true, name: true, email: true, flatNumber: true } },
    },
  });

  if (!complaint) throw new ApiError(404, 'Complaint not found');
  if (req.user.role === 'RESIDENT' && complaint.residentId !== req.user.id) {
    throw new ApiError(403, 'You can only view your own complaints');
  }

  const settings = await getSettings();
  res.json({ complaint: withOverdueFlag(complaint, settings.overdueThresholdDays) });
});

// PATCH /api/complaints/:id/status  (admin)
const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const existing = await prisma.complaint.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Complaint not found');

  if (existing.status === 'RESOLVED') {
    throw new ApiError(400, 'This complaint is Resolved and closed — it can no longer be updated');
  }

  const complaint = await prisma.complaint.update({
    where: { id: req.params.id },
    data: {
      status,
      resolvedAt: status === 'RESOLVED' ? new Date() : existing.resolvedAt,
      history: {
        create: {
          status,
          note: note || null,
          actorId: req.user.id,
          actorRole: req.user.role,
        },
      },
    },
    include: {
      history: HISTORY_ORDER,
      resident: true,
    },
  });

  // Fire-and-forget-ish, but awaited so failures are logged, not lost.
  await sendComplaintStatusEmail({ resident: complaint.resident, complaint, newStatus: status, note });

  const settings = await getSettings();
  const { resident, ...rest } = complaint;
  res.json({ complaint: withOverdueFlag(rest, settings.overdueThresholdDays) });
});

// PATCH /api/complaints/:id/priority  (admin)
const updatePriority = asyncHandler(async (req, res) => {
  const { priority } = req.body;

  const existing = await prisma.complaint.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Complaint not found');

  const complaint = await prisma.complaint.update({
    where: { id: req.params.id },
    data: { priority },
    include: { history: HISTORY_ORDER },
  });

  const settings = await getSettings();
  res.json({ complaint: withOverdueFlag(complaint, settings.overdueThresholdDays) });
});

module.exports = { createComplaint, listComplaints, getComplaint, updateStatus, updatePriority };
