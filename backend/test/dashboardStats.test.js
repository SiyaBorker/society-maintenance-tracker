const { test } = require('node:test');
const assert = require('node:assert/strict');
const { complaintsByDay, avgResolutionDays } = require('../src/utils/dashboardStats');

test('complaintsByDay returns `days` entries, all zero, when there are no complaints', () => {
  const now = new Date('2026-08-20T12:00:00Z');
  const result = complaintsByDay([], 14, now);
  assert.equal(result.length, 14);
  assert.ok(result.every((d) => d.count === 0));
});

test('complaintsByDay is oldest-first and ends on today', () => {
  const now = new Date('2026-08-20T12:00:00Z');
  const result = complaintsByDay([], 3, now);
  assert.deepEqual(
    result.map((d) => d.date),
    ['2026-08-18', '2026-08-19', '2026-08-20']
  );
});

test('complaintsByDay counts multiple complaints on the same day', () => {
  const now = new Date('2026-08-20T12:00:00Z');
  const complaints = [
    { createdAt: '2026-08-19T01:00:00Z' },
    { createdAt: '2026-08-19T23:00:00Z' },
    { createdAt: '2026-08-20T00:00:01Z' },
  ];
  const result = complaintsByDay(complaints, 3, now);
  const byDate = Object.fromEntries(result.map((d) => [d.date, d.count]));
  assert.equal(byDate['2026-08-18'], 0);
  assert.equal(byDate['2026-08-19'], 2);
  assert.equal(byDate['2026-08-20'], 1);
});

test('complaintsByDay fills gap days with 0 rather than skipping them', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaints = [{ createdAt: '2026-08-16T00:00:00Z' }, { createdAt: '2026-08-20T00:00:00Z' }];
  const result = complaintsByDay(complaints, 5, now);
  assert.deepEqual(
    result.map((d) => d.count),
    [1, 0, 0, 0, 1] // 08-16, 08-17, 08-18, 08-19, 08-20
  );
});

test('complaintsByDay ignores complaints outside the window', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaints = [{ createdAt: '2026-07-01T00:00:00Z' }]; // long before the 14-day window
  const result = complaintsByDay(complaints, 14, now);
  assert.ok(result.every((d) => d.count === 0));
});

test('avgResolutionDays is null when no complaints are resolved', () => {
  const complaints = [
    { createdAt: '2026-08-01T00:00:00Z', resolvedAt: null },
    { createdAt: '2026-08-02T00:00:00Z', resolvedAt: null },
  ];
  assert.equal(avgResolutionDays(complaints), null);
});

test('avgResolutionDays is null for an empty list', () => {
  assert.equal(avgResolutionDays([]), null);
});

test('avgResolutionDays computes exact days for a single resolved complaint', () => {
  const complaints = [{ createdAt: '2026-08-01T00:00:00Z', resolvedAt: '2026-08-04T00:00:00Z' }];
  assert.equal(avgResolutionDays(complaints), 3);
});

test('avgResolutionDays averages across multiple resolved complaints', () => {
  const complaints = [
    { createdAt: '2026-08-01T00:00:00Z', resolvedAt: '2026-08-03T00:00:00Z' }, // 2 days
    { createdAt: '2026-08-01T00:00:00Z', resolvedAt: '2026-08-05T00:00:00Z' }, // 4 days
  ];
  assert.equal(avgResolutionDays(complaints), 3);
});

test('avgResolutionDays ignores unresolved complaints mixed in with resolved ones', () => {
  const complaints = [
    { createdAt: '2026-08-01T00:00:00Z', resolvedAt: '2026-08-03T00:00:00Z' }, // 2 days
    { createdAt: '2026-08-01T00:00:00Z', resolvedAt: null },
  ];
  assert.equal(avgResolutionDays(complaints), 2);
});
