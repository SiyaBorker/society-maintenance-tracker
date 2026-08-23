const { PrismaClient } = require('@prisma/client');

// Single shared Prisma Client instance for the whole process.
// Reusing one instance (instead of `new PrismaClient()` per request) avoids
// exhausting the Postgres connection pool.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
