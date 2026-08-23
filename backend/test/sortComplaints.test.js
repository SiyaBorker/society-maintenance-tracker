const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sortForAdminView } = require('../src/utils/sortComplaints');

test('overdue complaints always sort before non-overdue ones', () => {
  const input = [
    { id: 'a', isOverdue: false, priority: 'HIGH', createdAt: '2026-08-19T00:00:00Z' },
    { id: 'b', isOverdue: true, priority: 'LOW', createdAt: '2026-08-01T00:00:00Z' },
  ];
  const result = sortForAdminView(input);
  assert.deepEqual(result.map((c) => c.id), ['b', 'a']);
});

test('within the same overdue-ness, higher priority sorts first', () => {
  const input = [
    { id: 'low', isOverdue: false, priority: 'LOW', createdAt: '2026-08-10T00:00:00Z' },
    { id: 'high', isOverdue: false, priority: 'HIGH', createdAt: '2026-08-10T00:00:00Z' },
    { id: 'med', isOverdue: false, priority: 'MEDIUM', createdAt: '2026-08-10T00:00:00Z' },
  ];
  const result = sortForAdminView(input);
  assert.deepEqual(result.map((c) => c.id), ['high', 'med', 'low']);
});

test('within same overdue + priority, newest first', () => {
  const input = [
    { id: 'old', isOverdue: false, priority: 'MEDIUM', createdAt: '2026-08-01T00:00:00Z' },
    { id: 'new', isOverdue: false, priority: 'MEDIUM', createdAt: '2026-08-15T00:00:00Z' },
  ];
  const result = sortForAdminView(input);
  assert.deepEqual(result.map((c) => c.id), ['new', 'old']);
});

test('does not mutate the input array', () => {
  const input = [
    { id: 'a', isOverdue: false, priority: 'LOW', createdAt: '2026-08-01T00:00:00Z' },
    { id: 'b', isOverdue: true, priority: 'LOW', createdAt: '2026-08-02T00:00:00Z' },
  ];
  const copy = [...input];
  sortForAdminView(input);
  assert.deepEqual(input, copy);
});
