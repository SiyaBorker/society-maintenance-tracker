const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { getSettings } = require('../utils/settings');

// GET /api/settings
const getSettingsHandler = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.json({ settings });
});

// PATCH /api/settings  (admin only)
const updateSettings = asyncHandler(async (req, res) => {
  const { overdueThresholdDays } = req.body;
  const settings = await prisma.setting.upsert({
    where: { id: 1 },
    update: { overdueThresholdDays },
    create: { id: 1, overdueThresholdDays },
  });
  res.json({ settings });
});

module.exports = { getSettingsHandler, updateSettings };
