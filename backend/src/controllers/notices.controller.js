const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendImportantNoticeEmail } = require('../services/notificationService');

// GET /api/notices — everyone (resident + admin). Important notices pinned to top.
const listNotices = asyncHandler(async (req, res) => {
  const notices = await prisma.notice.findMany({
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: [{ isImportant: 'desc' }, { createdAt: 'desc' }],
  });
  res.json({ notices });
});

// POST /api/notices  (admin only)
const createNotice = asyncHandler(async (req, res) => {
  const { title, body, isImportant } = req.body;

  const notice = await prisma.notice.create({
    data: { title, body, isImportant: !!isImportant, authorId: req.user.id },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  if (notice.isImportant) {
    const residents = await prisma.user.findMany({
      where: { role: 'RESIDENT' },
      select: { id: true, name: true, email: true },
    });
    // Sequential-ish but simple; residents lists for a single society are
    // small (dozens, not thousands), so Promise.all is fine here.
    await Promise.all(residents.map((resident) => sendImportantNoticeEmail({ resident, notice })));
  }

  res.status(201).json({ notice });
});

// GET /api/notices/:id
const getNotice = asyncHandler(async (req, res) => {
  const notice = await prisma.notice.findUnique({
    where: { id: req.params.id },
    include: { author: { select: { id: true, name: true, role: true } } },
  });
  if (!notice) throw new ApiError(404, 'Notice not found');
  res.json({ notice });
});

module.exports = { listNotices, createNotice, getNotice };
