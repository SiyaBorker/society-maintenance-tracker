require('dotenv').config();

const createApp = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 4000;

async function main() {
  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`Society Maintenance Tracker API listening on port ${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
