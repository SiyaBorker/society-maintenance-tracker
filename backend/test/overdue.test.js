const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isOverdue, daysOpen, withOverdueFlag } = require('../src/utils/overdue');

test('a fresh OPEN complaint is not overdue', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaint = { status: 'OPEN', createdAt: '2026-08-19T00:00:00Z' };
  assert.equal(isOverdue(complaint, 7, now), false);
});

test('an OPEN complaint older than the threshold is overdue', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaint = { status: 'OPEN', createdAt: '2026-08-01T00:00:00Z' }; // 19 days old
  assert.equal(isOverdue(complaint, 7, now), true);
});

test('an IN_PROGRESS complaint older than the threshold is overdue', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaint = { status: 'IN_PROGRESS', createdAt: '2026-08-01T00:00:00Z' };
  assert.equal(isOverdue(complaint, 7, now), true);
});

test('a RESOLVED complaint is never overdue, no matter how old', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaint = { status: 'RESOLVED', createdAt: '2026-01-01T00:00:00Z' };
  assert.equal(isOverdue(complaint, 7, now), false);
});

test('exactly at the threshold boundary is not yet overdue (strictly greater-than)', () => {
  const now = new Date('2026-08-08T00:00:00Z');
  const complaint = { status: 'OPEN', createdAt: '2026-08-01T00:00:00Z' }; // exactly 7 days
  assert.equal(isOverdue(complaint, 7, now), false);
});

test('one millisecond past the threshold is overdue', () => {
  const now = new Date('2026-08-08T00:00:00.001Z');
  const complaint = { status: 'OPEN', createdAt: '2026-08-01T00:00:00Z' };
  assert.equal(isOverdue(complaint, 7, now), true);
});

test('daysOpen floors to whole days', () => {
  const now = new Date('2026-08-10T12:00:00Z');
  const complaint = { createdAt: '2026-08-01T00:00:00Z' };
  assert.equal(daysOpen(complaint, now), 9);
});

test('withOverdueFlag adds both computed fields without mutating the input', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaint = { id: '1', status: 'OPEN', createdAt: '2026-08-01T00:00:00Z' };
  const result = withOverdueFlag(complaint, 7, now);
  assert.equal(result.isOverdue, true);
  assert.equal(result.daysOpen, 19);
  assert.equal(complaint.isOverdue, undefined); // original untouched
});
