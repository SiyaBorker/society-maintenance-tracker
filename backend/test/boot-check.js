// Boots the real Express app (with Prisma mocked, see _mockPrismaHook.js)
// and hits a handful of routes to catch wiring mistakes: missing imports,
// bad middleware order, typo'd paths, JSON parsing, auth guards. This is a
// smoke test, not a substitute for real DB-backed integration testing on a
// machine that can reach binaries.prisma.sh.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

const createApp = require('../src/app');

async function main() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  let failures = 0;
  const check = async (label, fn) => {
    try {
      await fn();
      console.log(`PASS  ${label}`);
    } catch (err) {
      failures++;
      console.error(`FAIL  ${label} —`, err.message);
    }
  };

  await check('GET /health returns ok', async () => {
    const res = await fetch(`${base}/health`);
    const body = await res.json();
    if (res.status !== 200 || body.status !== 'ok') throw new Error(`got ${res.status} ${JSON.stringify(body)}`);
  });

  await check('GET /api/complaints with no token -> 401', async () => {
    const res = await fetch(`${base}/api/complaints`);
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  await check('GET /api/dashboard with no token -> 401', async () => {
    const res = await fetch(`${base}/api/dashboard`);
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  await check('POST /api/auth/register with bad body -> 400 validation error', async () => {
    const res = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    const body = await res.json();
    if (res.status !== 400 || !body.error) throw new Error(`got ${res.status} ${JSON.stringify(body)}`);
  });

  await check('unknown route -> 404 JSON', async () => {
    const res = await fetch(`${base}/api/does-not-exist`);
    if (res.status !== 404) throw new Error(`expected 404, got ${res.status}`);
  });

  const jwt = require('jsonwebtoken');
  const residentToken = jwt.sign(
    { id: 'resident-1', role: 'RESIDENT', email: 'r@test.com', name: 'R' },
    process.env.JWT_SECRET
  );
  const adminToken = jwt.sign(
    { id: 'admin-1', role: 'ADMIN', email: 'a@test.com', name: 'A' },
    process.env.JWT_SECRET
  );

  await check('GET /api/complaints with resident token -> 200 (mocked DB)', async () => {
    const res = await fetch(`${base}/api/complaints`, {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    if (res.status !== 200) throw new Error(`expected 200, got ${res.status} ${await res.text()}`);
  });

  await check('POST /api/complaints as RESIDENT with invalid category -> 400', async () => {
    const res = await fetch(`${base}/api/complaints`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'NOT_A_CATEGORY', description: 'test complaint' }),
    });
    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
  });

  await check('POST /api/complaints as ADMIN -> 403 (residents only)', async () => {
    const res = await fetch(`${base}/api/complaints`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'PLUMBING', description: 'leak in bathroom' }),
    });
    if (res.status !== 403) throw new Error(`expected 403, got ${res.status}`);
  });

  await check('PATCH /api/complaints/:id/status as RESIDENT -> 403 (admin only)', async () => {
    const res = await fetch(`${base}/api/complaints/${'11111111-1111-4111-8111-111111111111'}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${residentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED' }),
    });
    if (res.status !== 403) throw new Error(`expected 403, got ${res.status}`);
  });

  await check('GET /api/dashboard as ADMIN -> 200 (mocked DB)', async () => {
    const res = await fetch(`${base}/api/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`expected 200, got ${res.status} ${await res.text()}`);
  });

  await check('GET /api/notices with resident token -> 200', async () => {
    const res = await fetch(`${base}/api/notices`, {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    if (res.status !== 200) throw new Error(`expected 200, got ${res.status}`);
  });

  await check('POST /api/notices as RESIDENT -> 403 (admin only)', async () => {
    const res = await fetch(`${base}/api/notices`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'x', body: 'y' }),
    });
    if (res.status !== 403) throw new Error(`expected 403, got ${res.status}`);
  });

  server.close();

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
  console.log('\nAll boot-check smoke tests passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
