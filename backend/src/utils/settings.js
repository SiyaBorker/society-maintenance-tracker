const prisma = require('../config/db');

const DEFAULT_THRESHOLD = Number(process.env.DEFAULT_OVERDUE_THRESHOLD_DAYS) || 7;

/**
 * Reads the singleton settings row, creating it on first use (id=1) so the
 * app works even before anyone has hit the settings endpoint. This is the
 * single source of truth the rest of the app reads the overdue threshold
 * from.
 */
async function getSettings() {
  let settings = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.setting.create({
      data: { id: 1, overdueThresholdDays: DEFAULT_THRESHOLD },
    });
  }
  return settings;
}

module.exports = { getSettings, DEFAULT_THRESHOLD };
