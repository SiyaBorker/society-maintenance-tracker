// Dev-only helper (never shipped/required in production) used purely to
// smoke-test that the Express app boots and every route file wires up
// correctly, without needing a real generated Prisma Client — which this
// sandbox can't build because it can't reach binaries.prisma.sh. On Render/
// Vercel/your own machine `npx prisma generate` works normally (unrestricted
// network) and this hook is never invoked.
const Module = require('module');

const chainable = () => {
  const handler = {
    get(target, prop) {
      if (prop === 'then') return undefined; // don't look like a thenable
      return (..._args) => makeThenable();
    },
  };
  function makeThenable() {
    const p = Promise.resolve(null);
    return new Proxy(p, handler);
  }
  return new Proxy({}, handler);
};

const LIST_METHODS = new Set(['findMany', 'groupBy']);
const COUNT_METHODS = new Set(['count']);
const WRITE_METHODS = new Set(['create', 'update', 'upsert']);

const fakeDelegate = new Proxy(
  {},
  {
    get(_target, methodName) {
      return (..._args) => {
        if (LIST_METHODS.has(methodName)) return Promise.resolve([]);
        if (COUNT_METHODS.has(methodName)) return Promise.resolve(0);
        if (WRITE_METHODS.has(methodName)) return Promise.resolve({ overdueThresholdDays: 7 });
        return Promise.resolve(null); // findUnique, findFirst, delete, ...
      };
    },
  }
);

class FakePrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target) return target[prop];
        return fakeDelegate;
      },
    });
  }
  $disconnect() {
    return Promise.resolve();
  }
}

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '@prisma/client') {
    return { PrismaClient: FakePrismaClient };
  }
  return originalLoad.apply(this, arguments);
};

console.log('[boot-check] @prisma/client mocked for wiring smoke test only');
